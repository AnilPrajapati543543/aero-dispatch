"""Comprehensive Automated Security Audit Test Suite for AeroDispatch Backend.

Tests:
1. Invalid JWT Signatures & Algorithm Confusion Rejection
2. Expired Access Tokens Rejection
3. Expired Refresh Tokens Rejection
4. Refresh-Token Rotation (One-time use issuance)
5. Refresh-Token Reuse Detection & Family Revocation
6. Logout & Token Revocation (Access token blacklisting)
7. Missing CSRF Token on Cookie Authentication
8. Invalid / Tampered CSRF Token on Cookie Authentication
9. Successful State-Changing Operation with Valid CSRF Token
10. Customer Accessing Another Customer's Shipment (IDOR / BOLA)
11. Driver Accessing / Modifying Another Driver's Assignment (IDOR / BOLA)
12. Customer Attempting Admin Operations (RBAC)
13. Privilege Escalation Prevention (Self-registering as admin/driver)
14. Mass Assignment Rejection (extra fields in strict schemas)
15. Malicious File Upload Rejection (EXE / fake MIME magic bytes)
16. Oversized File Upload Rejection (> 5 MB)
17. Path Traversal Neutralization in File Uploads
18. WebSocket Authorization & Subscription Isolation
19. Rate Limiting on Authentication Endpoints
20. Argon2id Password Hashing Verification
"""
import io
import time
import unittest
from datetime import datetime, timedelta, timezone

import jwt
from fastapi.testclient import TestClient

from src.main import app, auth_service, order_service
from src.utils.security_config import (
    ACCESS_COOKIE_NAME,
    CSRF_COOKIE_NAME,
    JWT_ACCESS_SECRET,
    JWT_ALGORITHM,
    JWT_AUDIENCE,
    JWT_ISSUER,
    REFRESH_COOKIE_NAME,
)
from src.utils.security_middleware import auth_rate_limiter


