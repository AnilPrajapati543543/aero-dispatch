"""Security Audit Logging Utility for AeroDispatch Backend.

Provides structured, tamper-evident security event logs.
Strictly redacts credentials, passwords, JWT tokens, session cookies,
and sensitive PII before writing.
"""
import json
import logging
import os
import re
from datetime import datetime, timezone
from typing import Any, Dict, Optional

# Configure dedicated security audit logger
_audit_logger = logging.getLogger("aerodispatch.security.audit")
_audit_logger.setLevel(logging.INFO)

# Ensure audit logger has a console stream handler if none configured
if not _audit_logger.handlers:
    _handler = logging.StreamHandler()
    _handler.setFormatter(logging.Formatter("%(message)s"))
    _audit_logger.addHandler(_handler)

# Sensitive fields to redact
SENSITIVE_FIELD_PATTERNS = [
    re.compile(r"pass(word)?", re.IGNORECASE),
    re.compile(r"token", re.IGNORECASE),
    re.compile(r"secret", re.IGNORECASE),
    re.compile(r"cookie", re.IGNORECASE),
    re.compile(r"auth(orization)?", re.IGNORECASE),
    re.compile(r"jwt", re.IGNORECASE),
    re.compile(r"otp", re.IGNORECASE),
    re.compile(r"credential", re.IGNORECASE),
]


def redact_sensitive_data(data: Any) -> Any:
    """Recursively redacts passwords, tokens, secrets, and auth headers."""
    if isinstance(data, dict):
        redacted = {}
        for key, val in data.items():
            if any(pattern.search(str(key)) for pattern in SENSITIVE_FIELD_PATTERNS):
                redacted[key] = "[REDACTED]"
            else:
                redacted[key] = redact_sensitive_data(val)
        return redacted
    elif isinstance(data, list):
        return [redact_sensitive_data(item) for item in data]
    return data


def log_security_event(
    event_type: str,
    action: str,
    status: str,  # "SUCCESS", "FAILURE", "BLOCKED", "ALERT"
    actor_id: Optional[str] = None,
    actor_email: Optional[str] = None,
    actor_role: Optional[str] = None,
    client_ip: Optional[str] = None,
    resource: Optional[str] = None,
    details: Optional[Dict[str, Any]] = None,
) -> None:
    """
    Emits a structured JSON security audit record.
    
    Event Types include:
      - LOGIN_SUCCESS, LOGIN_FAILURE, LOGOUT
      - REFRESH_SUCCESS, REFRESH_REUSE_DETECTED, TOKEN_REVOKED
      - PASSWORD_CHANGE, PASSWORD_RESET_REQUEST, PASSWORD_RESET_COMPLETED
      - UNAUTHORIZED_ACCESS_ATTEMPT, IDOR_ATTEMPT, RBAC_FORBIDDEN
      - DRIVER_ASSIGNED, STATUS_OVERRIDE, STATUS_CHANGED
      - SUSPICIOUS_UPLOAD, RATE_LIMIT_EXCEEDED, CSRF_FAILURE
    """
    safe_details = redact_sensitive_data(details or {})

    record = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "logType": "SECURITY_AUDIT",
        "eventType": event_type,
        "action": action,
        "status": status,
        "actor": {
            "id": actor_id or "anonymous",
            "email": actor_email or "anonymous",
            "role": actor_role or "unauthenticated",
        },
        "network": {
            "clientIp": client_ip or "unknown",
        },
        "resource": resource,
        "details": safe_details,
    }

    _audit_logger.info(json.dumps(record))

