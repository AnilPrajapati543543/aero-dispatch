"""WebSocket Connection Manager for live consignment telemetry & tracking."""
import asyncio
import json
from typing import Any, Dict, List, Set
from ..utils.logger import get_logger

logger = get_logger("service.websocket")


class TrackingWebSocketManager:
    """Manages active WebSocket tracking connections by AWB number."""

    def __init__(self):
        # awbNumber -> set of active WebSocket instances
        self._active_connections: Dict[str, Set[Any]] = {}

    async def connect(self, awb_number: str, websocket: Any) -> None:
        """Registers a new WebSocket subscriber for an AWB."""
        await websocket.accept()
        if awb_number not in self._active_connections:
            self._active_connections[awb_number] = set()
        self._active_connections[awb_number].add(websocket)
        logger.info(
            f"WebSocket subscriber connected for {awb_number}. Total for AWB: {len(self._active_connections[awb_number])}"
        )

    def disconnect(self, awb_number: str, websocket: Any) -> None:
        """Unregisters a disconnected WebSocket."""
        if awb_number in self._active_connections:
            self._active_connections[awb_number].discard(websocket)
            if not self._active_connections[awb_number]:
                del self._active_connections[awb_number]
            logger.info(f"WebSocket subscriber disconnected for {awb_number}.")

    async def broadcast_to_awb(self, awb_number: str, message: Dict[str, Any]) -> None:
        """Sends real-time telemetry message to all clients tracking this AWB."""
        connections = self._active_connections.get(awb_number, set()).copy()
        if not connections:
            return

        payload = json.dumps(message)
        dead_connections = []

        for ws in connections:
            try:
                await ws.send_text(payload)
            except Exception as e:
                logger.warning(f"Failed to send to client for {awb_number}: {e}")
                dead_connections.append(ws)

        for dead in dead_connections:
            self.disconnect(awb_number, dead)

    def get_subscriber_count(self, awb_number: str) -> int:
        return len(self._active_connections.get(awb_number, set()))


# Global singleton instance for local application runtime
tracking_ws_manager = TrackingWebSocketManager()