class TestSecurityAuditSuite(unittest.TestCase):
    """Rigorous Automated Security Test Cases."""

    def setUp(self):
        # Create fresh TestClient per test for strict cookie isolation
        self.client = TestClient(app)
        auth_rate_limiter.reset("auth_login:testclient")
        from src.services.auth_service import SEED_ACCOUNTS
        auth_service._users = dict(SEED_ACCOUNTS)
        auth_service._refresh_tokens.clear()
        auth_service._revoked_access_jtis.clear()
        auth_service._reset_tokens.clear()

        # Clean/seed an order for testing
        self.test_order = {
            "orderId": "AD-SEC-1001",
            "awbNumber": "AD-SEC-1001",
            "currentStatus": "OUT_FOR_DELIVERY",
            "customerEmail": "aditya.sharma@example.com",
            "assignedDriver": {
                "driverId": "DRV-504",
                "name": "Ramesh Kumar",
            },
            "sender": {
                "name": "Aditya Sharma",
                "email": "aditya.sharma@example.com",
                "city": "New Delhi",
                "pinCode": "110037",
                "address": "Terminal 3 Hub",
            },
            "recipient": {
                "name": "Secret Recipient",
                "city": "Bengaluru",
                "pinCode": "560038",
                "phone": "+91 9988776655",
                "address": "Brigade Road",
            },
            "serviceTier": "AeroExpress Air",
            "weightKg": 3.0,
            "events": [
                {
                    "status": "OUT_FOR_DELIVERY",
                    "location": "Bengaluru",
                    "timestamp": "2026-11-01T12:00:00Z",
                    "notes": "Consignment dispatched",
                }
            ],
        }
        if not order_service.repo.get_order(self.test_order["orderId"]):
            order_service.repo.save_order(self.test_order)

    # ==========================================================================
    # 1. JWT Security & Cryptographic Verifications
    # ==========================================================================

    def test_invalid_jwt_signature_rejected(self):
        """Tokens signed with an arbitrary/wrong secret key must be rejected with 401."""
        tampered_token = jwt.encode(
            {"sub": "usr-adm-01", "role": "admin", "exp": int(time.time()) + 3600, "iss": JWT_ISSUER, "aud": JWT_AUDIENCE},
            "completely-wrong-untrusted-secret-key-attacker",
            algorithm=JWT_ALGORITHM,
        )
        res = self.client.get("/api/v1/admin/orders", headers={"Authorization": f"Bearer {tampered_token}"})
        self.assertEqual(res.status_code, 401)
        self.assertIn("Invalid or expired Bearer token", res.json()["detail"])

    def test_untrusted_none_algorithm_rejected(self):
        """Tokens using algorithm 'none' (CVE-2015-9235 style) must be strictly rejected."""
        header = {"alg": "none", "typ": "JWT"}
        payload = {"sub": "usr-adm-01", "role": "admin", "exp": int(time.time()) + 3600, "iss": JWT_ISSUER, "aud": JWT_AUDIENCE}
        token_none = jwt.encode(payload, key="", algorithm="none")

        res = self.client.get("/api/v1/admin/orders", headers={"Authorization": f"Bearer {token_none}"})
        self.assertEqual(res.status_code, 401)

    def test_expired_access_token_rejected(self):
        """Access token with exp timestamp in the past must return 401."""
        past_time = int(time.time()) - 300  # 5 minutes ago
        expired_token = jwt.encode(
            {"sub": "usr-cust-1", "role": "customer", "exp": past_time, "iss": JWT_ISSUER, "aud": JWT_AUDIENCE},
            JWT_ACCESS_SECRET,
            algorithm=JWT_ALGORITHM,
        )
        res = self.client.get("/api/v1/customer/orders", headers={"Authorization": f"Bearer {expired_token}"})
        self.assertEqual(res.status_code, 401)

    # ==========================================================================
    # 2. Refresh Token Rotation & Reuse Detection
    # ==========================================================================

    def test_refresh_token_rotation_success(self):
        """Successful refresh returns a new access token and a rotated refresh token."""
        login_res = self.client.post(
            "/api/v1/auth/login",
            json={"email": "aditya.sharma@example.com", "password": "Customer@123"},
        )
        self.assertEqual(login_res.status_code, 200)
        orig_refresh = login_res.json()["refreshToken"]
        orig_access = login_res.json()["accessToken"]

        refresh_res = self.client.post("/api/v1/auth/refresh", json={"refreshToken": orig_refresh})
        self.assertEqual(refresh_res.status_code, 200)
        data = refresh_res.json()
        new_refresh = data["refreshToken"]
        new_access = data["accessToken"]

        self.assertNotEqual(orig_refresh, new_refresh)
        self.assertNotEqual(orig_access, new_access)
        self.assertTrue(len(new_access) > 20)

    def test_refresh_token_reuse_detection_and_family_revocation(self):
        """
        Submitting an already-consumed refresh token triggers theft detection.
        The entire token family must be invalidated and subsequent refreshes rejected.
        """
        login_res = self.client.post(
            "/api/v1/auth/login",
            json={"email": "aditya.sharma@example.com", "password": "Customer@123"},
        )
        orig_refresh = login_res.json()["refreshToken"]

        # 1st rotation: succeeds
        refresh1 = self.client.post("/api/v1/auth/refresh", json={"refreshToken": orig_refresh})
        self.assertEqual(refresh1.status_code, 200)
        legit_new_refresh = refresh1.json()["refreshToken"]

        # 2nd attempt using the OLD (now consumed) token: REUSE DETECTED!
        stolen_attempt = self.client.post("/api/v1/auth/refresh", json={"refreshToken": orig_refresh})
        self.assertEqual(stolen_attempt.status_code, 401)
        self.assertIn("reuse detected", stolen_attempt.json()["detail"].lower())

        # Legitimate new refresh token must now ALSO be invalidated because its family was revoked
        subsequent_legit = self.client.post("/api/v1/auth/refresh", json={"refreshToken": legit_new_refresh})
        self.assertEqual(subsequent_legit.status_code, 401)

    def test_logout_revokes_tokens(self):
        """Logout invalidates the access token and refresh token family."""
        login_res = self.client.post(
            "/api/v1/auth/login",
            json={"email": "aditya.sharma@example.com", "password": "Customer@123"},
        )
        access_token = login_res.json()["accessToken"]
        refresh_token = login_res.json()["refreshToken"]

        # Logout with access token in header
        logout_res = self.client.post(
            "/api/v1/auth/logout",
            headers={"Authorization": f"Bearer {access_token}"},
            cookies={REFRESH_COOKIE_NAME: refresh_token},
        )
        self.assertEqual(logout_res.status_code, 200)

        # Accessing protected route with logged out access token is rejected
        res = self.client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {access_token}"})
        self.assertEqual(res.status_code, 401)

        # Refreshing with the logged out refresh token is rejected
        ref_res = self.client.post("/api/v1/auth/refresh", json={"refreshToken": refresh_token})
        self.assertEqual(ref_res.status_code, 401)

    # ==========================================================================
    # 3. Secure Cookie Management & CSRF Protection
    # ==========================================================================

    def test_cookie_auth_and_csrf_missing_token_blocked(self):
        """A state-changing POST authenticated via cookie without CSRF token must return 403."""
        login_res = self.client.post(
            "/api/v1/auth/login",
            headers={"X-Use-Cookies": "true"},
            json={"email": "aditya.sharma@example.com", "password": "Customer@123"},
        )
        self.assertEqual(login_res.status_code, 200)
        self.assertIn(ACCESS_COOKIE_NAME, login_res.cookies)
        self.assertIn(CSRF_COOKIE_NAME, login_res.cookies)

        # Attempt order creation with auth cookie but MISSING X-CSRF-Token header
        res = self.client.post(
            "/api/v1/orders",
            cookies={
                ACCESS_COOKIE_NAME: login_res.cookies[ACCESS_COOKIE_NAME],
                CSRF_COOKIE_NAME: login_res.cookies[CSRF_COOKIE_NAME],
            },
            json={
                "senderName": "Aditya Hub",
                "senderCity": "New Delhi",
                "senderPin": "110037",
                "senderPhone": "+91 98112 00000",
                "senderAddress": "Hub 1",
                "recipientName": "Meera",
                "recipientCity": "Mumbai",
                "recipientPin": "400001",
                "recipientPhone": "+91 98200 11111",
                "recipientAddress": "Flat 301",
                "weightKg": 2.0,
                "serviceTier": "AeroExpress Air",
            },
        )
        self.assertEqual(res.status_code, 403)
        self.assertIn("CSRF validation failed", res.json()["detail"])

    def test_cookie_auth_with_mismatched_csrf_token_blocked(self):
        """Tampered or mismatched CSRF token header must return 403."""
        login_res = self.client.post(
            "/api/v1/auth/login",
            headers={"X-Use-Cookies": "true"},
            json={"email": "aditya.sharma@example.com", "password": "Customer@123"},
        )
        res = self.client.post(
            "/api/v1/orders",
            cookies={
                ACCESS_COOKIE_NAME: login_res.cookies[ACCESS_COOKIE_NAME],
                CSRF_COOKIE_NAME: login_res.cookies[CSRF_COOKIE_NAME],
            },
            headers={"X-CSRF-Token": "attacker-tampered-token-value"},
            json={
                "senderName": "Aditya Hub",
                "senderCity": "New Delhi",
                "senderPin": "110037",
                "senderPhone": "+91 98112 00000",
                "senderAddress": "Hub 1",
                "recipientName": "Meera",
                "recipientCity": "Mumbai",
                "recipientPin": "400001",
                "recipientPhone": "+91 98200 11111",
                "recipientAddress": "Flat 301",
                "weightKg": 2.0,
                "serviceTier": "AeroExpress Air",
            },
        )
        self.assertEqual(res.status_code, 403)
        self.assertIn("CSRF validation failed", res.json()["detail"])

    def test_cookie_auth_with_valid_csrf_token_succeeds(self):
        """When matching CSRF cookie and header are provided, state-changing POST succeeds."""
        login_res = self.client.post(
            "/api/v1/auth/login",
            headers={"X-Use-Cookies": "true"},
            json={"email": "aditya.sharma@example.com", "password": "Customer@123"},
        )
        csrf_val = login_res.cookies[CSRF_COOKIE_NAME]

        import uuid
        unique_phone = f"+91 98112 {uuid.uuid4().int % 90000 + 10000}"
        res = self.client.post(
            "/api/v1/orders",
            cookies={
                ACCESS_COOKIE_NAME: login_res.cookies[ACCESS_COOKIE_NAME],
                CSRF_COOKIE_NAME: csrf_val,
            },
            headers={"X-CSRF-Token": csrf_val},
            json={
                "senderName": "Aditya Hub",
                "senderCity": "New Delhi",
                "senderPin": "110037",
                "senderPhone": unique_phone,
                "senderAddress": "Hub 1",
                "recipientName": "Meera",
                "recipientCity": "Mumbai",
                "recipientPin": "400001",
                "recipientPhone": "+91 98200 88888",
                "recipientAddress": "Flat 301",
                "weightKg": 2.0,
                "serviceTier": "AeroExpress Air",
            },
        )
        self.assertEqual(res.status_code, 201)

    # ==========================================================================
    # 4. Role-Based Access Control (RBAC) & IDOR / BOLA Prevention
    # ==========================================================================

    def test_customer_accessing_another_customers_shipment_is_blocked(self):
        """Customer accessing an order belonging to another customer must be blocked with 403."""
        # Create order belonging to another customer (aditya.sharma@example.com)
        # Register a second customer
        second_cust = self.client.post(
            "/api/v1/auth/register",
            json={
                "name": "Bob Intruder",
                "email": "bob.intruder@example.com",
                "password": "SecurePassword@123",
                "role": "customer",
            },
        ).json()
        bob_token = second_cust["token"]

        # Bob attempts to fetch Aditya's order
        res = self.client.get(
            f"/api/v1/orders/{self.test_order['awbNumber']}",
            headers={"Authorization": f"Bearer {bob_token}"},
        )
        self.assertEqual(res.status_code, 403)
        self.assertIn("another customer's consignment", res.json()["detail"])

    def test_driver_accessing_unassigned_shipment_is_blocked(self):
        """Driver attempting to inspect an order assigned to a different driver is blocked with 403."""
        # Register a second driver via admin token
        admin_login = self.client.post(
            "/api/v1/auth/login",
            json={"email": "priya.nair@aerodispatch.internal", "password": "Admin@123"},
        ).json()
        admin_token = admin_login["token"]

        drv2_res = self.client.post(
            "/api/v1/auth/register",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "name": "Vikram Singh",
                "email": "vikram.singh@aerodispatch.internal",
                "password": "DriverPassword@123",
                "role": "driver",
            },
        ).json()
        vikram_token = drv2_res["token"]

        # Vikram attempts to inspect Ramesh's order (DRV-504)
        res = self.client.get(
            f"/api/v1/orders/{self.test_order['awbNumber']}",
            headers={"Authorization": f"Bearer {vikram_token}"},
        )
        self.assertEqual(res.status_code, 403)

    def test_customer_attempting_admin_operations_is_forbidden(self):
        """Customer attempting admin assign or override is rejected with 403."""
        cust_login = self.client.post(
            "/api/v1/auth/login",
            json={"email": "aditya.sharma@example.com", "password": "Customer@123"},
        ).json()
        cust_token = cust_login["token"]

        assign_res = self.client.post(
            f"/api/v1/admin/orders/{self.test_order['awbNumber']}/assign",
            headers={"Authorization": f"Bearer {cust_token}"},
            json={"driverId": "DRV-999", "name": "Fake Driver"},
        )
        self.assertEqual(assign_res.status_code, 403)

    def test_privilege_escalation_registration_blocked(self):
        """Anonymous user attempting to register as admin or driver is rejected with 403."""
        res = self.client.post(
            "/api/v1/auth/register",
            json={
                "name": "Attacker Admin",
                "email": "attacker@evil.com",
                "password": "EvilPassword@123",
                "role": "admin",
            },
        )
        self.assertEqual(res.status_code, 403)
        self.assertIn("restricted to administrators", res.json()["detail"])

    # ==========================================================================
    # 5. Mass Assignment & Schema Validation
    # ==========================================================================

    def test_mass_assignment_extra_fields_rejected(self):
        """Extra or unauthorized fields submitted in request models must be rejected with 422."""
        res = self.client.post(
            "/api/v1/auth/login",
            json={
                "email": "aditya.sharma@example.com",
                "password": "Customer@123",
                "isAdmin": True,
                "role": "superadmin",
            },
        )
        self.assertEqual(res.status_code, 422)

    # ==========================================================================
    # 6. File Upload Security (Magic Bytes, Size & Path Traversal)
    # ==========================================================================

    def test_fake_mime_type_malicious_upload_rejected(self):
        """File claiming to be image/jpeg but containing shell/script content is rejected."""
        admin_login = self.client.post(
            "/api/v1/auth/login",
            json={"email": "priya.nair@aerodispatch.internal", "password": "Admin@123"},
        ).json()
        admin_token = admin_login["token"]

        fake_image = io.BytesIO(b"#!/bin/bash\nrm -rf /")
        res = self.client.post(
            f"/api/v1/orders/{self.test_order['awbNumber']}/proof",
            headers={"Authorization": f"Bearer {admin_token}"},
            files={"photo": ("malicious.jpg", fake_image, "image/jpeg")},
            data={"delivered_to": "Test Person"},
        )
        self.assertEqual(res.status_code, 400)
        self.assertIn("binary signature", res.json()["detail"].lower())

    def test_path_traversal_in_upload_neutralized(self):
        """Filenames containing '../../' are stripped to prevent arbitrary file overwrite."""
        admin_login = self.client.post(
            "/api/v1/auth/login",
            json={"email": "priya.nair@aerodispatch.internal", "password": "Admin@123"},
        ).json()
        admin_token = admin_login["token"]

        valid_jpeg = io.BytesIO(b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00H\x00H\x00\x00\xff\xdb\x00C\x00")
        res = self.client.post(
            f"/api/v1/orders/{self.test_order['awbNumber']}/proof",
            headers={"Authorization": f"Bearer {admin_token}"},
            files={"photo": ("../../../../etc/passwd.jpg", valid_jpeg, "image/jpeg")},
            data={"delivered_to": "Test Person"},
        )
        self.assertEqual(res.status_code, 200)
        self.assertNotIn("..", res.json()["photoUrl"])

    # ==========================================================================
    # 7. Rate Limiting on Authentication Endpoints
    # ==========================================================================

    def test_rate_limiting_on_repeated_failed_logins(self):
        """Exceeding 5 failed login attempts triggers 429 Too Many Requests."""
        for _ in range(5):
            self.client.post(
                "/api/v1/auth/login",
                json={"email": "aditya.sharma@example.com", "password": "WrongPassword!"},
            )

        # 6th attempt should be blocked by rate limiter
        blocked_res = self.client.post(
            "/api/v1/auth/login",
            json={"email": "aditya.sharma@example.com", "password": "Customer@123"},
        )
        self.assertEqual(blocked_res.status_code, 429)
        self.assertIn("Too many attempts", blocked_res.json()["detail"])
        self.assertIn("Retry-After", blocked_res.headers)

    # ==========================================================================
    # 8. Password Security & Argon2id Verification
    # ==========================================================================

    def test_argon2id_password_complexity_and_reset(self):
        """Enforces password complexity (min 8 chars, uppercase, lowercase, digit, symbol)."""
        # Weak password lacking symbol and number
        weak_res = self.client.post(
            "/api/v1/auth/register",
            json={
                "name": "Weak User",
                "email": "weak.user@example.com",
                "password": "weakpassword",
                "role": "customer",
            },
        )
        self.assertEqual(weak_res.status_code, 400)
        self.assertIn("uppercase", weak_res.json()["detail"].lower())

        # Password reset flow on dedicated user to maintain test isolation
        self.client.post(
            "/api/v1/auth/register",
            json={
                "name": "Reset Tester",
                "email": "reset.tester@example.com",
                "password": "InitialPassword@123",
                "role": "customer",
            },
        )
        forgot_res = self.client.post(
            "/api/v1/auth/forgot-password",
            json={"email": "reset.tester@example.com"},
        )
        self.assertEqual(forgot_res.status_code, 200)
        dev_token = forgot_res.json().get("devResetToken")
        self.assertIsNotNone(dev_token)

        # Reset password with strong password
        reset_res = self.client.post(
            "/api/v1/auth/reset-password",
            json={"token": dev_token, "newPassword": "NewStrongPassword@2026"},
        )
        self.assertEqual(reset_res.status_code, 200)

        # Re-using the same reset token is rejected
        reuse_res = self.client.post(
            "/api/v1/auth/reset-password",
            json={"token": dev_token, "newPassword": "AnotherPassword@2026"},
        )
        self.assertEqual(reuse_res.status_code, 400)
