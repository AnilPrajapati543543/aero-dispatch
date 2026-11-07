"""Logistics State Machine enforcing valid consignment status transitions."""
from typing import Dict, List, Set

VALID_STATUSES: Set[str] = {
    "BOOKED",
    "IN_TRANSIT",
    "OUT_FOR_DELIVERY",
    "DELIVERED",
    "FAILED_ATTEMPT",
    "RETURNED_TO_HUB",
    "CANCELLED",
}

# Strict valid progression transitions for drivers and standard dispatch
TRANSITION_MAP: Dict[str, Set[str]] = {
    "BOOKED": {"IN_TRANSIT", "OUT_FOR_DELIVERY", "CANCELLED"},
    "IN_TRANSIT": {"OUT_FOR_DELIVERY", "FAILED_ATTEMPT", "RETURNED_TO_HUB"},
    "OUT_FOR_DELIVERY": {"DELIVERED", "FAILED_ATTEMPT"},
    "FAILED_ATTEMPT": {"OUT_FOR_DELIVERY", "RETURNED_TO_HUB"},
    "RETURNED_TO_HUB": {"IN_TRANSIT", "CANCELLED"},
    "DELIVERED": set(),  # Terminal state
    "CANCELLED": set(),  # Terminal state
}


class InvalidStatusTransitionError(ValueError):
    """Raised when an illegal consignment status transition is attempted."""
    def __init__(self, current_status: str, target_status: str, allowed: Set[str]):
        self.current_status = current_status
        self.target_status = target_status
        self.allowed = allowed
        allowed_str = ", ".join(sorted(allowed)) if allowed else "none (terminal state)"
        super().__init__(
            f"Cannot transition status from '{current_status}' to '{target_status}'. "
            f"Allowed next transitions: [{allowed_str}]."
        )


def validate_status_transition(current_status: str, target_status: str, is_admin_override: bool = False) -> None:
    """
    Validates whether moving from current_status to target_status is permitted.
    
    Raises InvalidStatusTransitionError on violation.
    """
    if target_status not in VALID_STATUSES:
        raise ValueError(
            f"Unknown status '{target_status}'. Must be one of: {', '.join(sorted(VALID_STATUSES))}."
        )

    if current_status == target_status:
        # No-op transition
        return

    # Once DELIVERED, consignment is legally completed and cannot be reopened even by standard action
    if current_status == "DELIVERED" and not is_admin_override:
        raise InvalidStatusTransitionError(current_status, target_status, set())

    if is_admin_override:
        # Admins can override most states for operational exceptions
        return

    allowed_next = TRANSITION_MAP.get(current_status, set())
    if target_status not in allowed_next:
        raise InvalidStatusTransitionError(current_status, target_status, allowed_next)
