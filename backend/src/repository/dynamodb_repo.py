"""DynamoDB Repository for AeroDispatch Order Management."""
import os
from decimal import Decimal
from typing import Any, Dict, List, Optional
try:
    import boto3
    from botocore.exceptions import ClientError
except ImportError:
    boto3 = None

    class ClientError(Exception):
        """Fallback ClientError exception when botocore is not installed in local mock test runs."""
        def __init__(self, error_response=None, operation_name=None):
            self.response = error_response or {}
            self.operation_name = operation_name
            super().__init__(str(error_response))

from ..utils.logger import get_logger

logger = get_logger("dynamodb_repo")


def _floats_to_decimals(obj: Any) -> Any:
    """Recursively converts all Python float values to Decimal for DynamoDB storage."""
    if isinstance(obj, float):
        return Decimal(str(obj))
    elif isinstance(obj, dict):
        return {k: _floats_to_decimals(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [_floats_to_decimals(item) for item in obj]
    return obj


def _decimals_to_primitives(obj: Any) -> Any:
    """Recursively converts Decimal values back to standard Python float/int."""
    if isinstance(obj, Decimal):
        return int(obj) if obj % 1 == 0 else float(obj)
    elif isinstance(obj, dict):
        return {k: _decimals_to_primitives(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [_decimals_to_primitives(item) for item in obj]
    return obj


from ..interfaces import OrderRepositoryInterface

class DynamoDBOrderRepository(OrderRepositoryInterface):
    """Encapsulates all DynamoDB interactions for the Orders table."""

    def __init__(self, table: Optional[Any] = None, table_name: Optional[str] = None):
        self.table_name = table_name or os.getenv("ORDERS_TABLE_NAME", os.getenv("DYNAMODB_TABLE_NAME", "AeroDispatch-DDB-Orders"))
        if table:
            self.table = table
        else:
            if boto3 is None:
                raise ImportError("boto3 is required to initialize DynamoDBOrderRepository without a mock table.")
            region = os.getenv("AWS_REGION", os.getenv("AWS_DEFAULT_REGION", "ap-northeast-2"))
            dynamodb = boto3.resource("dynamodb", region_name=region)
            self.table = dynamodb.Table(self.table_name)

    def save_order(self, order_item: Dict[str, Any], is_new: bool = True) -> None:
        """
        Saves an order item to DynamoDB.
        Uses condition expression 'attribute_not_exists(orderId)' on initial creation to prevent collisions.
        """
        item_to_save = _floats_to_decimals(order_item)
        try:
            if is_new:
                self.table.put_item(
                    Item=item_to_save,
                    ConditionExpression="attribute_not_exists(orderId)",
                )
            else:
                self.table.put_item(Item=item_to_save)
            logger.info(
                f"Order successfully written to DynamoDB: {order_item.get('orderId')}",
                extra={"extra": {"orderId": order_item.get("orderId")}},
            )
        except ClientError as e:
            error_code = e.response.get("Error", {}).get("Code")
            if error_code == "ConditionalCheckFailedException":
                logger.warning(f"Order ID collision: {order_item.get('orderId')}")
                raise ValueError(f"An order with ID '{order_item.get('orderId')}' already exists.") from e
            logger.error(f"Failed to put order item in DynamoDB: {e}", exc_info=True)
            raise

    def get_order_by_id(self, order_id: str) -> Optional[Dict[str, Any]]:
        """Retrieves an order item by its partition key (orderId) or awbNumber."""
        if str(order_id).startswith("USER#"):
            return None
        try:
            response = self.table.get_item(Key={"orderId": order_id})
            item = response.get("Item")
            if item:
                return _decimals_to_primitives(item)
            
            # Fallback scan for awbNumber match if different from orderId
            scan_res = self.table.scan(
                FilterExpression="awbNumber = :awb",
                ExpressionAttributeValues={":awb": order_id},
                Limit=1
            )
            items = scan_res.get("Items", [])
            if items:
                return _decimals_to_primitives(items[0])
            return None
        except ClientError as e:
            logger.error(f"Failed to get order '{order_id}' from DynamoDB: {e}", exc_info=True)
            raise

    def get_order(self, order_id: str) -> Optional[Dict[str, Any]]:
        """Interface method alias for get_order_by_id."""
        return self.get_order_by_id(order_id)

    def get_order_by_idempotency_key(self, idempotency_key: str) -> Optional[Dict[str, Any]]:
        """
        Queries the IdempotencyIndex GSI to check if an order has already
        been submitted with this exact idempotency key.
        """
        try:
            from boto3.dynamodb.conditions import Key

            response = self.table.query(
                IndexName="IdempotencyIndex",
                KeyConditionExpression=Key("idempotencyKey").eq(idempotency_key),
                Limit=1,
            )
            items = response.get("Items", [])
            if items:
                return _decimals_to_primitives(items[0])
            return None
        except ClientError as e:
            logger.warning(
                f"Idempotency GSI query encountered ClientError: {e}. Falling back to normal flow."
            )
            return None
        except Exception as e:
            logger.warning(
                f"Unexpected error while querying IdempotencyIndex: {e}."
            )
            return None

    def update_order_status(
        self,
        order_id: str,
        new_status: str,
        event: Dict[str, Any],
        proof_of_delivery: Optional[Dict[str, Any]] = None,
    ) -> Optional[Dict[str, Any]]:
        """Updates status, appends event, and optionally adds proof of delivery."""
        order = self.get_order(order_id)
        if not order:
            return None
        order["currentStatus"] = new_status
        if "events" not in order:
            order["events"] = []
        order["events"].append(event)
        if proof_of_delivery:
            order["proofOfDelivery"] = proof_of_delivery
        self.save_order(_floats_to_decimals(order), is_new=False)
        return order

    def assign_driver(self, order_id: str, driver_info: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Assigns driver to order in DynamoDB."""
        order = self.get_order(order_id)
        if not order:
            return None
        order["assignedDriver"] = driver_info
        self.save_order(_floats_to_decimals(order), is_new=False)
        return order

    def set_customer_rating(
        self, order_id: str, rating_data: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """Sets customer rating on an order in DynamoDB."""
        order = self.get_order(order_id)
        if not order:
            return None
        order["customerRating"] = rating_data
        self.save_order(_floats_to_decimals(order), is_new=False)
        return order

    def list_orders(
        self,
        status: Optional[str] = None,
        driver_id: Optional[str] = None,
        customer_email: Optional[str] = None,
        limit: int = 50,
    ) -> List[Dict[str, Any]]:
        """Scans orders with optional filter (for dev/admin views)."""
        try:
            scan_kwargs: Dict[str, Any] = {"Limit": limit}
            response = self.table.scan(**scan_kwargs)
            items = [_decimals_to_primitives(item) for item in response.get("Items", [])]
            items = [i for i in items if not str(i.get("orderId", "")).startswith("USER#")]
            if status:
                items = [i for i in items if i.get("currentStatus") == status]
            if driver_id:
                items = [
                    i for i in items
                    if i.get("assignedDriver") and i["assignedDriver"].get("driverId") == driver_id
                ]
            if customer_email:
                c_norm = customer_email.strip().lower()
                items = [
                    i for i in items
                    if (i.get("customerEmail") and i["customerEmail"].strip().lower() == c_norm)
                    or (i.get("sender") and i["sender"].get("email") and i["sender"]["email"].strip().lower() == c_norm)
                    or (i.get("recipient") and i["recipient"].get("email") and i["recipient"]["email"].strip().lower() == c_norm)
                ]
            return items
        except Exception as e:
            logger.warning(f"Error scanning DynamoDB table: {e}")
            return []

