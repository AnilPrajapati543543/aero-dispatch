"""Order business service handling AWB generation, delivery calculation, tracking, and duplicate prevention."""
import hashlib
import random
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional, Tuple

from ..interfaces import (
    EventDispatcherInterface,
    OrderRepositoryInterface,
    StorageServiceInterface,
)
from ..utils.logger import get_logger
from ..utils.state_machine import validate_status_transition
from .event_service import event_dispatcher as default_event_dispatcher
from .storage_service import LocalStorageService

logger = get_logger("order_service")


class OrderService:
    """Business operations for AeroDispatch consignments."""

    def __init__(
        self,
        repository: Optional[OrderRepositoryInterface] = None,
        event_dispatcher: Optional[EventDispatcherInterface] = None,
        storage_service: Optional[StorageServiceInterface] = None,
    ):
        if repository:
            self.repo = repository
        else:
            # Prefer DynamoDB in AWS runtime, fallback to LocalOrderRepository in local dev
            try:
                from ..repository.dynamodb_repo import DynamoDBOrderRepository
                self.repo = DynamoDBOrderRepository()
            except (ImportError, Exception):
                from ..repository.local_repo import LocalOrderRepository
                self.repo = LocalOrderRepository()

        self.events = event_dispatcher or default_event_dispatcher
        self.storage = storage_service or LocalStorageService()

    @staticmethod
    def generate_awb_number() -> str:
        """Generates a Delhivery/AeroDispatch formatted tracking ID (e.g. AD-8849-2041)."""
        prefix = "AD"
        part1 = random.randint(1000, 9999)
        part2 = random.randint(1000, 9999)
        return f"{prefix}-{part1}-{part2}"

    @staticmethod
    def compute_fallback_idempotency_key(order_data: Dict[str, Any]) -> str:
        """
        Computes a deterministic fingerprint valid for a 2-minute window to
        safeguard against double-clicks or browser form resubmission.
        """
        sender_phone = order_data.get("sender", {}).get("phone", "")
        recipient_phone = order_data.get("recipient", {}).get("phone", "")
        declared_value = order_data.get("declaredValue", 0)
        weight_kg = order_data.get("weightKg", 0)
        service_tier = order_data.get("serviceTier", "")

        # 2-minute time bucket (120 seconds)
        time_bucket = int(datetime.now(timezone.utc).timestamp() // 120)

        raw_signature = f"{sender_phone}:{recipient_phone}:{declared_value}:{weight_kg}:{service_tier}:{time_bucket}"
        return f"auto-{hashlib.sha256(raw_signature.encode('utf-8')).hexdigest()[:32]}"

    def calculate_estimated_delivery(self, service_tier: str, base_time: datetime) -> str:
        """Calculates estimated delivery SLA based on logistics speed tier."""
        if service_tier == "AeroExpress Air":
            sla = base_time + timedelta(days=2)
        elif service_tier == "AeroHyperlocal Priority":
            sla = base_time + timedelta(hours=4)
        else:  # AeroSurface Standard
            sla = base_time + timedelta(days=4)
        return sla.isoformat()

    def create_order(
        self,
        validated_data: Dict[str, Any],
        client_idempotency_key: Optional[str] = None,
    ) -> Tuple[Dict[str, Any], bool]:
        """
        Creates and stores an order, checking for duplicate idempotent submissions.

        Returns:
            (order_dict, is_replay_boolean)
        """
        idempotency_key = (
            client_idempotency_key
            or validated_data.get("idempotencyKey")
            or self.compute_fallback_idempotency_key(validated_data)
        )

        # Check if an existing order was already manifested with this key
        existing_order = self.repo.get_order_by_idempotency_key(idempotency_key)
        if existing_order:
            logger.info(
                f"Idempotent replay detected. Returning existing consignment: {existing_order.get('orderId')}",
                extra={"extra": {"idempotencyKey": idempotency_key, "orderId": existing_order.get("orderId")}},
            )
            return existing_order, True

        now = datetime.now(timezone.utc)
        created_at_iso = now.isoformat()
        estimated_delivery_iso = self.calculate_estimated_delivery(
            validated_data.get("serviceTier", "AeroExpress Air"),
            now,
        )

        sender_city = validated_data.get("sender", {}).get("city", "Origin")
        formatted_event_time = now.strftime("%Y-%m-%d %I:%M %p")

        initial_event = {
            "id": f"ev-{int(now.timestamp() * 1000)}",
            "status": "BOOKED",
            "title": "Consignment Manifested & Booked",
            "location": f"{sender_city} Hub",
            "timestamp": formatted_event_time,
            "notes": "Digital Air Waybill created. Awaiting first-mile pickup manifest.",
        }

        # Attempt to save, handling rare random collisions
        max_attempts = 3
        for attempt in range(max_attempts):
            awb_number = self.generate_awb_number()
            display_order_id = f"ORD-{awb_number.replace('AD-', '')}"
            order_record: Dict[str, Any] = {
                "orderId": awb_number,
                "awbNumber": awb_number,
                "displayOrderId": display_order_id,
                "barcode": "||| | |||| | |||||| || | ||",
                "idempotencyKey": idempotency_key,
                "serviceTier": validated_data["serviceTier"],
                "currentStatus": "BOOKED",
                "paymentMode": validated_data["paymentMode"],
                "declaredValue": validated_data["declaredValue"],
                "createdAt": created_at_iso,
                "estimatedDelivery": estimated_delivery_iso,
                "currentLocation": f"{sender_city}, Booking Station",
                "weightKg": validated_data["weightKg"],
                "dimensions": validated_data["dimensions"],
                "category": validated_data["category"],
                "sender": validated_data["sender"],
                "recipient": validated_data["recipient"],
                "assignedDriver": None,
                "proofOfDelivery": None,
                "events": [initial_event],
            }

            if validated_data.get("customerEmail"):
                order_record["customerEmail"] = validated_data["customerEmail"]

            try:
                self.repo.save_order(order_record)
                logger.info(
                    f"Consignment successfully manifested: {awb_number}",
                    extra={"extra": {"orderId": awb_number, "idempotencyKey": idempotency_key}},
                )
                self.events.emit_consignment_event("CONSIGNMENT_CREATED", awb_number, order_record)
                return order_record, False
            except ValueError:
                # Key collision occurred, retry with a fresh AWB ID
                if attempt == max_attempts - 1:
                    logger.error("Exhausted retry attempts generating unique AWB ID.")
                    raise RuntimeError("Failed to generate a unique Air Waybill ID. Please retry.")
                continue

        raise RuntimeError("Unexpected failure during order creation.")

    def get_order(self, order_id_or_awb: str) -> Optional[Dict[str, Any]]:
        """Retrieves an order by its ID or AWB number."""
        return self.repo.get_order(order_id_or_awb.strip())

    def update_status(
        self,
        order_id: str,
        target_status: str,
        notes: str = "",
        location: Optional[str] = None,
        proof_of_delivery: Optional[Dict[str, Any]] = None,
        is_admin_override: bool = False,
    ) -> Dict[str, Any]:
        """
        Advances the consignment status through the validated state machine.
        Appends an event milestone and emits notifications.
        """
        order = self.get_order(order_id)
        if not order:
            raise KeyError(f"Order '{order_id}' was not found.")

        current_status = order.get("currentStatus", "BOOKED")
        validate_status_transition(current_status, target_status, is_admin_override=is_admin_override)

        now = datetime.now(timezone.utc)
        formatted_time = now.strftime("%Y-%m-%d %I:%M %p")

        default_location = location or order.get("currentLocation", "Distribution Station")
        if target_status == "OUT_FOR_DELIVERY":
            event_title = "Dispatched for Final Delivery"
        elif target_status == "DELIVERED":
            event_title = "Package Delivered Successfully"
            default_location = f"{order.get('recipient', {}).get('city', 'Destination')} Recipient Address"
        elif target_status == "FAILED_ATTEMPT":
            event_title = "Delivery Attempt Unsuccessful"
        elif target_status == "IN_TRANSIT":
            event_title = "Departed on Linehaul Transit"
        elif target_status == "RETURNED_TO_HUB":
            event_title = "Returned to Local Delivery Station"
        elif target_status == "CANCELLED":
            event_title = "Shipment Cancelled"
        else:
            event_title = f"Status updated to {target_status}"

        new_event = {
            "id": f"ev-{int(now.timestamp() * 1000)}",
            "status": target_status,
            "title": event_title,
            "location": default_location,
            "timestamp": formatted_time,
            "notes": notes or f"Consignment transitioned from {current_status} to {target_status}.",
        }

        updated = self.repo.update_order_status(
            order_id=order_id,
            new_status=target_status,
            event=new_event,
            proof_of_delivery=proof_of_delivery,
        )
        if not updated:
            raise RuntimeError(f"Failed to persist status update for order {order_id}")

        updated["currentLocation"] = default_location

        # Emit event notification & WebSocket broadcast
        self.events.emit_consignment_event("CONSIGNMENT_STATUS_CHANGED", order_id, updated)
        return updated

    def assign_driver(
        self,
        order_id: str,
        driver_info: Optional[Any] = None,
        driver_name: Optional[str] = None,
        vehicle_number: Optional[str] = None,
        phone: Optional[str] = None,
        **kwargs: Any,
    ) -> Dict[str, Any]:
        """Assigns a driver to a shipment (Admin/Driver operation). Supports dictionary or keyword arguments."""
        order = self.get_order(order_id)
        if not order:
            raise KeyError(f"Order '{order_id}' not found.")

        if isinstance(driver_info, dict):
            d_id = driver_info.get("driverId") or driver_info.get("id") or "DRV-504"
            d_name = driver_info.get("name") or driver_name or "Delivery Captain"
            if not d_name.lower().startswith("captain") and d_name != "Delivery Captain":
                d_name = f"Captain {d_name}"
            d_phone = driver_info.get("phone") or phone or "+91 90043 58469"
            d_veh = driver_info.get("vehicleNumber") or driver_info.get("vehicle") or vehicle_number or "KA-03-EV-4412"
            d_rate = driver_info.get("rating", 4.9)
        else:
            d_id = str(driver_info) if driver_info else "DRV-504"
            d_name = driver_name or kwargs.get("name", "Delivery Captain")
            if not d_name.lower().startswith("captain") and d_name != "Delivery Captain":
                d_name = f"Captain {d_name}"
            d_phone = phone or kwargs.get("phone", "+91 90043 58469")
            d_veh = vehicle_number or kwargs.get("vehicleNumber", "KA-03-EV-4412")
            d_rate = kwargs.get("rating", 4.9)

        normalized_driver = {
            "driverId": d_id,
            "name": d_name,
            "phone": d_phone,
            "vehicleNumber": d_veh,
            "rating": d_rate,
            "assignedAt": datetime.now(timezone.utc).isoformat(),
        }

        updated = self.repo.assign_driver(order_id, normalized_driver)
        if not updated:
            raise RuntimeError(f"Failed to assign driver to order {order_id}")

        now = datetime.now(timezone.utc)
        event = {
            "id": f"ev-{int(now.timestamp() * 1000)}",
            "status": updated.get("currentStatus", "BOOKED"),
            "title": f"Assigned to Delivery Associate ({d_name})",
            "location": updated.get("currentLocation", "Local Hub"),
            "timestamp": now.strftime("%Y-%m-%d %I:%M %p"),
            "notes": f"Driver {d_name} ({d_id}) assigned for dispatch.",
        }
        self.repo.update_order_status(order_id, updated["currentStatus"], event)
        updated["events"].append(event)

        self.events.emit_consignment_event("DRIVER_ASSIGNED", order_id, updated)
        return updated

    def list_orders(
        self,
        status: Optional[str] = None,
        driver_id: Optional[str] = None,
        customer_email: Optional[str] = None,
        limit: int = 50,
    ) -> List[Dict[str, Any]]:
        """Lists consignments with optional filters."""
        return self.repo.list_orders(
            status=status,
            driver_id=driver_id,
            customer_email=customer_email,
            limit=limit,
        )
