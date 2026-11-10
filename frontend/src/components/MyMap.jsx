import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Truck, 
  Plane, 
  Gauge, 
  Clock, 
  MapPin, 
  CheckCircle2, 
  Zap,
  Radio,
  SlidersHorizontal
} from "lucide-react";

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

// Calculate realistic route progress based on booking time vs estimated delivery SLA
export function calculateETABasedProgress(shipment) {
  if (!shipment) return 0.45;
  if (shipment.currentStatus === 'DELIVERED') return 1.0;
  if (shipment.currentStatus === 'BOOKED') return 0.08;

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
    return Math.max(0.10, Math.min(0.22, ratio));
  }
  return Math.max(0.06, Math.min(0.96, ratio));
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
  progressRef.current = progress;

  const [isPlaying, setIsPlaying] = useState(false); // Default to ETA sync, toggle play for simulation
  const isPlayingRef = useRef(isPlaying);
  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);

  const [playbackSpeed, setPlaybackSpeed] = useState(1); // 1x | 2x | 4x
  const speedRef = useRef(playbackSpeed);
  useEffect(() => { speedRef.current = playbackSpeed; }, [playbackSpeed]);

  const [vehicleMode, setVehicleMode] = useState('auto'); // 'auto' | 'plane' | 'truck'
  const [isLiveSynced, setIsLiveSynced] = useState(true);

  // Sync state whenever shipment changes
  useEffect(() => {
    const p = calculateETABasedProgress(shipment);
    setProgress(p);
    progressRef.current = p;
    setIsLiveSynced(true);
    setIsPlaying(false);
  }, [shipment]);

  // Road geometry coordinates
  const [realRoadPoints, setRealRoadPoints] = useState(null);
  const [roadMetrics, setRoadMetrics] = useState({ distanceKm: null, durationMins: null });

  // Origin & Destination coordinates [latitude, longitude]
  const origin = useMemo(() => {
    return resolveCoords(shipment?.sender?.city, [28.6139, 77.2090]); // New Delhi default
  }, [shipment?.sender?.city]);

  const destination = useMemo(() => {
    return resolveCoords(shipment?.recipient?.city, [12.9716, 77.5946]); // Bengaluru default
  }, [shipment?.recipient?.city]);

  const isAirTier = shipment?.serviceTier?.toLowerCase().includes("air") ?? false;

  // Decide effective vehicle based on mode or progress
  const effectiveVehicle = useMemo(() => {
    if (vehicleMode === 'plane') return 'plane';
    if (vehicleMode === 'truck') return 'truck';
    // 'auto' mode:
    // If progress is >= 75% or status is OUT_FOR_DELIVERY, switch to last-mile Delivery Truck
    if (progress >= 0.75 || shipment?.currentStatus === 'OUT_FOR_DELIVERY') {
      return 'truck';
    }
    // High-altitude interstate linehaul: Aeroplane
    if (isAirTier || shipment?.currentStatus === 'IN_TRANSIT') {
      return 'plane';
    }
    return 'truck';
  }, [vehicleMode, progress, isAirTier, shipment?.currentStatus]);

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
            setRoadMetrics({
              distanceKm: Math.round(route.distance / 1000),
              durationMins: Math.round(route.duration / 60)
            });
            return;
          }
        }
      } catch (err) {}
      if (!isCancelled) {
        setRealRoadPoints(null);
        setRoadMetrics({ distanceKm: null, durationMins: null });
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
      map.fitBounds(mainRouteLine.getBounds(), { padding: [55, 55], maxZoom: 14 });
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
        <strong>${shipment.recipient?.city || "Destination City"}</strong><br/>
        <span style="color: #64748B;">Recipient: ${shipment.recipient?.name || "Recipient"}</span>
      </div>
    `);
    vectorGroup.addLayer(destMarker);

    // 4. Moving Vehicle Marker (Aeroplane or Ground Delivery Truck)
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
          ${effectiveVehicle === 'plane' ? '✈️ Air Linehaul Flight' : '🚚 Last-Mile Delivery Truck'}
        </strong><br/>
        AWB: <strong>${shipment.awbNumber}</strong><br/>
        Progress: <strong>${Math.round(progressRef.current * 100)}% of route</strong><br/>
        Status: <span style="font-weight: 700; color: #10B981;">${shipment.currentStatus}</span>
      </div>
    `);
    vectorGroup.addLayer(vehicleMarker);
    vehicleMarkerRef.current = vehicleMarker;

  }, [shipment, activeRoutePoints, origin, destination, effectiveVehicle, getPositionAndBearing]);

  // Smooth Telemetry Animation Loop
  useEffect(() => {
    let lastTimestamp = performance.now();

    const animateVehicle = (timestamp) => {
      const delta = (timestamp - lastTimestamp) / 1000;
      lastTimestamp = timestamp;

      if (isPlayingRef.current) {
        // Complete route simulation in ~24s at 1x speed
        const speedMultiplier = speedRef.current;
        let nextP = progressRef.current + delta * 0.04 * speedMultiplier;
        if (nextP >= 1.0) {
          nextP = 1.0;
          setIsPlaying(false);
        }

        progressRef.current = nextP;
        setProgress(nextP);
        setIsLiveSynced(false);

        const { pos, bearing } = getPositionAndBearing(nextP);

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
  }, [getPositionAndBearing, effectiveVehicle]);

  // Handle manual scrub from progress slider
  const handleSliderChange = (e) => {
    const newProgress = Number(e.target.value) / 100;
    setProgress(newProgress);
    progressRef.current = newProgress;
    setIsLiveSynced(false);

    const { pos, bearing } = getPositionAndBearing(newProgress);
    if (vehicleMarkerRef.current) {
      try {
        vehicleMarkerRef.current.setLatLng(pos);
        const markerEl = document.getElementById("live-vehicle-marker-el");
        if (markerEl) {
          const rotationDeg = effectiveVehicle === 'plane' ? bearing : (bearing - 90);
          markerEl.style.transform = `rotate(${rotationDeg}deg)`;
        }
      } catch {}
    }
  };

  // Quick milestone snaps
  const jumpToMilestone = (milestoneProgress) => {
    setProgress(milestoneProgress);
    progressRef.current = milestoneProgress;
    setIsLiveSynced(false);

    const { pos, bearing } = getPositionAndBearing(milestoneProgress);
    if (vehicleMarkerRef.current) {
      try {
        vehicleMarkerRef.current.setLatLng(pos);
        const markerEl = document.getElementById("live-vehicle-marker-el");
        if (markerEl) {
          const rotationDeg = effectiveVehicle === 'plane' ? bearing : (bearing - 90);
          markerEl.style.transform = `rotate(${rotationDeg}deg)`;
        }
      } catch {}
    }
  };

  // Sync to real-time calculated ETA progress
  const handleSyncToLiveETA = () => {
    const liveP = calculateETABasedProgress(shipment);
    setProgress(liveP);
    progressRef.current = liveP;
    setIsLiveSynced(true);
    setIsPlaying(false);

    const { pos, bearing } = getPositionAndBearing(liveP);
    if (vehicleMarkerRef.current) {
      try {
        vehicleMarkerRef.current.setLatLng(pos);
        const markerEl = document.getElementById("live-vehicle-marker-el");
        if (markerEl) {
          const rotationDeg = effectiveVehicle === 'plane' ? bearing : (bearing - 90);
          markerEl.style.transform = `rotate(${rotationDeg}deg)`;
        }
      } catch {}
    }
  };

  // Format ETA time text
  const etaText = useMemo(() => {
    if (!shipment) return "On Schedule";
    if (shipment.currentStatus === 'DELIVERED') return "Delivered Safely";
    if (!shipment.estimatedDelivery) return "In Transit • On Schedule";
    const d = new Date(shipment.estimatedDelivery);
    const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateStr = d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    return `ETA: ${dateStr} at ${timeStr}`;
  }, [shipment]);

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "520px",
        borderRadius: "24px",
        overflow: "hidden",
        border: "1px solid var(--border-medium, rgba(255, 255, 255, 0.1))",
        boxShadow: "0 24px 50px -10px rgba(0, 0, 0, 0.45)",
        display: "flex",
        flexDirection: "column"
      }}
    >
      {/* 1. Top HUD Telemetry Banner */}
      <div 
        style={{
          position: "absolute",
          top: "14px",
          left: "14px",
          right: "14px",
          zIndex: 1000,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "8px",
          pointerEvents: "none"
        }}
      >
        {/* Left Telemetry Pill */}
        <div 
          style={{
            background: "rgba(15, 23, 42, 0.88)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            border: "1px solid rgba(255, 255, 255, 0.15)",
            padding: "6px 14px",
            borderRadius: "9999px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            color: "#FFFFFF",
            fontSize: "0.82rem",
            fontWeight: 700,
            pointerEvents: "auto",
            boxShadow: "0 8px 24px rgba(0, 0, 0, 0.3)"
          }}
        >
          {effectiveVehicle === 'plane' ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#00F0FF' }}>
              <Plane size={15} />
              <span>Express Air Linehaul • ~780 km/h</span>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#10B981' }}>
              <Truck size={15} />
              <span>Ground Delivery Van • ~52 km/h</span>
            </div>
          )}

          <span style={{ color: "rgba(255, 255, 255, 0.3)" }}>|</span>

          <span style={{ color: "#E2E8F0" }}>
            {shipment?.sender?.city || "Origin"} ➔ {shipment?.recipient?.city || "Destination"}
          </span>
        </div>

        {/* Right ETA Countdown & Progress Badge */}
        <div 
          style={{
            background: "rgba(15, 23, 42, 0.88)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            border: isLiveSynced ? "1px solid rgba(16, 185, 129, 0.4)" : "1px solid rgba(255, 255, 255, 0.15)",
            padding: "6px 14px",
            borderRadius: "9999px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            color: "#FFFFFF",
            fontSize: "0.82rem",
            fontWeight: 700,
            pointerEvents: "auto",
            boxShadow: "0 8px 24px rgba(0, 0, 0, 0.3)"
          }}
        >
          <Clock size={14} color={isLiveSynced ? "#10B981" : "#FBBF24"} />
          <span>{etaText}</span>
          <span style={{
            background: isLiveSynced ? "rgba(16, 185, 129, 0.2)" : "rgba(0, 240, 255, 0.2)",
            color: isLiveSynced ? "#10B981" : "#00F0FF",
            padding: "2px 8px",
            borderRadius: "9999px",
            fontSize: "0.74rem",
            fontWeight: 800
          }}>
            {Math.round(progress * 100)}%
          </span>
        </div>
      </div>

      {/* Leaflet Map DOM Container */}
      <div 
        ref={containerRef} 
        className="osm-deep-map-container"
        style={{ width: "100%", height: "100%", flex: 1 }} 
      />

      {/* 2. Bottom Interactive Control Panel Overlay */}
      <div
        className="map-control-panel-container"
        style={{
          position: "absolute",
          bottom: "12px",
          left: "14px",
          right: "14px",
          zIndex: 1000,
          background: "rgba(15, 23, 42, 0.92)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          border: "1px solid rgba(255, 255, 255, 0.18)",
          borderRadius: "20px",
          padding: "12px 18px",
          boxShadow: "0 16px 40px rgba(0, 0, 0, 0.45)",
          display: "flex",
          flexDirection: "column",
          gap: "10px"
        }}
      >
        {/* Row 1: Scrubbable Timeline Slider */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#10B981", display: "flex", alignItems: "center", gap: "4px", minWidth: "90px" }}>
            <MapPin size={13} />
            <span>{shipment?.sender?.city || "Origin"}</span>
          </div>

          <div style={{ flex: 1, position: "relative", display: "flex", alignItems: "center" }}>
            <input
              type="range"
              min="0"
              max="100"
              value={Math.round(progress * 100)}
              onChange={handleSliderChange}
              style={{
                width: "100%",
                height: "6px",
                borderRadius: "9999px",
                outline: "none",
                cursor: "pointer",
                accentColor: effectiveVehicle === 'plane' ? "#00F0FF" : "#10B981"
              }}
              title="Scrub vehicle position along estimated delivery schedule"
            />
          </div>

          <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#EF4444", display: "flex", alignItems: "center", gap: "4px", minWidth: "90px", justifyContent: "flex-end" }}>
            <MapPin size={13} />
            <span>{shipment?.recipient?.city || "Destination"}</span>
          </div>
        </div>

        {/* Row 2: Control Action Buttons */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
          
          {/* Left Actions: Play/Pause, Live Sync, Speed */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button
              type="button"
              onClick={() => setIsPlaying(prev => !prev)}
              className="btn btn-sm"
              style={{
                background: isPlaying ? "rgba(239, 68, 68, 0.2)" : "rgba(0, 240, 255, 0.2)",
                color: isPlaying ? "#EF4444" : "#00F0FF",
                border: `1px solid ${isPlaying ? "rgba(239, 68, 68, 0.4)" : "rgba(0, 240, 255, 0.4)"}`,
                borderRadius: "9999px",
                padding: "4px 12px",
                display: "flex",
                alignItems: "center",
                gap: "5px",
                fontSize: "0.78rem",
                fontWeight: 800
              }}
              title={isPlaying ? "Pause timeline simulation" : "Play route simulation"}
            >
              {isPlaying ? <Pause size={13} /> : <Play size={13} />}
              <span>{isPlaying ? "Pause" : "Play Simulation"}</span>
            </button>

            {/* Sync to Live ETA Button */}
            <button
              type="button"
              onClick={handleSyncToLiveETA}
              className="btn btn-sm"
              style={{
                background: isLiveSynced ? "rgba(16, 185, 129, 0.25)" : "rgba(255, 255, 255, 0.08)",
                color: isLiveSynced ? "#10B981" : "#E2E8F0",
                border: `1px solid ${isLiveSynced ? "rgba(16, 185, 129, 0.5)" : "rgba(255, 255, 255, 0.15)"}`,
                borderRadius: "9999px",
                padding: "4px 12px",
                display: "flex",
                alignItems: "center",
                gap: "5px",
                fontSize: "0.78rem",
                fontWeight: 700
              }}
              title="Snap vehicle directly to real-time estimated delivery schedule"
            >
              <Radio size={13} />
              <span>{isLiveSynced ? "● Live ETA Synced" : "Sync to Live ETA"}</span>
            </button>

            {/* Speed Multiplier */}
            <button
              type="button"
              onClick={() => setPlaybackSpeed(s => (s === 1 ? 2 : s === 2 ? 4 : 1))}
              className="btn btn-sm"
              style={{
                background: "rgba(255, 255, 255, 0.08)",
                color: "#E2E8F0",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                borderRadius: "9999px",
                padding: "4px 10px",
                fontSize: "0.76rem",
                fontWeight: 700
              }}
              title="Playback simulation speed"
            >
              Speed: {playbackSpeed}x
            </button>
          </div>

          {/* Right Actions: Vehicle Mode Switcher & Quick Milestone Snaps */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
            {/* Vehicle Mode Toggle: Auto / Plane / Truck */}
            <div 
              style={{
                display: "flex",
                background: "rgba(255, 255, 255, 0.06)",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                borderRadius: "9999px",
                padding: "2px"
              }}
            >
              <button
                type="button"
                onClick={() => setVehicleMode('auto')}
                style={{
                  background: vehicleMode === 'auto' ? "rgba(0, 240, 255, 0.3)" : "transparent",
                  color: vehicleMode === 'auto' ? "#00F0FF" : "#94A3B8",
                  border: "none",
                  borderRadius: "9999px",
                  padding: "3px 8px",
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  cursor: "pointer"
                }}
                title="Auto-switch: Plane during interstate linehaul, Truck during last-mile delivery"
              >
                Auto Switch
              </button>
              <button
                type="button"
                onClick={() => setVehicleMode('plane')}
                style={{
                  background: vehicleMode === 'plane' ? "rgba(0, 240, 255, 0.3)" : "transparent",
                  color: vehicleMode === 'plane' ? "#00F0FF" : "#94A3B8",
                  border: "none",
                  borderRadius: "9999px",
                  padding: "3px 8px",
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  cursor: "pointer"
                }}
                title="Force Aeroplane Mode"
              >
                ✈️ Plane
              </button>
              <button
                type="button"
                onClick={() => setVehicleMode('truck')}
                style={{
                  background: vehicleMode === 'truck' ? "rgba(16, 185, 129, 0.3)" : "transparent",
                  color: vehicleMode === 'truck' ? "#10B981" : "#94A3B8",
                  border: "none",
                  borderRadius: "9999px",
                  padding: "3px 8px",
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  cursor: "pointer"
                }}
                title="Force Delivery Truck Mode"
              >
                🚚 Truck
              </button>
            </div>

            {/* Quick Milestone Snaps */}
            <button
              type="button"
              onClick={() => jumpToMilestone(0.0)}
              style={{
                background: "rgba(255, 255, 255, 0.06)",
                color: "#94A3B8",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "9999px",
                padding: "3px 8px",
                fontSize: "0.72rem",
                fontWeight: 700,
                cursor: "pointer"
              }}
              title="Jump to Origin Station"
            >
              0%
            </button>
            <button
              type="button"
              onClick={() => jumpToMilestone(0.5)}
              style={{
                background: "rgba(255, 255, 255, 0.06)",
                color: "#94A3B8",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "9999px",
                padding: "3px 8px",
                fontSize: "0.72rem",
                fontWeight: 700,
                cursor: "pointer"
              }}
              title="Jump to Mid-Flight Linehaul"
            >
              50%
            </button>
            <button
              type="button"
              onClick={() => jumpToMilestone(0.85)}
              style={{
                background: "rgba(255, 255, 255, 0.06)",
                color: "#94A3B8",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "9999px",
                padding: "3px 8px",
                fontSize: "0.72rem",
                fontWeight: 700,
                cursor: "pointer"
              }}
              title="Jump to Out for Delivery City Route"
            >
              85%
            </button>
            <button
              type="button"
              onClick={() => jumpToMilestone(1.0)}
              style={{
                background: "rgba(255, 255, 255, 0.06)",
                color: "#10B981",
                border: "1px solid rgba(16, 185, 129, 0.3)",
                borderRadius: "9999px",
                padding: "3px 8px",
                fontSize: "0.72rem",
                fontWeight: 700,
                cursor: "pointer"
              }}
              title="Jump to Delivered Doorstep"
            >
              100%
            </button>
          </div>
        </div>
      </div>

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
        }
        .leaflet-popup-tip {
          background: rgba(15, 23, 42, 0.95);
        }
        .leaflet-bar {
          background: rgba(15, 23, 42, 0.9) !important;
          border: 1px solid rgba(255, 255, 255, 0.2) !important;
          border-radius: 10px !important;
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
        body.theme-light .map-control-panel-container {
          background: rgba(255, 255, 255, 0.95) !important;
          border-color: #E2E8F0 !important;
          box-shadow: 0 16px 40px rgba(0, 0, 0, 0.12) !important;
        }
      `}</style>
    </div>
  );
}

export default MyMap;
