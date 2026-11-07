"""Abstract interfaces for AeroDispatch backend services.

These interfaces decouple the application business logic from concrete cloud or local
implementations (DynamoDB, S3, Cognito, EventBridge/SNS).
"""
from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional


class OrderRepositoryInterface(ABC):
    """Abstract contract for consignment data persistence."""

    @abstractmethod
    def save_order(self, order_item: Dict[str, Any]) -> None:
        """Saves a new order. Raises ValueError on key collision."""
        pass

    @abstractmethod
    def get_order(self, order_id: str) -> Optional[Dict[str, Any]]:
        """Retrieves an order by its primary orderId or awbNumber."""
        pass

    @abstractmethod
    def get_order_by_idempotency_key(self, idempotency_key: str) -> Optional[Dict[str, Any]]:
        """Retrieves an existing order by its unique idempotencyKey."""
        pass

    @abstractmethod
    def update_order_status(
        self,
        order_id: str,
        new_status: str,
        event: Dict[str, Any],
        proof_of_delivery: Optional[Dict[str, Any]] = None,
    ) -> Optional[Dict[str, Any]]:
        """Updates order status, appends to the events timeline, and saves proof of delivery."""
        pass

    @abstractmethod
    def assign_driver(self, order_id: str, driver_info: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Assigns a driver to a shipment."""
        pass

    @abstractmethod
    def list_orders(
        self,
        status: Optional[str] = None,
        driver_id: Optional[str] = None,
        customer_email: Optional[str] = None,
        limit: int = 50,
    ) -> List[Dict[str, Any]]:
        """Lists orders matching optional filters."""
        pass


class StorageServiceInterface(ABC):
    """Abstract contract for package photo / proof of delivery uploads."""

    @abstractmethod
    def save_photo(self, order_id: str, filename: str, content: bytes, content_type: str) -> str:
        """Stores a package photo and returns its access URL."""
        pass


class EventDispatcherInterface(ABC):
    """Abstract contract for notifications and event streaming (SNS/EventBridge)."""

    @abstractmethod
    def emit_consignment_event(self, event_type: str, consignment_id: str, data: Dict[str, Any]) -> None:
        """Dispatches an event to the messaging bus / notification system."""
        pass


class AuthServiceInterface(ABC):
    """Abstract contract for user authentication and token verification."""

    @abstractmethod
    def authenticate(self, username: str, password: str) -> Optional[Dict[str, Any]]:
        """Authenticates a user and returns their identity and JWT token."""
        pass

    @abstractmethod
    def verify_token(self, token: str) -> Optional[Dict[str, Any]]:
        """Verifies a JWT token and returns the decoded claims."""
        pass
