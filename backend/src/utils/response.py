"""Standardized HTTP response helpers for Amazon API Gateway HTTP API."""
import json
from decimal import Decimal
from typing import Any, Dict, List, Optional

CORS_HEADERS = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "OPTIONS,POST,GET",
    "Access-Control-Allow-Headers": "Content-Type,Authorization,X-Idempotency-Key",
    "Access-Control-Max-Age": "600",
}


class CustomJSONEncoder(json.JSONEncoder):
    """Encodes Python Decimals (from DynamoDB) and custom objects to JSON primitives."""

    def default(self, obj: Any) -> Any:
        if isinstance(obj, Decimal):
            # Convert decimal to float or int
            if obj % 1 == 0:
                return int(obj)
            return float(obj)
        return super().default(obj)


def success_response(
    data: Any,
    status_code: int = 200,
    message: Optional[str] = None,
    extra_headers: Optional[Dict[str, str]] = None,
) -> Dict[str, Any]:
    """Builds a consistent success JSON response."""
    body: Dict[str, Any] = {
        "success": True,
        "data": data,
    }
    if message:
        body["message"] = message

    headers = dict(CORS_HEADERS)
    if extra_headers:
        headers.update(extra_headers)

    return {
        "statusCode": status_code,
        "headers": headers,
        "isBase64Encoded": False,
        "body": json.dumps(body, cls=CustomJSONEncoder),
    }


def error_response(
    message: str,
    code: str = "BAD_REQUEST",
    status_code: int = 400,
    details: Optional[List[str]] = None,
    extra_headers: Optional[Dict[str, str]] = None,
) -> Dict[str, Any]:
    """Builds a consistent error JSON response without leaking internals."""
    error_payload: Dict[str, Any] = {
        "code": code,
        "message": message,
    }
    if details:
        error_payload["details"] = details

    headers = dict(CORS_HEADERS)
    if extra_headers:
        headers.update(extra_headers)

    return {
        "statusCode": status_code,
        "headers": headers,
        "isBase64Encoded": False,
        "body": json.dumps(
            {
                "success": False,
                "error": error_payload,
            }
        ),
    }
