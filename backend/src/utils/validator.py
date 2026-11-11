"""Input validation and sanitization for AeroDispatch order requests."""
import re
from typing import Any, Dict, List, Optional, Tuple

VALID_PAYMENT_MODES = {"Prepaid", "COD"}
VALID_SERVICE_TIERS = {
    "AeroExpress Air",
    "AeroSurface Standard",
    "AeroHyperlocal Priority",
    "Express Air",
    "Standard Surface",
    "Same-Day Priority",
}

PHONE_REGEX = re.compile(r"^\+?[0-9\s\-]{7,20}$")
PIN_REGEX = re.compile(r"^[0-9A-Za-z\s\-]{3,10}$")


def _sanitize_string(val: Any) -> str:
    """Strip whitespace and coerce to string."""
    if val is None:
        return ""
    return str(val).strip()


def validate_order_payload(payload: Any) -> Tuple[bool, Optional[Dict[str, Any]], List[str]]:
    """
    Validates and normalizes the order creation payload.
    Supports both nested structures (sender: {...}) and flat structures (senderName, senderCity, etc.).
    
    Returns:
        (is_valid, normalized_order_dict, list_of_error_messages)
    """
    errors: List[str] = []

    if not isinstance(payload, dict):
        return False, None, ["Request body must be a valid JSON object."]

    # 1. Normalize Sender
    sender_raw = payload.get("sender")
    if isinstance(sender_raw, dict):
        sender_name = _sanitize_string(sender_raw.get("name"))
        sender_city = _sanitize_string(sender_raw.get("city"))
        sender_pin = _sanitize_string(sender_raw.get("pinCode") or sender_raw.get("pin"))
        sender_phone = _sanitize_string(sender_raw.get("phone"))
        sender_address = _sanitize_string(sender_raw.get("address"))
        sender_state = _sanitize_string(sender_raw.get("state") or "")
        sender_facility = _sanitize_string(sender_raw.get("facility") or "Origin Distribution Hub")
        sender_email = _sanitize_string(sender_raw.get("email") or payload.get("senderEmail") or payload.get("email"))
    else:
        # Check flat fields
        sender_name = _sanitize_string(payload.get("senderName"))
        sender_city = _sanitize_string(payload.get("senderCity"))
        sender_pin = _sanitize_string(payload.get("senderPin") or payload.get("senderPinCode"))
        sender_phone = _sanitize_string(payload.get("senderPhone"))
        sender_address = _sanitize_string(payload.get("senderAddress"))
        sender_state = _sanitize_string(payload.get("senderState") or "")
        sender_facility = _sanitize_string(payload.get("senderFacility") or "Origin Distribution Hub")
        sender_email = _sanitize_string(payload.get("senderEmail") or payload.get("email"))

    if not sender_name or len(sender_name) < 2 or len(sender_name) > 100:
        errors.append("sender.name is required and must be between 2 and 100 characters.")
    if not sender_city or len(sender_city) < 2 or len(sender_city) > 60:
        errors.append("sender.city is required and must be between 2 and 60 characters.")
    if not sender_pin or not PIN_REGEX.match(sender_pin):
        errors.append("sender.pinCode is required and must be a valid postal PIN (3-10 characters).")
    if not sender_phone or not PHONE_REGEX.match(sender_phone):
        errors.append("sender.phone is required and must be a valid contact number (7-20 digits).")
    if not sender_address or len(sender_address) < 3 or len(sender_address) > 250:
        errors.append("sender.address is required and must be between 3 and 250 characters.")

    # 2. Normalize Recipient
    recipient_raw = payload.get("recipient")
    if isinstance(recipient_raw, dict):
        recipient_name = _sanitize_string(recipient_raw.get("name"))
        recipient_city = _sanitize_string(recipient_raw.get("city"))
        recipient_pin = _sanitize_string(recipient_raw.get("pinCode") or recipient_raw.get("pin"))
        recipient_phone = _sanitize_string(recipient_raw.get("phone"))
        recipient_address = _sanitize_string(recipient_raw.get("address"))
        recipient_state = _sanitize_string(recipient_raw.get("state") or "")
        recipient_email = _sanitize_string(recipient_raw.get("email") or payload.get("recipientEmail"))
    else:
        # Check flat fields
        recipient_name = _sanitize_string(payload.get("recipientName"))
        recipient_city = _sanitize_string(payload.get("recipientCity"))
        recipient_pin = _sanitize_string(payload.get("recipientPin") or payload.get("recipientPinCode"))
        recipient_phone = _sanitize_string(payload.get("recipientPhone"))
        recipient_address = _sanitize_string(payload.get("recipientAddress"))
        recipient_state = _sanitize_string(payload.get("recipientState") or "")
        recipient_email = _sanitize_string(payload.get("recipientEmail"))

    if not recipient_name or len(recipient_name) < 2 or len(recipient_name) > 100:
        errors.append("recipient.name is required and must be between 2 and 100 characters.")
    if not recipient_city or len(recipient_city) < 2 or len(recipient_city) > 60:
        errors.append("recipient.city is required and must be between 2 and 60 characters.")
    if not recipient_pin or not PIN_REGEX.match(recipient_pin):
        errors.append("recipient.pinCode is required and must be a valid postal PIN (3-10 characters).")
    if not recipient_phone or not PHONE_REGEX.match(recipient_phone):
        errors.append("recipient.phone is required and must be a valid contact number (7-20 digits).")
    if not recipient_address or len(recipient_address) < 3 or len(recipient_address) > 250:
        errors.append("recipient.address is required and must be between 3 and 250 characters.")

    # 3. Weight Validation
    weight_val = payload.get("weightKg")
    weight_kg = 1.0
    try:
        if weight_val is None or weight_val == "":
            errors.append("weightKg is required.")
        else:
            weight_kg = float(weight_val)
            if weight_kg <= 0 or weight_kg > 1000:
                errors.append("weightKg must be greater than 0 and less than or equal to 1000 kg.")
    except (ValueError, TypeError):
        errors.append("weightKg must be a valid positive number.")

    # 4. Dimensions Validation
    length = payload.get("length", 20)
    width = payload.get("width", 15)
    height = payload.get("height", 10)
    try:
        length_val = float(length) if length is not None and str(length).strip() != "" else 20.0
        width_val = float(width) if width is not None and str(width).strip() != "" else 15.0
        height_val = float(height) if height is not None and str(height).strip() != "" else 10.0
        if length_val <= 0 or width_val <= 0 or height_val <= 0:
            errors.append("Package dimensions (length, width, height) must be positive numbers.")
        dimensions_str = f"{length_val:g} x {width_val:g} x {height_val:g} cm"
    except (ValueError, TypeError):
        errors.append("Package dimensions must be numeric.")
        dimensions_str = "20 x 15 x 10 cm"

    # 5. Category
    category = _sanitize_string(payload.get("category")) or "General Parcel"
    if len(category) > 60:
        category = category[:60]

    # 6. Declared Value
    declared_val = payload.get("declaredValue", 1000)
    declared_value = 1000.0
    try:
        if declared_val is not None and str(declared_val).strip() != "":
            declared_value = float(declared_val)
            if declared_value < 0 or declared_value > 10_000_000:
                errors.append("declaredValue must be non-negative and realistic (max 10,000,000).")
    except (ValueError, TypeError):
        errors.append("declaredValue must be a valid number.")

    # 7. Payment Mode & Service Tier
    payment_mode = _sanitize_string(payload.get("paymentMode")) or "Prepaid"
    if payment_mode not in VALID_PAYMENT_MODES:
        errors.append(f"paymentMode must be one of: {', '.join(sorted(VALID_PAYMENT_MODES))}.")

    raw_tier = _sanitize_string(payload.get("serviceTier")) or "AeroExpress Air"
    tier_map = {
        "express air": "AeroExpress Air",
        "aeroexpress air": "AeroExpress Air",
        "standard surface": "AeroSurface Standard",
        "aerosurface standard": "AeroSurface Standard",
        "same-day priority": "AeroHyperlocal Priority",
        "aerohyperlocal priority": "AeroHyperlocal Priority",
    }
    service_tier = tier_map.get(raw_tier.lower(), raw_tier)
    if service_tier not in VALID_SERVICE_TIERS:
        errors.append(f"serviceTier must be one of: {', '.join(sorted(VALID_SERVICE_TIERS))}.")

    # 8. Idempotency Key (optional client-supplied)
    idempotency_key = _sanitize_string(payload.get("idempotencyKey"))
    if idempotency_key and len(idempotency_key) > 128:
        errors.append("idempotencyKey must not exceed 128 characters.")

    if errors:
        return False, None, errors

    customer_email = _sanitize_string(payload.get("customerEmail")) or sender_email

    sender_data = {
        "name": sender_name,
        "facility": sender_facility,
        "city": sender_city,
        "state": sender_state,
        "pinCode": sender_pin,
        "phone": sender_phone,
        "address": sender_address,
    }
    if sender_email:
        sender_data["email"] = sender_email.lower()

    recipient_data = {
        "name": recipient_name,
        "city": recipient_city,
        "state": recipient_state,
        "pinCode": recipient_pin,
        "phone": recipient_phone,
        "address": recipient_address,
    }
    if recipient_email:
        recipient_data["email"] = recipient_email.lower()

    normalized: Dict[str, Any] = {
        "sender": sender_data,
        "recipient": recipient_data,
        "weightKg": round(weight_kg, 2),
        "dimensions": dimensions_str,
        "category": category,
        "declaredValue": round(declared_value, 2),
        "paymentMode": payment_mode,
        "serviceTier": service_tier,
        "idempotencyKey": idempotency_key or None,
    }
    if customer_email:
        normalized["customerEmail"] = customer_email.lower()

    return True, normalized, []
