"""
Automated Test Suite for Smart AWS Logistics Services:
1. Amazon Location Service (Geocoding, Routes, 500m Geofencing)
2. Amazon SNS & SES (SMS alerts & Delivery Email Receipts)
3. Amazon Rekognition (Computer Vision AI Photo Verification)
4. AWS Step Functions (15-Minute Driver SLA Watchdog)
"""
import unittest
from fastapi.testclient import TestClient

from src.main import (
    app,
    location_service,
    notification_service,
    rekognition_service,
    step_functions_service,
)


class TestSmartLogisticsServices(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        location_service.client = None
        notification_service._sns_client = None
        notification_service._ses_client = None
        rekognition_service.client = None
        step_functions_service.client = None
        cls.client = TestClient(app)

    # --------------------------------------------------------------------------
    # 1. Amazon Location Service Tests
    # --------------------------------------------------------------------------
    def test_location_geocoding(self):
        """Tests that address geocoding returns valid latitude and longitude."""
        res = location_service.geocode_address("Sector 62, Noida")
        self.assertIn("lat", res)
        self.assertIn("lng", res)
        self.assertTrue(isinstance(res["lat"], (int, float)))
        self.assertTrue(isinstance(res["lng"], (int, float)))

    def test_location_route_calculation(self):
        """Tests turn-by-turn driving distance and ETA calculation."""
        origin = (28.6139, 77.2090)  # Delhi
        dest = (28.5355, 77.3910)    # Noida
        route = location_service.calculate_route(origin, dest)
        self.assertIn("distanceKm", route)
        self.assertIn("durationMinutes", route)
        self.assertGreater(route["distanceKm"], 0)
        self.assertGreater(route["durationMinutes"], 0)

    def test_500m_geofence_detection_inside(self):
        """Tests that a driver within 500 meters triggers arrival alert."""
        dest_lat, dest_lng = 28.5355, 77.3910
        # Driver 200 meters away
        driver_lat, driver_lng = 28.5370, 77.3915

        res = location_service.check_geofence_proximity(driver_lat, driver_lng, dest_lat, dest_lng, radius_meters=500.0)
        self.assertTrue(res["insideGeofence"])
        self.assertLessEqual(res["distanceMeters"], 500.0)
        self.assertEqual(res["alert"], "Driver is arriving at your door!")

    def test_500m_geofence_detection_outside(self):
        """Tests that a driver >500 meters away does not trigger arrival alert."""
        dest_lat, dest_lng = 28.5355, 77.3910
        # Driver 10 km away
        driver_lat, driver_lng = 28.6139, 77.2090

        res = location_service.check_geofence_proximity(driver_lat, driver_lng, dest_lat, dest_lng, radius_meters=500.0)
        self.assertFalse(res["insideGeofence"])
        self.assertGreater(res["distanceMeters"], 500.0)
        self.assertIsNone(res["alert"])

    # --------------------------------------------------------------------------
    # 2. Amazon SNS (SMS) & Amazon SES (Email) Tests
    # --------------------------------------------------------------------------
    def test_sns_out_for_delivery_notification(self):
        """Tests instant SMS dispatch when parcel is OUT_FOR_DELIVERY."""
        sample_order = {
            "orderId": "AD-8849-2041",
            "assignedDriverName": "Ramesh Kumar",
            "receiverPhone": "+919876543210",
        }
        res = notification_service.notify_out_for_delivery(sample_order)
        self.assertIn(res["status"], ["SENT", "SIMULATED"])

    def test_ses_delivery_receipt_email(self):
        """Tests delivery receipt generation with embedded proof-of-delivery photo."""
        sample_order = {
            "orderId": "AD-8849-2041",
            "destinationCity": "Noida",
            "deliveredAt": "2026-11-02T04:00:00Z",
        }
        res = notification_service.send_delivery_receipt_email(
            recipient_email="customer@example.com",
            order=sample_order,
            photo_url="https://s3.amazonaws.com/proofs/test.jpg",
        )
        self.assertIn(res["status"], ["SENT", "SIMULATED"])

    # --------------------------------------------------------------------------
    # 3. Amazon Rekognition Tests
    # --------------------------------------------------------------------------
    def test_rekognition_verification_package_photo(self):
        """Tests computer vision validation of package delivery photos."""
        # Minimum valid 1-pixel PNG buffer
        dummy_png = (
            b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01"
            b"\x08\x06\x00\x00\x00\x1f\x15c4\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05"
            b"\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82"
        )
        verdict = rekognition_service.verify_proof_of_delivery(dummy_png, order_id="AD-TEST-REK")
        self.assertTrue(verdict["verified"])
        self.assertGreater(verdict["confidence"], 0)

    def test_rekognition_empty_photo_rejected(self):
        """Tests that empty or truncated photo bytes are immediately rejected."""
        with self.assertRaises(ValueError):
            rekognition_service.verify_proof_of_delivery(b"")

    # --------------------------------------------------------------------------
    # 4. AWS Step Functions SLA Watchdog Tests
    # --------------------------------------------------------------------------
    def test_step_functions_sla_watchdog_lifecycle(self):
        """Tests starting and stopping the 15-minute SLA execution."""
        start_res = step_functions_service.start_sla_watchdog(order_id="AD-8849-2041", driver_id="DRV-001")
        self.assertEqual(start_res["status"], "RUNNING")
        self.assertEqual(start_res["slaMinutes"], 15)

        execution_arn = start_res["executionArn"]
        stop_res = step_functions_service.stop_sla_watchdog(execution_arn)
        self.assertEqual(stop_res["status"], "STOPPED")

    # --------------------------------------------------------------------------
    # 5. REST API Endpoints Tests
    # --------------------------------------------------------------------------
    def test_location_api_endpoints(self):
        """Tests GET /api/v1/location endpoints."""
        geo_resp = self.client.get("/api/v1/location/geocode", params={"address": "Gurugram"})
        self.assertEqual(geo_resp.status_code, 200)
        self.assertIn("lat", geo_resp.json()["data"])

        route_resp = self.client.get(
            "/api/v1/location/route",
            params={"origin_lat": 28.61, "origin_lng": 77.20, "dest_lat": 28.53, "dest_lng": 77.39},
        )
        self.assertEqual(route_resp.status_code, 200)
        self.assertIn("distanceKm", route_resp.json()["data"])

        geofence_resp = self.client.get(
            "/api/v1/location/geofence-check",
            params={"driver_lat": 28.536, "driver_lng": 77.391, "dest_lat": 28.5355, "dest_lng": 77.391},
        )
        self.assertEqual(geofence_resp.status_code, 200)
        self.assertTrue(geofence_resp.json()["data"]["insideGeofence"])


if __name__ == "__main__":
    unittest.main()

