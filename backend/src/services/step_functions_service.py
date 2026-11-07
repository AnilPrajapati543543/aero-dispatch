"""
AWS Step Functions Delivery SLA Watchdog Service.

Manages 15-minute driver pickup SLA workflows:
1. Starts state machine execution when an order is assigned to a courier.
2. Stops watchdog if courier accepts and begins transit within 15 minutes.
3. Automatically triggers auto-reassignment or admin alert if SLA expires.
"""
import os
import time
import json
from typing import Dict, Any, Optional
from ..utils.logger import get_logger

logger = get_logger("service.stepfunctions")


class StepFunctionsService:
    def __init__(
        self,
        state_machine_arn: Optional[str] = None,
        region: Optional[str] = None,
    ):
        self.region = region or os.getenv("AWS_DEFAULT_REGION", "ap-northeast-2")
        self.state_machine_arn = state_machine_arn or os.getenv(
            "SLA_STATE_MACHINE_ARN",
            "arn:aws:states:ap-northeast-2:761112473042:stateMachine:AeroDispatch-DeliverySLA-Watchdog",
        )
        self.client = None
        try:
            import boto3
            self.client = boto3.client("stepfunctions", region_name=self.region)
            logger.info("Initialized AWS Step Functions client.")
        except Exception as e:
            logger.warning(f"Could not initialize Step Functions: {e}. Using simulated SLA tracker.")

    def start_sla_watchdog(self, order_id: str, driver_id: str) -> Dict[str, Any]:
        """Starts 15-minute delivery SLA countdown for newly assigned order."""
        timestamp = int(time.time())
        execution_name = f"SLA-{order_id.replace('-', '')}-{timestamp}"[:80]
        payload = {
            "orderId": order_id,
            "driverId": driver_id,
            "assignedAt": timestamp,
            "slaTimeoutMinutes": 15,
        }

        if self.client and self.state_machine_arn:
            try:
                res = self.client.start_execution(
                    stateMachineArn=self.state_machine_arn,
                    name=execution_name,
                    input=json.dumps(payload),
                )
                execution_arn = res.get("executionArn")
                logger.info(f"Started AWS Step Functions SLA Watchdog for {order_id}: {execution_arn}")
                return {
                    "status": "RUNNING",
                    "executionArn": execution_arn,
                    "orderId": order_id,
                    "slaMinutes": 15,
                    "channel": "AWS_STEP_FUNCTIONS",
                }
            except Exception as e:
                logger.warning(f"Step Functions start_execution error: {e}")

        # Simulated SLA tracking
        return {
            "status": "RUNNING",
            "executionArn": f"simulated-sfn-sla-{order_id}",
            "orderId": order_id,
            "slaMinutes": 15,
            "channel": "SIMULATED",
        }

    def stop_sla_watchdog(self, execution_arn: str, reason: str = "Driver accepted package within SLA") -> Dict[str, Any]:
        """Stops watchdog when driver picks up parcel before the 15-minute timeout."""
        if not execution_arn or execution_arn.startswith("simulated-"):
            return {"status": "STOPPED", "reason": reason}

        if self.client:
            try:
                self.client.stop_execution(
                    executionArn=execution_arn,
                    cause=reason,
                    error="SLAFulfilled",
                )
                logger.info(f"Stopped AWS Step Functions SLA Watchdog: {execution_arn}")
                return {"status": "STOPPED", "executionArn": execution_arn, "reason": reason}
            except Exception as e:
                logger.warning(f"Step Functions stop_execution note: {e}")

        return {"status": "STOPPED", "reason": reason}

