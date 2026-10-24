"""Order business service handling AWB generation, delivery calculation, and duplicate prevention."""
import hashlib
import random
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional, Tuple

from ..repository.dynamodb_repo import DynamoDBOrderRepository
from ..utils.logger import get_logger

logger = get_logger("order_service")


class OrderService:
    """Business operations for AeroDispatch consignments."""

    def __init__(self, repository: Optional[DynamoDBOrderRepository] = None):
        self.repo = repository or DynamoDBOrderRepository()

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
        # Determine effective idempotency key
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
            order_record: Dict[str, Any] = {
                "orderId": awb_number,
                "awbNumber": awb_number,
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

            try:
                self.repo.save_order(order_record)
                logger.info(
                    f"Consignment successfully manifested: {awb_number}",
                    extra={"extra": {"orderId": awb_number, "idempotencyKey": idempotency_key}},
                )
                return order_record, False
            except ValueError:
                # Key collision occurred, retry with a fresh AWB ID
                if attempt == max_attempts - 1:
                    logger.error("Exhausted retry attempts generating unique AWB ID.")
                    raise RuntimeError("Failed to generate a unique Air Waybill ID. Please retry.")
                continue

        raise RuntimeError("Unexpected failure during order creation.")
