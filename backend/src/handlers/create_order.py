"""AWS Lambda handler for POST /api/v1/orders consignment creation."""
import base64
import json
from typing import Any, Dict, Optional

from ..services.order_service import OrderService
from ..utils.logger import get_logger
from ..utils.response import error_response, success_response
from ..utils.validator import validate_order_payload

logger = get_logger("handler.create_order")
order_service = OrderService()


def _extract_header(headers: Optional[Dict[str, Any]], key: str) -> Optional[str]:
    """Case-insensitive header extraction helper."""
    if not headers or not isinstance(headers, dict):
        return None
    target = key.lower()
    for h_name, h_val in headers.items():
        if h_name.lower() == target:
            return str(h_val).strip()
    return None


def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    AWS Lambda handler triggered by Amazon API Gateway HTTP API.
    
    Path: POST /api/v1/orders
    """
    http_context = event.get("requestContext", {}).get("http", {})
    method = http_context.get("method") or event.get("httpMethod", "POST")

    # Handle CORS OPTIONS Preflight
    if method == "OPTIONS":
        return success_response(data={"message": "Preflight OK"}, status_code=200)

    logger.info(
        "Processing incoming order creation request",
        extra={"extra": {"requestId": event.get("requestContext", {}).get("requestId")}},
    )

    # 1. Parse request body
    raw_body = event.get("body")
    if not raw_body:
        return error_response(
            message="Request body cannot be empty.",
            code="EMPTY_BODY",
            status_code=400,
        )

    # Decode if base64 encoded by API Gateway
    if event.get("isBase64Encoded"):
        try:
            raw_body = base64.b64decode(raw_body).decode("utf-8")
        except Exception as e:
            logger.warning(f"Failed to decode base64 body: {e}")
            return error_response(
                message="Invalid base64 encoding in request body.",
                code="INVALID_BASE64",
                status_code=400,
            )

    try:
        payload = json.loads(raw_body)
    except (json.JSONDecodeError, TypeError) as e:
        logger.warning(f"Malformed JSON received: {e}")
        return error_response(
            message="Invalid JSON payload format.",
            code="MALFORMED_JSON",
            status_code=400,
        )

    # 2. Extract optional idempotency key from headers
    client_idempotency_key = _extract_header(event.get("headers"), "X-Idempotency-Key")

    # 3. Validate input
    is_valid, validated_data, errors = validate_order_payload(payload)
    if not is_valid or validated_data is None:
        logger.warning(f"Payload validation failed with {len(errors)} errors")
        return error_response(
            message="Order validation failed. Please check the required fields.",
            code="VALIDATION_ERROR",
            status_code=400,
            details=errors,
        )

    # 4. Execute order business logic
    try:
        order_record, is_replay = order_service.create_order(
            validated_data=validated_data,
            client_idempotency_key=client_idempotency_key,
        )

        if is_replay:
            return success_response(
                data=order_record,
                status_code=200,
                message="Consignment manifested previously (idempotent replay).",
                extra_headers={"X-Idempotent-Replay": "true"},
            )

        return success_response(
            data=order_record,
            status_code=201,
            message="Consignment manifested successfully.",
        )

    except ValueError as e:
        logger.warning(f"Order creation rejected: {e}")
        return error_response(
            message=str(e),
            code="ORDER_CONFLICT",
            status_code=409,
        )
    except Exception as e:
        logger.error(f"Internal unexpected error creating consignment: {e}", exc_info=True)
        return error_response(
            message="An unexpected internal server error occurred while processing the consignment.",
            code="INTERNAL_SERVER_ERROR",
            status_code=500,
        )
