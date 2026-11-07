"""
Amazon Location Service Integration for AeroDispatch.

Provides:
1. Address Geocoding (Text to Lat/Lng via AWS Location Place Index)
2. Route & ETA Calculation (Driving distance & minutes via AWS Route Calculator)
3. 500-Meter Geofencing Proximity Detection ("Driver is arriving at your door!")
"""
import os
import math
from typing import Dict, Any, Optional, Tuple
from ..utils.logger import get_logger

logger = get_logger("service.location")


class LocationService:
    def __init__(
        self,
        place_index_name: Optional[str] = None,
        calculator_name: Optional[str] = None,
        region: Optional[str] = None,
    ):
        self.place_index = place_index_name or os.getenv("LOCATION_PLACE_INDEX", "aerodispatch-place-index")
        self.calculator_name = calculator_name or os.getenv("LOCATION_ROUTE_CALCULATOR", "aerodispatch-route-calculator")
        self.region = region or os.getenv("LOCATION_AWS_REGION", "ap-northeast-1")
        self.client = None

        if os.getenv("MOCK_AWS") == "true" or os.getenv("AWS_EC2_METADATA_DISABLED") == "true":
            return

        try:
            import boto3
            from botocore.config import Config
            self.client = boto3.client("location", region_name=self.region, config=Config(connect_timeout=2, read_timeout=2))
            logger.info(f"Initialized Amazon Location Service client in {self.region}")
        except Exception as e:
            logger.warning(f"Could not initialize Amazon Location Service: {e}. Using intelligent fallback.")

    def geocode_address(self, address_text: str) -> Dict[str, Any]:
        """
        Geocodes a street address or city to [longitude, latitude] coordinates.
        Uses AWS Location Service Place Index with graceful fallback.
        """
        if not address_text or not address_text.strip():
            return {"lat": 28.6139, "lng": 77.2090, "label": "Default Center (New Delhi)", "confidence": "fallback"}

        if self.client:
            try:
                res = self.client.search_place_index_for_text(
                    IndexName=self.place_index,
                    Text=address_text.strip(),
                    MaxResults=1,
                )
                results = res.get("Results", [])
                if results:
                    place = results[0].get("Place", {})
                    point = place.get("Geometry", {}).get("Point", [])
                    if len(point) >= 2:
                        lng, lat = point[0], point[1]
                        label = place.get("Label", address_text)
                        logger.info(f"Geocoded '{address_text}' via AWS Location: [{lat}, {lng}]")
                        return {"lat": float(lat), "lng": float(lng), "label": label, "source": "aws_location"}
            except Exception as e:
                logger.warning(f"AWS Location search error for '{address_text}': {e}. Using heuristic fallback.")

        # Heuristic coordinate mapping for common hub cities if offline
        lower = address_text.lower()
        coords = {
            "seoul": (37.5665, 126.9780),
            "gangnam": (37.4951, 127.0628),
            "delhi": (28.6139, 77.2090),
            "noida": (28.5355, 77.3910),
            "mumbai": (19.0760, 72.8777),
            "bengaluru": (12.9716, 77.5946),
            "bangalore": (12.9716, 77.5946),
            "gurugram": (28.4595, 77.0266),
            "hyderabad": (17.3850, 78.4867),
            "chennai": (13.0827, 80.2707),
        }
        for city, pt in coords.items():
            if city in lower:
                return {"lat": pt[0], "lng": pt[1], "label": address_text, "source": "city_fallback"}

        # Deterministic hash fallback for unknown local addresses
        seed = sum(ord(c) for c in address_text) % 100
        return {
            "lat": 28.5355 + (seed * 0.001),
            "lng": 77.3910 + (seed * 0.001),
            "label": address_text,
            "source": "heuristic_fallback",
        }

    def calculate_route(
        self,
        origin: Tuple[float, float],
        destination: Tuple[float, float],
    ) -> Dict[str, Any]:
        """
        Calculates turn-by-turn road route distance (km) and estimated travel duration (minutes).
        `origin` and `destination` are passed as (lat, lng).
        AWS Location requires [lng, lat].
        """
        src_lat, src_lng = origin
        dest_lat, dest_lng = destination

        if self.client:
            try:
                res = self.client.calculate_route(
                    CalculatorName=self.calculator_name,
                    DeparturePosition=[float(src_lng), float(src_lat)],
                    DestinationPosition=[float(dest_lng), float(dest_lat)],
                    TravelMode="Car",
                )
                summary = res.get("Summary", {})
                distance_km = round(summary.get("Distance", 0.0), 2)
                duration_secs = summary.get("DurationSeconds", 0.0)
                duration_mins = round(duration_secs / 60.0, 1)

                logger.info(f"Calculated route via AWS Location: {distance_km} km in {duration_mins} mins")
                return {
                    "distanceKm": distance_km,
                    "durationMinutes": duration_mins,
                    "etaSeconds": int(duration_secs),
                    "source": "aws_location",
                }
            except Exception as e:
                logger.warning(f"AWS Route calculation error: {e}. Calculating haversine estimate.")

        # Haversine distance fallback
        dist_km = self.haversine_distance(src_lat, src_lng, dest_lat, dest_lng)
        # Average urban speed 30 km/h
        duration_mins = round((dist_km / 30.0) * 60.0, 1)
        return {
            "distanceKm": round(dist_km, 2),
            "durationMinutes": duration_mins,
            "etaSeconds": int(duration_mins * 60),
            "source": "haversine_fallback",
        }

    @staticmethod
    def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Returns great-circle distance in kilometers."""
        r = 6371.0  # Earth's radius in km
        dlat = math.radians(lat2 - lat1)
        dlon = math.radians(lon2 - lon1)
        a = (
            math.sin(dlat / 2.0) ** 2
            + math.cos(math.radians(lat1))
            * math.cos(math.radians(lat2))
            * math.sin(dlon / 2.0) ** 2
        )
        c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
        return r * c

    def check_geofence_proximity(
        self,
        driver_lat: float,
        driver_lng: float,
        dest_lat: float,
        dest_lng: float,
        radius_meters: float = 500.0,
    ) -> Dict[str, Any]:
        """
        500-Meter Geofencing: checks whether courier GPS is within the destination fence.
        Triggers instant arrival alert when threshold is crossed.
        """
        dist_km = self.haversine_distance(driver_lat, driver_lng, dest_lat, dest_lng)
        dist_meters = dist_km * 1000.0

        is_inside = dist_meters <= radius_meters
        return {
            "insideGeofence": is_inside,
            "distanceMeters": round(dist_meters, 1),
            "radiusMeters": radius_meters,
            "alert": "Driver is arriving at your door!" if is_inside else None,
        }

