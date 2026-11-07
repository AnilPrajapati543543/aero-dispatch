import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Known Hub Coordinates for Real-World Route Corridor Mapping (lat, lng)
const CITY_COORDINATES = {
  // Metros & Northern Belts
  "delhi": [28.6139, 77.2090],
  "new delhi": [28.6139, 77.2090],
  "noida": [28.5355, 77.3910],
  "gurgaon": [28.4595, 77.0266],
  "gurugram": [28.4595, 77.0266],
  "faridabad": [28.4089, 77.3178],
  "ghaziabad": [28.6692, 77.4538],
  "chandigarh": [30.7333, 76.7794],
  "jaipur": [26.9124, 75.7873],
  "lucknow": [26.8467, 80.9462],
  "kanpur": [26.4499, 80.3319],
  "agra": [27.1767, 78.0081],
  "varanasi": [25.3176, 82.9739],
  "amritsar": [31.6340, 74.8723],
  "ludhiana": [30.9010, 75.8573],
  "dehradun": [30.3165, 78.0322],

  // Western & Central Belts
  "mumbai": [19.0760, 72.8777],
  "navi mumbai": [19.0330, 73.0297],
  "thane": [19.2183, 72.9781],
  "pune": [18.5204, 73.8567],
  "ahmedabad": [23.0225, 72.5714],
  "surat": [21.1702, 72.8311],
  "vadodara": [22.3072, 73.1812],
  "rajkot": [22.3039, 70.8022],
  "indore": [22.7196, 75.8577],
  "bhopal": [23.2599, 77.4126],
  "nagpur": [21.1458, 79.0882],
  "nashik": [19.9975, 73.7898],

  // Southern Belts
  "bengaluru": [12.9716, 77.5946],
  "bangalore": [12.9716, 77.5946],
  "mysore": [12.2958, 76.6394],
  "hyderabad": [17.3850, 78.4867],
  "secunderabad": [17.4399, 78.4983],
  "chennai": [13.0827, 80.2707],
  "coimbatore": [11.0168, 76.9558],
  "kochi": [9.9312, 76.2673],
  "cochin": [9.9312, 76.2673],
  "thiruvananthapuram": [8.5241, 76.9366],
  "visakhapatnam": [17.6868, 83.2185],
  "vizag": [17.6868, 83.2185],
  "vijayawada": [16.5062, 80.6480],

  // Eastern & North-Eastern Belts
  "kolkata": [22.5726, 88.3639],
  "patna": [25.5941, 85.1376],
  "bhubaneswar": [20.2961, 85.8245],
  "ranchi": [23.3441, 85.3096],
  "guwahati": [26.1445, 91.7362]
};

function resolveCoords(cityStr, defaultCoords) {
  if (!cityStr || typeof cityStr !== "string") return defaultCoords;
  const key = cityStr.trim().toLowerCase();
  for (const [cityName, coords] of Object.entries(CITY_COORDINATES)) {
    if (key.includes(cityName) || cityName.includes(key)) {
      return coords;
    }
  }
  return defaultCoords;
}

