"""Pytest fixtures and mock configurations for AeroDispatch backend."""
import os
import pytest
from unittest.mock import MagicMock

# Set test environment variables before any module loads
os.environ["ORDERS_TABLE_NAME"] = "test-aerodispatch-orders"
os.environ["AWS_DEFAULT_REGION"] = "ap-south-1"
os.environ["AWS_EC2_METADATA_DISABLED"] = "true"
os.environ["MOCK_AWS"] = "true"
os.environ["LOG_LEVEL"] = "WARNING"


@pytest.fixture(autouse=True)
def isolate_services_for_testing():
    """Guarantees mock in-memory isolation for all AWS services during tests."""
    from src.main import (
        location_service,
        notification_service,
        rekognition_service,
        step_functions_service,
        auth_service,
        order_service,
    )
    from src.repository import LocalOrderRepository
    from src.services.auth_service import hash_password_argon2

    order_service.repo = LocalOrderRepository()
    location_service.client = None
    notification_service.ses_client = None
    notification_service.sns_client = None
    rekognition_service.client = None
    step_functions_service.client = None
    auth_service._cognito_client = None
    auth_service._dynamo_table = None

    # Seed test users for test suites
    test_users = {
        "aditya.sharma@example.com": {
            "id": "usr-cust-test-001",
            "name": "Aditya Sharma",
            "email": "aditya.sharma@example.com",
            "role": "customer",
            "passwordHash": hash_password_argon2("Customer@123"),
        },
        "ramesh.kumar@aerodispatch.internal": {
            "id": "usr-drv-test-001",
            "driverId": "DRV-504",
            "name": "Ramesh Kumar",
            "email": "ramesh.kumar@aerodispatch.internal",
            "role": "driver",
            "passwordHash": hash_password_argon2("Driver@123"),
        },
        "priya.nair@aerodispatch.internal": {
            "id": "usr-adm-test-001",
            "name": "Priya Nair",
            "email": "priya.nair@aerodispatch.internal",
            "role": "admin",
            "passwordHash": hash_password_argon2("Admin@123"),
        },
        "admin@aerodispatch.io": {
            "id": "usr-adm-root",
            "name": "Operations Executive Admin",
            "email": "admin@aerodispatch.io",
            "role": "admin",
            "passwordHash": hash_password_argon2("Admin@123"),
        },
    }
    for em, u in test_users.items():
        auth_service._users[em] = u

    yield

@pytest.fixture
def mock_dynamo_table():
    """Provides a mock DynamoDB Table object with in-memory storage."""
    table = MagicMock()
    in_memory_db = {}
    idempotency_index = {}

    def put_item(Item, ConditionExpression=None):
        order_id = Item.get("orderId")
        if ConditionExpression and "attribute_not_exists" in ConditionExpression:
            if order_id in in_memory_db:
                from botocore.exceptions import ClientError
                raise ClientError(
                    {"Error": {"Code": "ConditionalCheckFailedException", "Message": "Item exists"}},
                    "PutItem",
                )
        in_memory_db[order_id] = Item
        if "idempotencyKey" in Item:
            idempotency_index[Item["idempotencyKey"]] = Item
        return {}

    def get_item(Key):
        order_id = Key.get("orderId")
        item = in_memory_db.get(order_id)
        return {"Item": item} if item else {}

    def query(IndexName=None, KeyConditionExpression=None, Limit=None):
        items = list(idempotency_index.values())
        return {"Items": items}

    table.put_item.side_effect = put_item
    table.get_item.side_effect = get_item
    table.query.side_effect = query
    table._in_memory = in_memory_db
    table._idempotency_index = idempotency_index
    return table
