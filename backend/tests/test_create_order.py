"""Unit tests for AeroDispatch Order Creation Lambda and DynamoDB Integration.

Tests can be executed via:
    python3.12 -m unittest discover tests
or:
    pytest
"""
import base64
import json
import os
import unittest
from unittest.mock import MagicMock, patch

# Ensure test environment variables are active
os.environ["ORDERS_TABLE_NAME"] = "test-aerodispatch-orders"
os.environ["AWS_DEFAULT_REGION"] = "ap-south-1"
os.environ["LOG_LEVEL"] = "WARNING"

from src.handlers import create_order as handler_module
from src.repository.dynamodb_repo import DynamoDBOrderRepository, ClientError
from src.services.order_service import OrderService


class TestCreateOrderLambda(unittest.TestCase):
    """Test suite covering valid orders, validation rules, idempotency, and error scenarios."""

    def setUp(self):
        """Set up an in-memory mock DynamoDB table before each test."""
        self.mock_table = MagicMock()
        self.in_memory_orders = {}
        self.idempotency_map = {}

        def mock_put_item(Item, ConditionExpression=None):
            order_id = Item.get("orderId")
            if ConditionExpression and "attribute_not_exists" in ConditionExpression:
                if order_id in self.in_memory_orders:
                    raise ClientError(
                        {"Error": {"Code": "ConditionalCheckFailedException", "Message": "Conflict"}},
                        "PutItem",
                    )
            self.in_memory_orders[order_id] = Item
            if "idempotencyKey" in Item and Item["idempotencyKey"]:
                self.idempotency_map[Item["idempotencyKey"]] = Item
            return {}

        def mock_get_item(Key):
            order_id = Key.get("orderId")
            item = self.in_memory_orders.get(order_id)
            return {"Item": item} if item else {}

        def mock_query(IndexName=None, KeyConditionExpression=None, Limit=None):
            # In-memory query simulation for IdempotencyIndex
            items = []
            if KeyConditionExpression is not None:
                # KeyConditionExpression from boto3 stores expression values in expression_attribute_values
                # Or we can check if any item matches the query argument
                target_key = getattr(KeyConditionExpression, "get_expression", None)
            # Default to checking idempotency map
            items = list(self.idempotency_map.values())
            return {"Items": items}

        self.mock_table.put_item.side_effect = mock_put_item
        self.mock_table.get_item.side_effect = mock_get_item
        self.mock_table.query.side_effect = mock_query

        # Inject repository & service using this mock table into the handler
        self.repo = DynamoDBOrderRepository(table=self.mock_table)
        self.service = OrderService(repository=self.repo)
        handler_module.order_service = self.service

        self.valid_payload = {
            "sender": {
                "name": "Sharma Electronics Hub",
                "facility": "Registered Dispatch Node",
                "city": "New Delhi",
                "state": "Delhi",
                "pinCode": "110037",
                "phone": "+91 98112 34567",
                "address": "Warehouse 14, Aerocity Logistics Hub",
            },
            "recipient": {
                "name": "Meera Krishnan",
                "city": "Mumbai",
                "state": "Maharashtra",
                "pinCode": "400001",
                "phone": "+91 98200 44112",
                "address": "Flat 301, Palm Court, Marine Drive",
            },
            "weightKg": 1.5,
            "length": 25,
            "width": 18,
            "height": 10,
            "category": "Electronics",
            "declaredValue": 3500,
            "paymentMode": "Prepaid",
            "serviceTier": "AeroExpress Air",
        }

    def _build_event(self, body=None, headers=None, method="POST", is_b64=False):
        """Constructs an Amazon API Gateway HTTP API v2 event payload."""
        event_body = body
        if isinstance(body, dict):
            event_body = json.dumps(body)

        return {
            "version": "2.0",
            "routeKey": "POST /api/v1/orders",
            "rawPath": "/api/v1/orders",
            "headers": headers or {"content-type": "application/json"},
            "requestContext": {
                "http": {
                    "method": method,
                    "path": "/api/v1/orders",
                    "protocol": "HTTP/1.1",
                    "sourceIp": "127.0.0.1",
                    "userAgent": "AeroDispatch-Frontend/1.0",
                },
                "requestId": "req-test-uuid-001",
            },
            "body": event_body,
            "isBase64Encoded": is_b64,
        }

    # ==========================================================================
    # 1. Success Scenarios
    # ==========================================================================
    def test_create_order_success(self):
        """Valid order submission manifests successfully with 201 Created and AWB ID."""
        event = self._build_event(body=self.valid_payload)
        response = handler_module.lambda_handler(event, None)

        self.assertEqual(response["statusCode"], 201)
        self.assertIn("Access-Control-Allow-Origin", response["headers"])

        body = json.loads(response["body"])
        self.assertTrue(body["success"])
        self.assertEqual(body["message"], "Consignment manifested successfully.")

        data = body["data"]
        self.assertTrue(data["orderId"].startswith("AD-"))
        self.assertEqual(data["orderId"], data["awbNumber"])
        self.assertEqual(data["currentStatus"], "BOOKED")
        self.assertEqual(data["sender"]["city"], "New Delhi")
        self.assertEqual(data["recipient"]["city"], "Mumbai")
        self.assertEqual(data["weightKg"], 1.5)
        self.assertEqual(data["dimensions"], "25 x 18 x 10 cm")
        self.assertEqual(len(data["events"]), 1)
        self.assertEqual(data["events"][0]["status"], "BOOKED")

        # Verify DynamoDB put_item was called
        self.mock_table.put_item.assert_called_once()

    def test_create_order_with_flat_form_fields(self):
        """Direct flat form values from frontend CreateOrderPage are normalized properly."""
        flat_payload = {
            "senderName": "Delhi Express Merchant",
            "senderCity": "New Delhi",
            "senderPin": "110037",
            "senderAddress": "Cargo Hub 4",
            "senderPhone": "+91 98112 40012",
            "recipientName": "Aditya Sharma",
            "recipientCity": "Bengaluru",
            "recipientPin": "560038",
            "recipientAddress": "12th Main, Indiranagar",
            "recipientPhone": "+91 99001 88241",
            "weightKg": "2.5",
            "length": "30",
            "width": "20",
            "height": "15",
            "category": "Electronics",
            "declaredValue": "24999",
            "paymentMode": "Prepaid",
            "serviceTier": "AeroExpress Air",
        }
        event = self._build_event(body=flat_payload)
        response = handler_module.lambda_handler(event, None)

        self.assertEqual(response["statusCode"], 201)
        body = json.loads(response["body"])
        data = body["data"]
        self.assertEqual(data["sender"]["name"], "Delhi Express Merchant")
        self.assertEqual(data["recipient"]["name"], "Aditya Sharma")
        self.assertEqual(data["weightKg"], 2.5)

    def test_base64_encoded_body(self):
        """API Gateway base64-encoded requests are decoded and handled properly."""
        raw_json = json.dumps(self.valid_payload)
        b64_json = base64.b64encode(raw_json.encode("utf-8")).decode("utf-8")

        event = self._build_event(body=b64_json, is_b64=True)
        response = handler_module.lambda_handler(event, None)

        self.assertEqual(response["statusCode"], 201)
        body = json.loads(response["body"])
        self.assertTrue(body["success"])

    def test_options_cors_preflight(self):
        """HTTP OPTIONS requests return 200 OK immediately for browser preflights."""
        event = self._build_event(method="OPTIONS")
        response = handler_module.lambda_handler(event, None)

        self.assertEqual(response["statusCode"], 200)
        self.assertIn("Access-Control-Allow-Origin", response["headers"])
        self.assertIn("Access-Control-Allow-Methods", response["headers"])

    # ==========================================================================
    # 2. Validation & Bad Request Scenarios
    # ==========================================================================
    def test_validation_missing_required_fields(self):
        """Missing required recipient information returns 400 with VALIDATION_ERROR details."""
        invalid_payload = dict(self.valid_payload)
        invalid_payload["recipient"] = {
            "name": "",
            "city": "",
            "pinCode": "",
            "phone": "",
            "address": "",
        }

        event = self._build_event(body=invalid_payload)
        response = handler_module.lambda_handler(event, None)

        self.assertEqual(response["statusCode"], 400)
        body = json.loads(response["body"])
        self.assertFalse(body["success"])
        self.assertEqual(body["error"]["code"], "VALIDATION_ERROR")
        self.assertTrue(len(body["error"]["details"]) >= 4)

    def test_validation_invalid_weight(self):
        """Negative or zero Dead Weight returns 400 Bad Request."""
        invalid_payload = dict(self.valid_payload)
        invalid_payload["weightKg"] = -2.5

        event = self._build_event(body=invalid_payload)
        response = handler_module.lambda_handler(event, None)

        self.assertEqual(response["statusCode"], 400)
        body = json.loads(response["body"])
        self.assertEqual(body["error"]["code"], "VALIDATION_ERROR")
        self.assertTrue(any("weightKg" in d for d in body["error"]["details"]))

    def test_validation_invalid_service_tier(self):
        """Unsupported speed tier returns 400 Bad Request."""
        invalid_payload = dict(self.valid_payload)
        invalid_payload["serviceTier"] = "Teleportation Immediate"

        event = self._build_event(body=invalid_payload)
        response = handler_module.lambda_handler(event, None)

        self.assertEqual(response["statusCode"], 400)
        body = json.loads(response["body"])
        self.assertEqual(body["error"]["code"], "VALIDATION_ERROR")

    def test_malformed_json_body(self):
        """Unparseable JSON body returns 400 Bad Request."""
        event = self._build_event(body="{ broken json ...")
        response = handler_module.lambda_handler(event, None)

        self.assertEqual(response["statusCode"], 400)
        body = json.loads(response["body"])
        self.assertEqual(body["error"]["code"], "MALFORMED_JSON")

    def test_empty_body(self):
        """Empty request body returns 400 with EMPTY_BODY."""
        event = self._build_event(body="")
        response = handler_module.lambda_handler(event, None)

        self.assertEqual(response["statusCode"], 400)
        body = json.loads(response["body"])
        self.assertEqual(body["error"]["code"], "EMPTY_BODY")

    # ==========================================================================
    # 3. Duplicate Submission & Idempotency Scenarios
    # ==========================================================================
    def test_idempotent_duplicate_submission(self):
        """Resubmitting with the same X-Idempotency-Key returns existing order safely."""
        idempotency_key = "idemp-client-tx-999"
        headers = {
            "content-type": "application/json",
            "X-Idempotency-Key": idempotency_key,
        }

        # First request: Creates fresh order
        event1 = self._build_event(body=self.valid_payload, headers=headers)
        res1 = handler_module.lambda_handler(event1, None)
        self.assertEqual(res1["statusCode"], 201)
        data1 = json.loads(res1["body"])["data"]
        original_awb = data1["awbNumber"]

        # Configure mock query to return this order when looking up idempotency key
        self.mock_table.query.return_value = {"Items": [data1]}

        # Second request: Exact same idempotency key
        event2 = self._build_event(body=self.valid_payload, headers=headers)
        res2 = handler_module.lambda_handler(event2, None)

        self.assertEqual(res2["statusCode"], 200)
        self.assertEqual(res2["headers"].get("X-Idempotent-Replay"), "true")
        data2 = json.loads(res2["body"])["data"]

        # Must match original order without generating a new AWB or duplicate DB write
        self.assertEqual(data2["awbNumber"], original_awb)

    # ==========================================================================
    # 4. DynamoDB Service Error Handling
    # ==========================================================================
    def test_dynamodb_service_failure(self):
        """DynamoDB internal exceptions return 500 without leaking stack traces."""
        self.mock_table.put_item.side_effect = ClientError(
            {"Error": {"Code": "InternalServerError", "Message": "DynamoDB service busy"}},
            "PutItem",
        )

        event = self._build_event(body=self.valid_payload)
        response = handler_module.lambda_handler(event, None)

        self.assertEqual(response["statusCode"], 500)
        body = json.loads(response["body"])
        self.assertFalse(body["success"])
        self.assertEqual(body["error"]["code"], "INTERNAL_SERVER_ERROR")
        # Ensure sensitive Python tracebacks are omitted from client response
        self.assertNotIn("Traceback", response["body"])


if __name__ == "__main__":
    unittest.main()
