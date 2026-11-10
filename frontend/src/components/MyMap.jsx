import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Known Hub Coordinates for Real-World Route Corridor Mapping (lat, lng)
const CITY_COORDINATES = {
  // Mumbai Metropolitan Region & Satellite Cities (Including Diva Junction)
  "diva": [19.1892, 73.0427],
  "thane": [19.2183, 72.9781],
  "kalyan": [19.2437, 73.1355],
  "dombivli": [19.2184, 73.0867],
  "mumbai": [19.0760, 72.8777],
  "navi mumbai": [19.0330, 73.0297],
  "panvel": [18.9894, 73.1175],
  "vasai": [19.3919, 72.8397],
  "virar": [19.4700, 72.8000],
  "bhiwandi": [19.2813, 73.0483],

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

// Great-Circle Navigation Forward Bearing (0° to 360°)
function calculateBearing(p1, p2) {
  const lat1 = (p1[0] * Math.PI) / 180;
  const lon1 = (p1[1] * Math.PI) / 180;
  const lat2 = (p2[0] * Math.PI) / 180;
  const lon2 = (p2[1] * Math.PI) / 180;

  const dLon = lon2 - lon1;
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  const brng = (Math.atan2(y, x) * 180) / Math.PI;
  return (brng + 360) % 360;
}

// Calculate realistic route progress based on delivery estimated time SLA
export function calculateETABasedProgress(shipment) {
  if (!shipment) return 0.50;
  if (shipment.currentStatus === 'DELIVERED') return 1.0;
  if (shipment.currentStatus === 'BOOKED') return 0.05;

  const nowMs = Date.now();
  const createdMs = new Date(shipment.createdAt || (nowMs - 3600000 * 18)).getTime();
  const estMs = new Date(shipment.estimatedDelivery || (nowMs + 3600000 * 24)).getTime();

  let ratio = 0.5;
  if (estMs > createdMs) {
    ratio = (nowMs - createdMs) / (estMs - createdMs);
  }

  // Milestone bounding ensuring realistic visual position
  if (shipment.currentStatus === 'OUT_FOR_DELIVERY') {
    return Math.max(0.78, Math.min(0.95, ratio));
  }
  if (shipment.currentStatus === 'IN_TRANSIT') {
    return Math.max(0.20, Math.min(0.74, ratio));
  }
  if (shipment.currentStatus === 'PICKED_UP' || shipment.currentStatus === 'HUB_INBOUND') {
    return Math.max(0.08, Math.min(0.22, ratio));
  }
  return Math.max(0.05, Math.min(0.96, ratio));
}

export function MyMap({ center = [20.80, 77.40], zoom = 5, shipment = null }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const vectorGroupRef = useRef(null);
  const vehicleMarkerRef = useRef(null);
  const animFrameRef = useRef(null);

  // Time & ETA Progress States
  const etaBaseProgress = useMemo(() => calculateETABasedProgress(shipment), [shipment]);
  const [progress, setProgress] = useState(etaBaseProgress);
  const progressRef = useRef(progress);

  // Road geometry coordinates
  const [realRoadPoints, setRealRoadPoints] = useState(null);

  // Sync state whenever shipment changes
  useEffect(() => {
    const p = calculateETABasedProgress(shipment);
    setProgress(p);
    progressRef.current = p;
  }, [shipment]);

  // Origin & Destination coordinates [latitude, longitude]
  const origin = useMemo(() => {
    return resolveCoords(shipment?.sender?.city, [19.1892, 73.0427]); // Diva/Mumbai default
  }, [shipment?.sender?.city]);

  const destination = useMemo(() => {
    return resolveCoords(shipment?.recipient?.city, [12.9716, 77.5946]); // Bengaluru default
  }, [shipment?.recipient?.city]);

  const isAirTier = shipment?.serviceTier?.toLowerCase().includes("air") ?? false;

  // Decide effective vehicle based on lifecycle and delivery progress
  const effectiveVehicle = useMemo(() => {
    // If progress is >= 75% or status is OUT_FOR_DELIVERY, switch to last-mile Delivery Truck
    if (progress >= 0.75 || shipment?.currentStatus === 'OUT_FOR_DELIVERY') {
      return 'truck';
    }
    // High-altitude interstate linehaul: Aeroplane
    if (isAirTier || shipment?.currentStatus === 'IN_TRANSIT') {
      return 'plane';
    }
    return 'truck';
  }, [progress, isAirTier, shipment?.currentStatus]);

  // Fetch real-world road-level routing from OpenStreetMap / OSRM API
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
          const coords = route.geometry.coordinates.map(pt => [pt[1], pt[0]]);
          if (!isCancelled && coords.length > 0) {
            setRealRoadPoints(coords);
            return;
          }
        }
      } catch (err) {}
      if (!isCancelled) {
        setRealRoadPoints(null);
      }
    };

    fetchRealRoadRoute();
    return () => { isCancelled = true; };
  }, [origin, destination]);

  // Fallback curved flight corridor
  const fallbackRoutePoints = useMemo(() => {
    const points = [];
    const steps = 60;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const lat = origin[0] + (destination[0] - origin[0]) * t;
      const lngCurve = Math.sin(t * Math.PI) * (isAirTier ? 2.5 : 1.2);
      const lng = origin[1] + (destination[1] - origin[1]) * t + lngCurve;
      points.push([lat, lng]);
    }
    return points;
  }, [origin, destination, isAirTier]);

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

    const nextIdx = Math.min(totalPoints - 1, lowerIndex + 1);
    const nextPt = activeRoutePoints[nextIdx];
    const bearing = calculateBearing([lat, lng], nextPt);

    return { pos: [lat, lng], bearing };
  }, [activeRoutePoints, origin]);

  // Initialize Leaflet Map Instance ONCE
  useEffect(() => {
    if (!containerRef.current) return;

    if (mapRef.current) {
      try {
        mapRef.current.remove();
      } catch (e) {}
      mapRef.current = null;
    }

    const map = L.map(containerRef.current, {
      center: center,
      zoom: zoom,
      zoomControl: false,
      attributionControl: false
    });
    mapRef.current = map;

    L.control.zoom({ position: "topright" }).addTo(map);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      subdomains: ["a", "b", "c"],
      maxZoom: 19
    }).addTo(map);

    const vectorGroup = L.layerGroup().addTo(map);
    vectorGroupRef.current = vectorGroup;

    setTimeout(() => {
      if (mapRef.current) {
        try { mapRef.current.invalidateSize(); } catch {}
      }
    }, 150);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      vehicleMarkerRef.current = null;
      if (mapRef.current) {
        try { mapRef.current.remove(); } catch {}
        mapRef.current = null;
      }
    };
  }, []);

  // Update Route Corridor, Pins, and Animated Vehicle Marker inside vectorGroup
  useEffect(() => {
    const map = mapRef.current;
    const vectorGroup = vectorGroupRef.current;
    if (!map || !vectorGroup) return;

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
      color: effectiveVehicle === 'plane' ? "#00F0FF" : "#10B981",
      weight: 3.5,
      opacity: 0.95,
      dashArray: effectiveVehicle === 'plane' ? "8, 8" : undefined,
      lineCap: "round",
      lineJoin: "round"
    });
    vectorGroup.addLayer(mainRouteLine);

    try {
      map.fitBounds(mainRouteLine.getBounds(), { padding: [45, 45], maxZoom: 14 });
    } catch {}

    // 2. Origin Hub Pin
    const originIcon = L.divIcon({
      className: "leaflet-origin-pin",
      html: `
        <div style="
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #10B981;
          border: 3px solid #FFFFFF;
          box-shadow: 0 0 16px rgba(16, 185, 129, 0.8);
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
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });

    const originMarker = L.marker(origin, { icon: originIcon });
    originMarker.bindPopup(`
      <div style="font-family: inherit; font-size: 12px; color: #0F172A;">
        <strong style="color: #10B981;">● Origin Station</strong><br/>
        <strong>${shipment.sender?.city || "Origin"}</strong><br/>
        <span style="color: #64748B;">Shipper: ${shipment.sender?.name || "Sender"}</span>
      </div>
    `);
    vectorGroup.addLayer(originMarker);

    // 3. Destination Hub Pin
    const destIcon = L.divIcon({
      className: "leaflet-dest-pin",
      html: `
        <div style="
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #EF4444;
          border: 3px solid #FFFFFF;
          box-shadow: 0 0 16px rgba(239, 68, 68, 0.8);
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
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });

    const destMarker = L.marker(destination, { icon: destIcon });
    destMarker.bindPopup(`
      <div style="font-family: inherit; font-size: 12px; color: #0F172A;">
        <strong style="color: #EF4444;">● Final Destination</strong><br/>
        <strong>${shipment.recipient?.city || "Destination"}</strong><br/>
        <span style="color: #64748B;">Recipient: ${shipment.recipient?.name || "Recipient"}</span>
      </div>
    `);
    vectorGroup.addLayer(destMarker);

    // 4. Moving Vehicle Marker (Aeroplane or Ground Delivery Van)
    const initialPos = getPositionAndBearing(progressRef.current);
    
    // SVG plane points North (0 deg), SVG truck points East (90 deg)
    const rotationDeg = effectiveVehicle === 'plane' 
      ? initialPos.bearing 
      : (initialPos.bearing - 90);

    const vehicleIcon = L.divIcon({
      className: "leaflet-vehicle-beacon",
      html: `
        <div id="live-vehicle-marker-el" style="
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: #0F172A;
          border: 2.5px solid ${effectiveVehicle === 'plane' ? '#00F0FF' : '#10B981'};
          box-shadow: 0 0 20px ${effectiveVehicle === 'plane' ? 'rgba(0, 240, 255, 0.9)' : 'rgba(16, 185, 129, 0.9)'};
          display: flex;
          align-items: center;
          justify-content: center;
          color: ${effectiveVehicle === 'plane' ? '#00F0FF' : '#10B981'};
          transform: rotate(${rotationDeg}deg);
          transition: transform 0.1s linear;
        ">
          ${
            effectiveVehicle === 'plane'
              ? `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/></svg>`
              : `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18.5" r="2.5"/><circle cx="7" cy="18.5" r="2.5"/></svg>`
          }
        </div>
      `,
      iconSize: [44, 44],
      iconAnchor: [22, 22]
    });

    const vehicleMarker = L.marker(initialPos.pos, { icon: vehicleIcon });
    vehicleMarker.bindPopup(`
      <div style="font-family: inherit; font-size: 12px; color: #0F172A;">
        <strong style="color: ${effectiveVehicle === 'plane' ? '#00F0FF' : '#10B981'};">
          ${effectiveVehicle === 'plane' ? '✈️ Express Air Flight' : '🚚 Ground Delivery Van'}
        </strong><br/>
        AWB: <strong>${shipment.awbNumber || shipment.id}</strong><br/>
        Status: <span style="font-weight: 700; color: #10B981;">${shipment.currentStatus}</span>
      </div>
    `);
    vectorGroup.addLayer(vehicleMarker);
    vehicleMarkerRef.current = vehicleMarker;

  }, [shipment, activeRoutePoints, origin, destination, effectiveVehicle, getPositionAndBearing]);

  // Smooth Telemetry Animation Loop based on estimated delivery progress
  useEffect(() => {
    let lastTimestamp = performance.now();

    const animateVehicle = (timestamp) => {
      const delta = (timestamp - lastTimestamp) / 1000;
      lastTimestamp = timestamp;

      // Only animate if in transit or out for delivery; delivered stays at 100%
      if (shipment && shipment.currentStatus !== 'DELIVERED') {
        // Continuous smooth cruise around the estimated delivery progress
        progressRef.current = (progressRef.current + delta * 0.03) % 1.0;
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
              const rotationDeg = effectiveVehicle === 'plane' ? bearing : (bearing - 90);
              markerEl.style.transform = `rotate(${rotationDeg}deg)`;
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
  }, [getPositionAndBearing, effectiveVehicle, shipment]);

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "460px",
        borderRadius: "20px",
        overflow: "hidden",
        border: "1px solid var(--border-medium, rgba(255, 255, 255, 0.1))",
        boxShadow: "0 20px 40px -10px rgba(0, 0, 0, 0.45)"
      }}
    >
      {/* Leaflet Map DOM Container (Clean, Spacious View) */}
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
          border-radius: 12px;
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.4);
        }
        .theme-light .leaflet-popup-content-wrapper {
          background: rgba(255, 255, 255, 0.96);
          color: #0F172A;
          border: 1px solid rgba(0, 0, 0, 0.1);
        }
        .leaflet-popup-tip {
          background: rgba(15, 23, 42, 0.95);
        }
        .theme-light .leaflet-popup-tip {
          background: rgba(255, 255, 255, 0.96);
        }
        .leaflet-bar {
          background: rgba(15, 23, 42, 0.9) !important;
          border: 1px solid rgba(255, 255, 255, 0.2) !important;
          border-radius: 10px !important;
          overflow: hidden;
        }
        .theme-light .leaflet-bar {
          background: rgba(255, 255, 255, 0.95) !important;
          border: 1px solid rgba(0, 0, 0, 0.12) !important;
        }
        .leaflet-bar a {
          background: transparent !important;
          color: #FFFFFF !important;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
        }
        .theme-light .leaflet-bar a {
          color: #0F172A !important;
          border-bottom: 1px solid rgba(0, 0, 0, 0.08) !important;
        }
        .leaflet-bar a:hover {
          background: rgba(255, 255, 255, 0.1) !important;
        }
        .theme-light .leaflet-bar a:hover {
          background: rgba(0, 0, 0, 0.05) !important;
        }
        .leaflet-control-attribution {
          display: none !important;
        }
      `}</style>
    </div>
  );
}

export default MyMap;
