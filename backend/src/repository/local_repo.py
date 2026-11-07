"""Thread-safe Local File & In-Memory Order Repository for offline development."""
import json
import os
import threading
from typing import Any, Dict, List, Optional

from ..interfaces import OrderRepositoryInterface
from ..utils.logger import get_logger

logger = get_logger("repository.local")

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".data")
DATA_FILE = os.path.join(DATA_DIR, "orders.json")

# Seed shipments matching frontend dataset
SEED_SHIPMENTS: List[Dict[str, Any]] = []


class LocalOrderRepository(OrderRepositoryInterface):
    """File-backed and in-memory repository for local development."""

    def __init__(self, data_file: Optional[str] = None):
        self.data_file = data_file or DATA_FILE
        self._lock = threading.RLock()
        self._orders: Dict[str, Dict[str, Any]] = {}
        self._idempotency_index: Dict[str, str] = {}
        self._initialize_storage()

    def _initialize_storage(self) -> None:
        """Loads existing data from disk or seeds standard sample records."""
        with self._lock:
            os.makedirs(os.path.dirname(self.data_file), exist_ok=True)
            if os.path.exists(self.data_file):
                try:
                    with open(self.data_file, "r", encoding="utf-8") as f:
                        records = json.load(f)
                    for item in records:
                        self._index_order(item)
                    logger.info(f"Loaded {len(self._orders)} orders from {self.data_file}")
                    return
                except Exception as e:
                    logger.warning(f"Could not load {self.data_file}, initializing fresh: {e}")

            # Seed initial records
            for seed in SEED_SHIPMENTS:
                self._index_order(dict(seed))
            self._persist_to_disk()

    def _index_order(self, order: Dict[str, Any]) -> None:
        order_id = order.get("orderId") or order.get("awbNumber")
        if order_id:
            self._orders[order_id] = order
            idem_key = order.get("idempotencyKey")
            if idem_key:
                self._idempotency_index[idem_key] = order_id

    def _persist_to_disk(self) -> None:
        """Safely saves all current orders to disk."""
        try:
            with open(self.data_file, "w", encoding="utf-8") as f:
                json.dump(list(self._orders.values()), f, indent=2)
        except Exception as e:
            logger.error(f"Failed to persist orders to disk: {e}")

    def save_order(self, order_item: Dict[str, Any]) -> None:
        with self._lock:
            order_id = order_item.get("orderId")
            if not order_id:
                raise ValueError("orderId is required.")
            if order_id in self._orders:
                raise ValueError(f"Order with ID {order_id} already exists.")
            self._index_order(dict(order_item))
            self._persist_to_disk()

    def get_order(self, order_id: str) -> Optional[Dict[str, Any]]:
        with self._lock:
            item = self._orders.get(order_id)
            return dict(item) if item else None

    def get_order_by_idempotency_key(self, idempotency_key: str) -> Optional[Dict[str, Any]]:
        with self._lock:
            order_id = self._idempotency_index.get(idempotency_key)
            if order_id and order_id in self._orders:
                return dict(self._orders[order_id])
            return None

    def update_order_status(
        self,
        order_id: str,
        new_status: str,
        event: Dict[str, Any],
        proof_of_delivery: Optional[Dict[str, Any]] = None,
    ) -> Optional[Dict[str, Any]]:
        with self._lock:
            order = self._orders.get(order_id)
            if not order:
                return None
            order["currentStatus"] = new_status
            if "events" not in order:
                order["events"] = []
            order["events"].append(event)
            if proof_of_delivery:
                order["proofOfDelivery"] = proof_of_delivery
            self._persist_to_disk()
            return dict(order)

    def assign_driver(self, order_id: str, driver_info: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        with self._lock:
            order = self._orders.get(order_id)
            if not order:
                return None
            order["assignedDriver"] = driver_info
            self._persist_to_disk()
            return dict(order)

    def list_orders(
        self,
        status: Optional[str] = None,
        driver_id: Optional[str] = None,
        customer_email: Optional[str] = None,
        limit: int = 50,
    ) -> List[Dict[str, Any]]:
        with self._lock:
            results = list(self._orders.values())
            if status:
                results = [o for o in results if o.get("currentStatus") == status]
            if driver_id:
                results = [
                    o for o in results
                    if o.get("assignedDriver") and o["assignedDriver"].get("driverId") == driver_id
                ]
            if customer_email:
                c_email = customer_email.strip().lower()
                results = [
                    o for o in results
                    if (
                        o.get("sender", {}).get("email", "").strip().lower() == c_email
                        or o.get("recipient", {}).get("email", "").strip().lower() == c_email
                        or o.get("customerEmail", "").strip().lower() == c_email
                    )
                ]
            # Return most recently created first
            results.sort(key=lambda x: x.get("createdAt", ""), reverse=True)
            return [dict(o) for o in results[:limit]]