export function MyMap({ center = [20.80, 77.40], zoom = 5, shipment = null }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const vectorGroupRef = useRef(null);
  const vehicleMarkerRef = useRef(null);
  const animFrameRef = useRef(null);
  const progressRef = useRef(0.38);

  const [progress, setProgress] = useState(0.38);
  const [isPlaying, setIsPlaying] = useState(true);
  const [realRoadPoints, setRealRoadPoints] = useState(null);
  const [roadMetrics, setRoadMetrics] = useState({ distanceKm: null, durationMins: null });
  const isPlayingRef = useRef(isPlaying);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  const isAir = shipment?.serviceTier?.toLowerCase().includes("air") ?? false;
  const progressPercent = Math.round(progress * 100);

  // Origin & Destination coordinates [latitude, longitude]
  const origin = useMemo(() => {
    return resolveCoords(shipment?.sender?.city, [28.6139, 77.2090]); // New Delhi default
  }, [shipment?.sender?.city]);

  const destination = useMemo(() => {
    return resolveCoords(shipment?.recipient?.city, [12.9716, 77.5946]); // Bengaluru default
  }, [shipment?.recipient?.city]);

  // Fetch real-world road-level routing from OpenStreetMap / OSRM API (100% Free, Zero API Keys)
  useEffect(() => {
    let isCancelled = false;
    const fetchRealRoadRoute = async () => {
      try {
        const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${origin[1]},${origin[0]};${destination[1]},${destination[0]}?overview=full&geometries=geojson`;
        const res = await fetch(osrmUrl, { signal: AbortSignal.timeout(3500) });
        if (!res.ok) throw new Error("OSRM routing offline");
        const data = await res.json();
        if (data.routes && data.routes.length > 0) {
          const route = data.routes[0];
          // OSRM returns [longitude, latitude], Leaflet needs [latitude, longitude]
          const coords = route.geometry.coordinates.map(pt => [pt[1], pt[0]]);
          if (!isCancelled && coords.length > 0) {
            setRealRoadPoints(coords);
            setRoadMetrics({
              distanceKm: Math.round(route.distance / 1000),
              durationMins: Math.round(route.duration / 60)
            });
            return;
          }
        }
      } catch (err) {
        // Graceful fallback to Great-Circle interpolated corridor
      }
      if (!isCancelled) {
        setRealRoadPoints(null);
        setRoadMetrics({ distanceKm: null, durationMins: null });
      }
    };

    fetchRealRoadRoute();
    return () => {
      isCancelled = true;
    };
  }, [origin, destination]);

  // Generate fallback curved transit corridor if OSRM is loading or unavailable
  const fallbackRoutePoints = useMemo(() => {
    const points = [];
    const steps = 60;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const lat = origin[0] + (destination[0] - origin[0]) * t;
      const lngCurve = Math.sin(t * Math.PI) * (isAir ? 2.5 : 1.2);
      const lng = origin[1] + (destination[1] - origin[1]) * t + lngCurve;
      points.push([lat, lng]);
    }
    return points;
  }, [origin, destination, isAir]);

  // Active polyline coordinates: Real OSRM road geometry if available, else smooth corridor
  const activeRoutePoints = realRoadPoints || fallbackRoutePoints;

  // Calculate position and bearing angle from progression t (0.0 to 1.0)
  const getPositionAndBearing = useCallback((t) => {
    if (!activeRoutePoints || activeRoutePoints.length === 0) {
      return { pos: origin, bearing: 0 };
    }
    const clampedT = Math.max(0, Math.min(1, t));
    const totalPoints = activeRoutePoints.length;
    const exactIndex = (totalPoints - 1) * clampedT;
    const lowerIndex = Math.floor(exactIndex);
    const upperIndex = Math.min(totalPoints - 1, Math.ceil(exactIndex));
    const factor = exactIndex - lowerIndex;

    const p1 = activeRoutePoints[lowerIndex];
    const p2 = activeRoutePoints[upperIndex];

    const lat = p1[0] + (p2[0] - p1[0]) * factor;
    const lng = p1[1] + (p2[1] - p1[1]) * factor;

    // Bearing toward next point
    const nextIdx = Math.min(totalPoints - 1, lowerIndex + 1);
    const nextPt = activeRoutePoints[nextIdx];
    const dLat = nextPt[0] - lat;
    const dLng = nextPt[1] - lng;
    const rad = Math.atan2(dLat, dLng);
    const deg = (rad * 180) / Math.PI;

    return { pos: [lat, lng], bearing: deg };
  }, [activeRoutePoints, origin]);

  // Initialize Leaflet Map Instance ONCE on mount using 100% Free OpenStreetMap
  useEffect(() => {
    if (!containerRef.current) return;

    // Clean up any stale map
    if (mapRef.current) {
      try {
        mapRef.current.remove();
      } catch (e) {
        console.warn("Cleanup warning:", e);
      }
      mapRef.current = null;
    }

    const map = L.map(containerRef.current, {
      center: center,
      zoom: zoom,
      zoomControl: false,
      attributionControl: false
    });
    mapRef.current = map;

    // Zoom control at bottom right
    L.control.zoom({ position: "bottomright" }).addTo(map);

    // OpenStreetMap Standard Tile Layer — 100% Free, Open, Zero API Keys, Deep Highway & Street Details
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      subdomains: ["a", "b", "c"],
      maxZoom: 19
    }).addTo(map);

    // Dedicated layer group for route lines and markers
    const vectorGroup = L.layerGroup().addTo(map);
    vectorGroupRef.current = vectorGroup;

    // Invalidate size after DOM mount
    setTimeout(() => {
      if (mapRef.current) {
        try {
          mapRef.current.invalidateSize();
        } catch {}
      }
    }, 150);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      vehicleMarkerRef.current = null;
      if (mapRef.current) {
        try {
          mapRef.current.remove();
        } catch {}
        mapRef.current = null;
      }
    };
  }, []);

  // Update Route Corridor, Pins, and Animated Vehicle Marker inside vectorGroup
  useEffect(() => {
    const map = mapRef.current;
    const vectorGroup = vectorGroupRef.current;
    if (!map || !vectorGroup) return;

    // Clear previous vector layers safely
    vectorGroup.clearLayers();
    vehicleMarkerRef.current = null;

    if (!shipment) return;

    // 1. Route Glow Line & Main Navigation Polyline
    const glowLine = L.polyline(activeRoutePoints, {
      color: "#00F0FF",
      weight: 8,
      opacity: 0.35,
      lineCap: "round",
      lineJoin: "round"
    });
    vectorGroup.addLayer(glowLine);

    const mainRouteLine = L.polyline(activeRoutePoints, {
      color: "#00F0FF",
      weight: 3.5,
      opacity: 0.95,
      dashArray: isAir ? "8, 8" : undefined,
      lineCap: "round",
      lineJoin: "round"
    });
    vectorGroup.addLayer(mainRouteLine);

    // Zoom and pan deeply to encompass the entire active route
    try {
      map.fitBounds(mainRouteLine.getBounds(), { padding: [45, 45], maxZoom: 14 });
    } catch {}

    // 2. Origin Hub Pin
    const originIcon = L.divIcon({
      className: "leaflet-origin-pin",
      html: `
        <div style="
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background: #10B981;
          border: 3px solid #FFFFFF;
          box-shadow: 0 0 15px rgba(16, 185, 129, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #FFFFFF;
          font-weight: 800;
          font-size: 11px;
        ">
          A
        </div>
      `,
      iconSize: [30, 30],
      iconAnchor: [15, 15]
    });

    const originMarker = L.marker(origin, { icon: originIcon });
    originMarker.bindPopup(`
      <div style="font-family: inherit; font-size: 12px; color: #0F172A;">
        <strong style="color: #10B981;">● Origin Station</strong><br/>
        <strong>${shipment.sender?.city || "Origin City"}</strong><br/>
        <span style="color: #64748B;">Shipper: ${shipment.sender?.name || "Sender"}</span>
      </div>
    `);
    vectorGroup.addLayer(originMarker);

    // 3. Destination Hub Pin
    const destIcon = L.divIcon({
      className: "leaflet-dest-pin",
      html: `
        <div style="
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background: #EF4444;
          border: 3px solid #FFFFFF;
          box-shadow: 0 0 15px rgba(239, 68, 68, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #FFFFFF;
          font-weight: 800;
          font-size: 11px;
        ">
          B
        </div>
      `,
      iconSize: [30, 30],
      iconAnchor: [15, 15]
    });

    const destMarker = L.marker(destination, { icon: destIcon });
    destMarker.bindPopup(`
      <div style="font-family: inherit; font-size: 12px; color: #0F172A;">
        <strong style="color: #EF4444;">● Final Destination</strong><br/>
        <strong>${shipment.recipient?.city || "Destination City"}</strong><br/>
        <span style="color: #64748B;">Recipient: ${shipment.recipient?.name || "Recipient"}</span>
      </div>
    `);
    vectorGroup.addLayer(destMarker);

    // 4. Moving Vehicle Marker (Air Freighter or Ground Cargo Truck)
    const initialPos = getPositionAndBearing(progressRef.current);
    const vehicleIcon = L.divIcon({
      className: "leaflet-vehicle-beacon",
      html: `
        <div id="live-vehicle-marker-el" style="
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: #0F172A;
          border: 2px solid #00F0FF;
          box-shadow: 0 0 20px rgba(0, 240, 255, 0.8), 0 0 40px rgba(0, 240, 255, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #00F0FF;
          transform: rotate(${initialPos.bearing}deg);
          transition: transform 0.1s linear;
        ">
          ${
            isAir
              ? `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/></svg>`
              : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18.5" r="2.5"/><circle cx="7" cy="18.5" r="2.5"/></svg>`
          }
        </div>
      `,
      iconSize: [38, 38],
      iconAnchor: [19, 19]
    });

    const vehicleMarker = L.marker(initialPos.pos, { icon: vehicleIcon });
    vehicleMarker.bindPopup(`
      <div style="font-family: inherit; font-size: 12px; color: #0F172A;">
        <strong style="color: #00F0FF;">Shipment Location</strong><br/>
        AWB: <strong>${shipment.awbNumber}</strong><br/>
        Service: ${shipment.serviceTier}<br/>
        Status: <span style="font-weight: 700; color: #10B981;">${shipment.currentStatus}</span>
      </div>
    `);
    vectorGroup.addLayer(vehicleMarker);
    vehicleMarkerRef.current = vehicleMarker;

  }, [shipment, activeRoutePoints, origin, destination, isAir, getPositionAndBearing]);

  // Smooth Telemetry Animation Loop
  useEffect(() => {
    let lastTimestamp = performance.now();

    const animateVehicle = (timestamp) => {
      const delta = (timestamp - lastTimestamp) / 1000;
      lastTimestamp = timestamp;

      if (isPlayingRef.current) {
        // Increment progress (complete circuit in 25 seconds)
        progressRef.current = (progressRef.current + delta * 0.04) % 1.0;
        setProgress(progressRef.current);

        const { pos, bearing } = getPositionAndBearing(progressRef.current);

        if (
          vehicleMarkerRef.current &&
          mapRef.current &&
          mapRef.current.getPane("mapPane") &&
          mapRef.current._leaflet_id
        ) {
          try {
            vehicleMarkerRef.current.setLatLng(pos);
            const markerEl = document.getElementById("live-vehicle-marker-el");
            if (markerEl) {
              markerEl.style.transform = `rotate(${bearing}deg)`;
            }
          } catch {}
        }
      }

      animFrameRef.current = requestAnimationFrame(animateVehicle);
    };

    animFrameRef.current = requestAnimationFrame(animateVehicle);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
    };
  }, [getPositionAndBearing]);

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "440px",
        borderRadius: "16px",
        overflow: "hidden",
        border: "1px solid var(--border-medium, rgba(255, 255, 255, 0.1))",
        boxShadow: "0 20px 40px -10px rgba(0, 0, 0, 0.45)"
      }}
    >
      {/* Leaflet Map DOM Container (With Dark Theme CSS filter on tiles) */}
      <div 
        ref={containerRef} 
        className="osm-deep-map-container"
        style={{ width: "100%", height: "100%" }} 
      />

      {/* Global OpenStreetMap Custom Styling Overrides */}
      <style>{`
        .osm-deep-map-container .leaflet-tile-pane {
          filter: brightness(0.72) invert(1) contrast(1.4) hue-rotate(200deg) saturate(0.35);
        }
        .theme-light .osm-deep-map-container .leaflet-tile-pane {
          filter: none;
        }
        .leaflet-container {
          background: #070B14 !important;
          font-family: inherit;
        }
        .theme-light .leaflet-container {
          background: #F8FAFC !important;
        }
        .leaflet-popup-content-wrapper {
          background: rgba(15, 23, 42, 0.95);
          color: #FFFFFF;
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 8px;
        }
        .leaflet-popup-tip {
          background: rgba(15, 23, 42, 0.95);
        }
        .leaflet-bar {
          background: rgba(15, 23, 42, 0.9) !important;
          border: 1px solid rgba(255, 255, 255, 0.2) !important;
          border-radius: 8px !important;
          overflow: hidden;
        }
        .leaflet-bar a {
          background: transparent !important;
          color: #FFFFFF !important;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
        }
        .leaflet-bar a:hover {
          background: rgba(255, 255, 255, 0.1) !important;
        }
        .leaflet-control-attribution {
          display: none !important;
        }
      `}</style>
    </div>
  );
}

export default MyMap;
