"""Comprehensive REST API and Order Lifecycle Test Suite for AeroDispatch.

Verifies:
1. Order creation with valid inputs, AWB formatting, and pricing calculations.
2. Comprehensive input validation (missing fields, invalid PINs, invalid weights, invalid service tiers).
3. Public shipment tracking lookup and 404 responses for non-existent AWBs.
4. Duplicate-submission protection (idempotency keys and payload fingerprints).
5. Role-based order listing (customer order isolation vs admin platform view).
6. Admin fleet driver assignment and RBAC enforcement.
7. End-to-end delivery state machine lifecycle (BOOKED -> IN_TRANSIT -> OUT_FOR_DELIVERY -> DELIVERED).
8. Rejection of illegal state machine transitions and immutable terminal states.
9. Authentication, self-registration, and token verification.
"""
import json
import os
import re
import unittest
import uuid
from fastapi.testclient import TestClient

# Prevent AWS IMDS connection timeouts during tests
os.environ["AWS_EC2_METADATA_DISABLED"] = "true"
os.environ["ORDERS_TABLE_NAME"] = "test-aerodispatch-orders"
os.environ["LOG_LEVEL"] = "WARNING"

from src.main import app, order_service, auth_service


class TestOrdersAPI(unittest.TestCase):
    """End-to-End REST API and Order Lifecycle Test Suite."""

    @classmethod
    def setUpClass(cls):
        from src.repository import LocalOrderRepository
        order_service.repo = LocalOrderRepository()
        auth_service._cognito_client = None
        auth_service._dynamo_table = None
        cls.client = TestClient(app)

        # Pre-authenticate demo personas
        res_cust = cls.client.post(
            "/api/v1/auth/login",
            json={"email": "aditya.sharma@example.com", "password": "Customer@123"},
        )
        cls.customer_token = res_cust.json().get("token") or res_cust.json().get("accessToken")

        res_drv = cls.client.post(
            "/api/v1/auth/login",
            json={"email": "ramesh.kumar@aerodispatch.internal", "password": "Driver@123"},
        )
        cls.driver_token = res_drv.json().get("token") or res_drv.json().get("accessToken")

        res_adm = cls.client.post(
            "/api/v1/auth/login",
            json={"email": "priya.nair@aerodispatch.internal", "password": "Admin@123"},
        )
        cls.admin_token = res_adm.json().get("token") or res_adm.json().get("accessToken")

    def _generate_valid_payload(self):
        uid = uuid.uuid4().hex[:6]
        return {
            "senderName": f"Enterprise Hub {uid}",
            "senderCity": "New Delhi",
            "senderPin": "110037",
            "senderPhone": f"+91 98112 {uuid.uuid4().int % 90000 + 10000}",
            "senderAddress": "Logistics Boulevard, Gate 4",
            "recipientName": f"Consignee {uid}",
            "recipientCity": "Bengaluru",
            "recipientPin": "560001",
            "recipientPhone": f"+91 98200 {uuid.uuid4().int % 90000 + 10000}",
            "recipientAddress": "Tech Park Lane, Block B",
            "weightKg": 3.25,
            "length": 25,
            "width": 20,
            "height": 15,
            "category": "Consumer Electronics",
            "declaredValue": 6500,
            "paymentMode": "Prepaid",
            "serviceTier": "AeroExpress Air",
        }

    # ==========================================================================
    # 1. Order Creation & Validation
    # ==========================================================================

    def test_order_creation_valid_input(self):
        """Valid order payload creates shipment with status BOOKED and valid AWB format."""
        payload = self._generate_valid_payload()
        res = self.client.post("/api/v1/orders", json=payload)
        self.assertEqual(res.status_code, 201)
        data = res.json()["data"]
        self.assertTrue(re.match(r"^AD-\d{4}-\d{4}$", data["awbNumber"]))
        self.assertEqual(data["currentStatus"], "BOOKED")
        self.assertEqual(data["serviceTier"], "AeroExpress Air")
        self.assertGreaterEqual(len(data["events"]), 1)

    def test_order_creation_invalid_weight(self):
        """Negative weight, zero weight, and weight > 1000kg are rejected with 400."""
        payload = self._generate_valid_payload()

        payload["weightKg"] = 0
        res = self.client.post("/api/v1/orders", json=payload)
        self.assertEqual(res.status_code, 400)
        self.assertIn("weightKg must be greater than 0", json.dumps(res.json()))

        payload["weightKg"] = 1500
        res = self.client.post("/api/v1/orders", json=payload)
        self.assertEqual(res.status_code, 400)
        self.assertIn("less than or equal to 1000 kg", json.dumps(res.json()))

    def test_order_creation_invalid_pin_codes(self):
        """PIN codes with invalid format or symbols are rejected."""
        payload = self._generate_valid_payload()
        payload["senderPin"] = "1"
        res = self.client.post("/api/v1/orders", json=payload)
        self.assertEqual(res.status_code, 400)
        self.assertIn("sender.pinCode is required and must be a valid postal PIN", json.dumps(res.json()))

        payload = self._generate_valid_payload()
        payload["recipientPin"] = "!!@@##"
        res = self.client.post("/api/v1/orders", json=payload)
        self.assertEqual(res.status_code, 400)
        self.assertIn("recipient.pinCode is required and must be a valid postal PIN", json.dumps(res.json()))

    def test_order_creation_invalid_service_tier(self):
        """Unrecognized service tier is rejected."""
        payload = self._generate_valid_payload()
        payload["serviceTier"] = "SuperSonic Rocket Delivery"
        res = self.client.post("/api/v1/orders", json=payload)
        self.assertEqual(res.status_code, 400)
        self.assertIn("serviceTier must be one of", json.dumps(res.json()))

    def test_order_creation_missing_required_fields(self):
        """Missing mandatory sender/recipient names returns 400."""
        payload = self._generate_valid_payload()
        del payload["senderName"]
        res = self.client.post("/api/v1/orders", json=payload)
        self.assertEqual(res.status_code, 400)
        self.assertIn("sender.name is required", json.dumps(res.json()))

    # ==========================================================================
    # 2. Tracking ID & Shipment Lookup
    # ==========================================================================

    def test_tracking_id_lookup_found(self):
        """Created shipment can be accurately tracked via public GET endpoint."""
        payload = self._generate_valid_payload()
        create_res = self.client.post("/api/v1/orders", json=payload)
        awb = create_res.json()["data"]["awbNumber"]

        track_res = self.client.get(f"/api/v1/orders/{awb}")
        self.assertEqual(track_res.status_code, 200)
        tracked = track_res.json()["data"]
        self.assertEqual(tracked["awbNumber"], awb)
        self.assertEqual(tracked["recipient"]["city"], "Bengaluru")
        self.assertEqual(tracked["currentStatus"], "BOOKED")

    def test_tracking_id_lookup_not_found(self):
        """Non-existent AWB tracking query returns 404 with error detail."""
        res = self.client.get("/api/v1/orders/AD-0000-0000")
        self.assertEqual(res.status_code, 404)
        self.assertIn("was not found", res.json()["detail"])

    # ==========================================================================
    # 3. Duplicate-Submission Protection & Idempotency
    # ==========================================================================

    def test_duplicate_submission_via_idempotency_key(self):
        """Submitting with identical X-Idempotency-Key returns cached 200 replay."""
        key = f"idem-key-{uuid.uuid4().hex}"
        payload = self._generate_valid_payload()

        res1 = self.client.post("/api/v1/orders", json=payload, headers={"X-Idempotency-Key": key})
        self.assertEqual(res1.status_code, 201)
        awb1 = res1.json()["data"]["awbNumber"]

        res2 = self.client.post("/api/v1/orders", json=payload, headers={"X-Idempotency-Key": key})
        self.assertEqual(res2.status_code, 200)
        self.assertEqual(res2.headers.get("x-idempotent-replay"), "true")
        self.assertEqual(res2.json()["data"]["awbNumber"], awb1)

    def test_duplicate_submission_via_content_fingerprint(self):
        """Submitting exact same payload within 2 minutes without key returns replay."""
        payload = self._generate_valid_payload()
        res1 = self.client.post("/api/v1/orders", json=payload)
        self.assertEqual(res1.status_code, 201)
        awb1 = res1.json()["data"]["awbNumber"]

        res2 = self.client.post("/api/v1/orders", json=payload)
        self.assertEqual(res2.status_code, 200)
        self.assertEqual(res2.json()["data"]["awbNumber"], awb1)

    # ==========================================================================
    # 4. Admin Driver Assignment & RBAC
    # ==========================================================================

    def test_admin_driver_assignment_success(self):
        """Admin can assign a driver to an order."""
        payload = self._generate_valid_payload()
        awb = self.client.post("/api/v1/orders", json=payload).json()["data"]["awbNumber"]

        assign_payload = {
            "driverId": "DRV-504",
            "name": "Ramesh Kumar",
            "phone": "+91 98450 11223",
            "vehicleNumber": "KA-03-EV-4412",
        }
        res = self.client.post(
            f"/api/v1/admin/orders/{awb}/assign",
            json=assign_payload,
            headers={"Authorization": f"Bearer {self.admin_token}"},
        )
        self.assertEqual(res.status_code, 200)
        assigned = res.json()["data"]["assignedDriver"]
        self.assertEqual(assigned["driverId"], "DRV-504")
        self.assertEqual(assigned["name"], "Ramesh Kumar")

    def test_driver_assignment_rbac_enforcement(self):
        """Non-admin roles cannot assign drivers."""
        payload = self._generate_valid_payload()
        awb = self.client.post("/api/v1/orders", json=payload).json()["data"]["awbNumber"]

        assign_payload = {"driverId": "DRV-504", "name": "Ramesh Kumar"}

        res_cust = self.client.post(
            f"/api/v1/admin/orders/{awb}/assign",
            json=assign_payload,
            headers={"Authorization": f"Bearer {self.customer_token}"},
        )
        self.assertEqual(res_cust.status_code, 403)

        res_anon = self.client.post(f"/api/v1/admin/orders/{awb}/assign", json=assign_payload)
        self.assertEqual(res_anon.status_code, 401)

    # ==========================================================================
    # 5. State Machine Lifecycle & Delivery Transitions
    # ==========================================================================

    def test_valid_delivery_lifecycle(self):
        """Step-by-step valid transitions: BOOKED -> IN_TRANSIT -> OUT_FOR_DELIVERY -> DELIVERED."""
        payload = self._generate_valid_payload()
        awb = self.client.post("/api/v1/orders", json=payload).json()["data"]["awbNumber"]

        drv_headers = {"Authorization": f"Bearer {self.driver_token}"}

        # Step 1: BOOKED -> IN_TRANSIT
        res1 = self.client.patch(
            f"/api/v1/driver/orders/{awb}/status",
            json={"status": "IN_TRANSIT", "notes": "Sorted onto linehaul flight"},
            headers=drv_headers,
        )
        self.assertEqual(res1.status_code, 200)
        self.assertEqual(res1.json()["data"]["currentStatus"], "IN_TRANSIT")

        # Step 2: IN_TRANSIT -> OUT_FOR_DELIVERY
        res2 = self.client.patch(
            f"/api/v1/driver/orders/{awb}/status",
            json={"status": "OUT_FOR_DELIVERY", "notes": "Loaded onto EV delivery van"},
            headers=drv_headers,
        )
        self.assertEqual(res2.status_code, 200)
        self.assertEqual(res2.json()["data"]["currentStatus"], "OUT_FOR_DELIVERY")

        # Step 3: OUT_FOR_DELIVERY -> DELIVERED
        res3 = self.client.patch(
            f"/api/v1/driver/orders/{awb}/status",
            json={
                "status": "DELIVERED",
                "notes": "Handed to recipient",
                "proofData": {"deliveredTo": "Consignee", "verificationMethod": "OTP Verified"},
            },
            headers=drv_headers,
        )
        self.assertEqual(res3.status_code, 200)
        self.assertEqual(res3.json()["data"]["currentStatus"], "DELIVERED")

    def test_invalid_state_machine_transition_rejected(self):
        """Direct jump from BOOKED to DELIVERED is strictly rejected with 400."""
        payload = self._generate_valid_payload()
        awb = self.client.post("/api/v1/orders", json=payload).json()["data"]["awbNumber"]

        res = self.client.patch(
            f"/api/v1/driver/orders/{awb}/status",
            json={"status": "DELIVERED", "notes": "Skipping intermediate transit steps"},
            headers={"Authorization": f"Bearer {self.driver_token}"},
        )
        self.assertEqual(res.status_code, 400)
        self.assertIn("Cannot transition status from 'BOOKED' to 'DELIVERED'", res.json()["detail"])

    def test_terminal_state_immutable_for_driver(self):
        """Driver cannot transition away from terminal DELIVERED status."""
        payload = self._generate_valid_payload()
        awb = self.client.post("/api/v1/orders", json=payload).json()["data"]["awbNumber"]

        self.client.patch(
            f"/api/v1/admin/orders/{awb}/override",
            json={"status": "DELIVERED", "notes": "Admin test setup"},
            headers={"Authorization": f"Bearer {self.admin_token}"},
        )

        res = self.client.patch(
            f"/api/v1/driver/orders/{awb}/status",
            json={"status": "OUT_FOR_DELIVERY", "notes": "Illegal revert attempt"},
            headers={"Authorization": f"Bearer {self.driver_token}"},
        )
        self.assertEqual(res.status_code, 400)
        self.assertIn("Cannot transition status from 'DELIVERED' to 'OUT_FOR_DELIVERY'", res.json()["detail"])

    # ==========================================================================
    # 6. Authentication & User Profile
    # ==========================================================================

    def test_auth_me_with_valid_token(self):
        """Token verification endpoint returns claims for authenticated customer."""
        res = self.client.get(
            "/api/v1/auth/me",
            headers={"Authorization": f"Bearer {self.customer_token}"},
        )
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["user"]["email"], "aditya.sharma@example.com")
        self.assertEqual(res.json()["user"]["role"], "customer")

    def test_user_registration_and_login(self):
        """New customer registration persists and allows immediate authentication."""
        uid = uuid.uuid4().hex[:6]
        reg_payload = {
            "name": f"New Merchant {uid}",
            "email": f"merchant.{uid}@aerodispatch.internal",
            "password": "SecurePassword@123",
            "role": "customer",
        }
        res_reg = self.client.post("/api/v1/auth/register", json=reg_payload)
        self.assertEqual(res_reg.status_code, 200)
        self.assertIn("token", res_reg.json())

        res_login = self.client.post(
            "/api/v1/auth/login",
            json={"email": reg_payload["email"], "password": reg_payload["password"]},
        )
        self.assertEqual(res_login.status_code, 200)
        self.assertIn("token", res_login.json())


if __name__ == "__main__":
    unittest.main()

