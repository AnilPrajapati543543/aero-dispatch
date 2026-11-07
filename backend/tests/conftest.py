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


@pytest.fixture
def mock_dynamodb_table():
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
        # Inspect key from expression if possible
        items = list(idempotency_index.values())
        return {"Items": items}

    table.put_item.side_effect = put_item
    table.get_item.side_effect = get_item
    table.query.side_effect = query
    table._in_memory = in_memory_db
    table._idempotency_index = idempotency_index
    return table
