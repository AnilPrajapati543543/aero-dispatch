"""Event notification and messaging service (Local Mock & AWS EventBridge/SNS stubs)."""
import asyncio
from typing import Any, Callable, Dict, List, Optional

from ..interfaces import EventDispatcherInterface
from ..utils.logger import get_logger
from .websocket_manager import tracking_ws_manager

logger = get_logger("service.events")


class LocalEventDispatcher(EventDispatcherInterface):
    """
    Local event dispatcher simulating EventBridge event-bus publishing
    and Amazon SNS SMS/Email notifications, while broadcasting to active WebSockets.
    """

    def __init__(self):
        self._listeners: List[Callable[[str, str, Dict[str, Any]], None]] = []

    def register_listener(self, listener: Callable[[str, str, Dict[str, Any]], None]) -> None:
        self._listeners.append(listener)

    def emit_consignment_event(self, event_type: str, consignment_id: str, data: Dict[str, Any]) -> None:
        """
        Emits an event to local listeners, logs EventBridge/SNS simulation,
        and broadcasts to connected tracking WebSockets.
        """
        # 1. Simulate Amazon EventBridge Publication
        logger.info(
            f"[EventBridge Mock] PutEvents: source='aerodispatch.logistics' "
            f"detailType='{event_type}' consignment='{consignment_id}'",
            extra={"extra": {"eventType": event_type, "consignmentId": consignment_id}},
        )

        # 2. Simulate Amazon SNS SMS/Push Notification to recipient/sender
        recipient_phone = data.get("recipient", {}).get("phone") or data.get("phone")
        if recipient_phone:
            status = data.get("currentStatus", "UPDATED")
            logger.info(
                f"[SNS Mock] SMS to {recipient_phone}: "
                f"'AeroDispatch alert: Shipment {consignment_id} status is now {status}.'"
            )

        # 3. Fire in-process synchronous listeners
        for listener in self._listeners:
            try:
                listener(event_type, consignment_id, data)
            except Exception as e:
                logger.error(f"Error in event listener: {e}")

        # 4. Broadcast live update to WebSockets if event loop is running
        try:
            loop = asyncio.get_running_loop()
            ws_payload = {
                "type": "TRACKING_UPDATE",
                "awbNumber": consignment_id,
                "eventType": event_type,
                "status": data.get("currentStatus"),
                "data": data,
            }
            asyncio.run_coroutine_threadsafe(
                tracking_ws_manager.broadcast_to_awb(consignment_id, ws_payload),
                loop,
            )
        except RuntimeError:
            # No running event loop in synchronous or test contexts
            pass



class EventBridgeSnsService(EventDispatcherInterface):
    """Stub ready for Amazon EventBridge and SNS integration in Phase 4."""

    def __init__(self, event_bus_name: Optional[str] = None, sns_topic_arn: Optional[str] = None):
        self.event_bus_name = event_bus_name or "aerodispatch-event-bus"
        self.sns_topic_arn = sns_topic_arn

    def emit_consignment_event(self, event_type: str, consignment_id: str, data: Dict[str, Any]) -> None:
        raise NotImplementedError("EventBridgeSnsService will be connected in Phase 4.")


# Global singleton instance for local application runtime
event_dispatcher = LocalEventDispatcher()
