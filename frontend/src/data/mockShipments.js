/**
 * AeroDispatch - Master Fleet Data & Operational Stores
 * 
 * Provides production-grade operational master data for System Administrator console
 * across all browsers (Chrome, Edge, Firefox, Safari) while keeping newly registered
 * Driver and Customer accounts strictly isolated to their own accounts and bookings.
 */

const now = Date.now();
const hour = 3600 * 1000;

export const MASTER_ADMIN_SHIPMENTS = [
  {
    id: "AD-8849-2041",
    awbNumber: "AD-8849-2041",
    orderId: "ORD-8849-2041",
    displayOrderId: "ORD-8849-2041",
    barcode: "||| |||| || |||||| | |||",
    serviceTier: "Express Air Linehaul",
    currentStatus: "IN_TRANSIT",
    paymentMode: "Prepaid Online",
    declaredValue: 24500,
    weightKg: 3.2,
    dimensions: "32 x 24 x 18 cm",
    category: "High-Priority Electronics",
    createdAt: new Date(now - 14 * hour).toISOString(),
    estimatedDelivery: new Date(now + 6 * hour).toISOString(),
    currentLocation: "Bhopal Airspace (Flight BOM-DEL #842)",
    sender: {
      name: "Reliance Digital Retail Hub",
      facility: "Mumbai Cargo Gateway (BOM-01)",
      city: "Mumbai",
      state: "Maharashtra",
      pinCode: "400099",
      phone: "+91 98200 84691",
      address: "Air Cargo Complex, Terminal 2, Sahar Road"
    },
    recipient: {
      name: "Amitabh Verma",
      city: "New Delhi",
      state: "Delhi",
      pinCode: "110001",
      phone: "+91 98110 54321",
      address: "B-42, Connaught Place Logistics Tower"
    },
    assignedDriver: {
      driverId: "DRV-4122",
      name: "Captain Rajesh Kumar",
      vehicleNumber: "DL-01-EV-4122",
      phone: "+91 98110 33412"
    },
    proofOfDelivery: null,
    events: [
      {
        id: "ev-101",
        status: "BOOKED",
        title: "Shipment Created & Barcoded",
        location: "Mumbai Gateway (BOM-01)",
        timestamp: new Date(now - 14 * hour).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + " Yesterday",
        notes: "Air Waybill registered and barcode labeled."
      },
      {
        id: "ev-102",
        status: "PICKED_UP",
        title: "Hub Inbound Handover Complete",
        location: "Mumbai Hub Sorting Zone",
        timestamp: new Date(now - 10 * hour).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        notes: "X-ray screening verified and cleared for linehaul flight."
      },
      {
        id: "ev-103",
        status: "IN_TRANSIT",
        title: "Flight BOM-DEL #842 In-Flight Linehaul",
        location: "Central India Flight Corridor",
        timestamp: new Date(now - 2 * hour).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        notes: "Cruising at 34,000 ft. ETA Delhi Cargo Gateway on schedule."
      }
    ]
  },
  {
    id: "AD-2910-4491",
    awbNumber: "AD-2910-4491",
    orderId: "ORD-2910-4491",
    displayOrderId: "ORD-2910-4491",
    barcode: "|||| | ||| |||| | |||||",
    serviceTier: "Same-Day Express",
    currentStatus: "OUT_FOR_DELIVERY",
    paymentMode: "Cash on Delivery (COD)",
    declaredValue: 4800,
    codAmount: 4800,
    weightKg: 1.8,
    dimensions: "26 x 18 x 12 cm",
    category: "Medical Diagnostics Pack",
    createdAt: new Date(now - 22 * hour).toISOString(),
    estimatedDelivery: new Date(now + 2 * hour).toISOString(),
    currentLocation: "Indiranagar 100ft Road (Captain Van)",
    sender: {
      name: "Apollo Diagnostic Labs",
      facility: "Bengaluru Logistics Hub (BLR-03)",
      city: "Bengaluru",
      state: "Karnataka",
      pinCode: "560001",
      phone: "+91 99000 44112",
      address: "Logistics Hub Node 4, Devanahalli"
    },
    recipient: {
      name: "Sneha Sundaram",
      city: "Bengaluru",
      state: "Karnataka",
      pinCode: "560038",
      phone: "+91 98450 78469",
      address: "Flat 402, Green Glen Residency, Indiranagar"
    },
    assignedDriver: {
      driverId: "DRV-8469",
      name: "Captain Rishabh Pandey",
      vehicleNumber: "MH-02-EV-8469",
      phone: "+91 90042 78469"
    },
    proofOfDelivery: null,
    events: [
      {
        id: "ev-201",
        status: "BOOKED",
        title: "Cold-Chain Consignment Booked",
        location: "BLR-03 Diagnostic Facility",
        timestamp: new Date(now - 22 * hour).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + " Yesterday",
        notes: "Temperature monitored package sealed."
      },
      {
        id: "ev-202",
        status: "IN_TRANSIT",
        title: "Intra-City Hub Shuttle Dispatch",
        location: "Bengaluru Ring Road Linehaul",
        timestamp: new Date(now - 5 * hour).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        notes: "Transferred to Indiranagar dispatch hub."
      },
      {
        id: "ev-203",
        status: "OUT_FOR_DELIVERY",
        title: "Out for Doorstep Handover with Captain",
        location: "Indiranagar Last-Mile Corridor",
        timestamp: new Date(now - 45 * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        notes: "Captain Rishabh Pandey in transit with parcel. OTP verification required."
      }
    ]
  },
  {
    id: "AD-1842-9901",
    awbNumber: "AD-1842-9901",
    orderId: "ORD-1842-9901",
    displayOrderId: "ORD-1842-9901",
    barcode: "||| || | |||| ||| ||||",
    serviceTier: "Priority Express Air",
    currentStatus: "BOOKED",
    paymentMode: "Prepaid Online",
    declaredValue: 8900,
    weightKg: 2.1,
    dimensions: "28 x 20 x 14 cm",
    category: "Corporate Document Crate",
    createdAt: new Date(now - 2 * hour).toISOString(),
    estimatedDelivery: new Date(now + 28 * hour).toISOString(),
    currentLocation: "Bengaluru Air Cargo Station (BLR-03)",
    sender: {
      name: "Infosys Campus Logistics",
      facility: "Electronics City Node",
      city: "Bengaluru",
      state: "Karnataka",
      pinCode: "560100",
      phone: "+91 98451 99010",
      address: "Plot 44, Electronic City Phase 1"
    },
    recipient: {
      name: "Kavita Reddy",
      city: "Hyderabad",
      state: "Telangana",
      pinCode: "500081",
      phone: "+91 98850 12842",
      address: "Mindspace Cyberabad Tower 3, HITEC City"
    },
    assignedDriver: null,
    proofOfDelivery: null,
    events: [
      {
        id: "ev-301",
        status: "BOOKED",
        title: "Air Waybill Generated",
        location: "BLR-03 Air Station",
        timestamp: new Date(now - 2 * hour).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        notes: "Manifest ready. Awaiting courier captain assignment."
      }
    ]
  },
  {
    id: "AD-1281-1969",
    awbNumber: "AD-1281-1969",
    orderId: "ORD-1281-1969",
    displayOrderId: "ORD-1281-1969",
    barcode: "|||||| | || |||| | ||",
    serviceTier: "Express Cargo Air",
    currentStatus: "DELIVERED",
    paymentMode: "Prepaid Online",
    declaredValue: 16500,
    weightKg: 4.5,
    dimensions: "35 x 25 x 20 cm",
    category: "Precision Engineering Parts",
    createdAt: new Date(now - 38 * hour).toISOString(),
    estimatedDelivery: new Date(now - 3 * hour).toISOString(),
    currentLocation: "Delivered at Destination (Pune)",
    sender: {
      name: "Tata Precision Tooling",
      facility: "Hyderabad Logistics Gateway (HYD-04)",
      city: "Hyderabad",
      state: "Telangana",
      pinCode: "500001",
      phone: "+91 98490 22119",
      address: "Logistics Gate 2, Shamshabad Airport"
    },
    recipient: {
      name: "Darshan Mehta",
      city: "Pune",
      state: "Maharashtra",
      pinCode: "411057",
      phone: "+91 98220 91281",
      address: "B-10, Rajiv Gandhi Infotech Park, Hinjewadi"
    },
    assignedDriver: {
      driverId: "DRV-7731",
      name: "Captain Priya Sharma",
      vehicleNumber: "KA-03-EV-7731",
      phone: "+91 98450 17731"
    },
    proofOfDelivery: {
      deliveredTo: "Darshan Mehta (Self)",
      timestamp: new Date(now - 3 * hour).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + " Today",
      verificationMethod: "OTP Verified (8469)",
      photoUrl: "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=500&q=80",
      aiConfidence: 99.4
    },
    events: [
      {
        id: "ev-401",
        status: "BOOKED",
        title: "Consignment Handover Logged",
        location: "HYD-04 Shamshabad Hub",
        timestamp: new Date(now - 38 * hour).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + " 2 Days Ago",
        notes: "Security clearance granted."
      },
      {
        id: "ev-402",
        status: "IN_TRANSIT",
        title: "Interstate Linehaul Flight",
        location: "Hyderabad ➔ Pune Air Corridor",
        timestamp: new Date(now - 16 * hour).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        notes: "Flight linehaul arrived Pune Gateway on time."
      },
      {
        id: "ev-403",
        status: "DELIVERED",
        title: "Delivered & Verified via OTP",
        location: "Hinjewadi Tech Park Phase 2",
        timestamp: new Date(now - 3 * hour).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        notes: "Secure OTP 8469 verified by recipient Darshan Mehta."
      }
    ]
  },
  {
    id: "AD-5521-8842",
    awbNumber: "AD-5521-8842",
    orderId: "ORD-5521-8842",
    displayOrderId: "ORD-5521-8842",
    barcode: "||| ||| | |||| | ||| ||",
    serviceTier: "Standard Ground Express",
    currentStatus: "IN_TRANSIT",
    paymentMode: "Prepaid Fleet Account",
    declaredValue: 32000,
    weightKg: 8.5,
    dimensions: "45 x 35 x 30 cm",
    category: "Automotive Ancillary Spares",
    createdAt: new Date(now - 20 * hour).toISOString(),
    estimatedDelivery: new Date(now + 18 * hour).toISOString(),
    currentLocation: "National Highway 48 (Surat Corridor)",
    sender: {
      name: "Gujarat Industrial Spares Ltd",
      facility: "Ahmedabad Sorting Hub",
      city: "Ahmedabad",
      state: "Gujarat",
      pinCode: "380001",
      phone: "+91 98250 88421",
      address: "GIDC Industrial Estate, Vatva"
    },
    recipient: {
      name: "Kishore Kulkarni",
      city: "Mumbai",
      state: "Maharashtra",
      pinCode: "400072",
      phone: "+91 98210 55218",
      address: "Plot 88, Saki Naka Industrial Area, Andheri East"
    },
    assignedDriver: {
      driverId: "DRV-8469",
      name: "Captain Rishabh Pandey",
      vehicleNumber: "MH-02-EV-8469",
      phone: "+91 90042 78469"
    },
    proofOfDelivery: null,
    events: [
      {
        id: "ev-501",
        status: "BOOKED",
        title: "Heavy Cargo Manifest Created",
        location: "Ahmedabad Freight Terminal",
        timestamp: new Date(now - 20 * hour).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + " Yesterday",
        notes: "Weighbridge certified: 8.5 kg."
      },
      {
        id: "ev-502",
        status: "IN_TRANSIT",
        title: "Express Highway Linehaul Transit",
        location: "Surat-Mumbai NH48 Corridor",
        timestamp: new Date(now - 4 * hour).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        notes: "Highway linehaul EV truck in transit."
      }
    ]
  },
  {
    id: "AD-7734-1102",
    awbNumber: "AD-7734-1102",
    orderId: "ORD-7734-1102",
    displayOrderId: "ORD-7734-1102",
    barcode: "|||| | || ||| |||| |",
    serviceTier: "Priority Express",
    currentStatus: "FAILED_ATTEMPT",
    paymentMode: "Prepaid Online",
    declaredValue: 6200,
    weightKg: 1.4,
    dimensions: "22 x 16 x 10 cm",
    category: "Optical Equipment Lens",
    createdAt: new Date(now - 26 * hour).toISOString(),
    estimatedDelivery: new Date(now + 8 * hour).toISOString(),
    currentLocation: "Bhubaneswar Node (Held for Reattempt)",
    sender: {
      name: "Kolkata Precision Optics",
      facility: "Kolkata Eastern Node (CCU-05)",
      city: "Kolkata",
      state: "West Bengal",
      pinCode: "700052",
      phone: "+91 98300 77341",
      address: "Jessore Road, Dum Dum Cargo Node"
    },
    recipient: {
      name: "Debashis Mohapatra",
      city: "Bhubaneswar",
      state: "Odisha",
      pinCode: "751024",
      phone: "+91 94370 11027",
      address: "HIG-24, Infocity Avenue, Chandrasekharpur"
    },
    assignedDriver: null,
    proofOfDelivery: null,
    events: [
      {
        id: "ev-601",
        status: "BOOKED",
        title: "Consignment Ingested",
        location: "Kolkata CCU-05",
        timestamp: new Date(now - 26 * hour).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + " Yesterday",
        notes: "Dispatched via overnight feeder line."
      },
      {
        id: "ev-602",
        status: "FAILED_ATTEMPT",
        title: "Delivery Exception: Premises Locked",
        location: "Bhubaneswar Chandrasekharpur Gate",
        timestamp: new Date(now - 5 * hour).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        notes: "Customer contacted. Rescheduled for afternoon delivery window."
      }
    ]
  }
];

export const MASTER_ADMIN_METRICS = {
  totalShipmentsToday: 6,
  activeInTransit: 2,
  outForDelivery: 1,
  deliveredToday: 2,
  failedExceptions: 1,
  onTimeSlaPercentage: 98.6,
  activeHubs: 6,
  activeFleetCount: 3
};

export const MASTER_ADMIN_HUBS = [
  {
    id: "hub-bom-01",
    name: "Mumbai Cargo Gateway",
    code: "BOM-01",
    city: "Mumbai",
    state: "Maharashtra",
    coordinates: [19.0896, 72.8656],
    capacity: 25000,
    currentLoad: 18450,
    activeLines: 142,
    status: "OPTIMAL",
    uptimePercentage: 99.4
  },
  {
    id: "hub-del-02",
    name: "Delhi Central Air Cargo Hub",
    code: "DEL-02",
    city: "New Delhi",
    state: "Delhi",
    coordinates: [28.5562, 77.1000],
    capacity: 35000,
    currentLoad: 28900,
    activeLines: 186,
    status: "OPTIMAL",
    uptimePercentage: 99.1
  },
  {
    id: "hub-blr-03",
    name: "Bengaluru Air Logistics Complex",
    code: "BLR-03",
    city: "Bengaluru",
    state: "Karnataka",
    coordinates: [13.1986, 77.7066],
    capacity: 22000,
    currentLoad: 16800,
    activeLines: 115,
    status: "OPTIMAL",
    uptimePercentage: 98.8
  },
  {
    id: "hub-hyd-04",
    name: "Hyderabad RGIA Air Freight Node",
    code: "HYD-04",
    city: "Hyderabad",
    state: "Telangana",
    coordinates: [17.2403, 78.4294],
    capacity: 18000,
    currentLoad: 12400,
    activeLines: 89,
    status: "OPTIMAL",
    uptimePercentage: 98.6
  },
  {
    id: "hub-ccu-05",
    name: "Kolkata Eastern Logistics Gateway",
    code: "CCU-05",
    city: "Kolkata",
    state: "West Bengal",
    coordinates: [22.6547, 88.4467],
    capacity: 15000,
    currentLoad: 9800,
    activeLines: 64,
    status: "OPTIMAL",
    uptimePercentage: 97.5
  },
  {
    id: "hub-maa-06",
    name: "Chennai Coastal & Air Gateway",
    code: "MAA-06",
    city: "Chennai",
    state: "Tamil Nadu",
    coordinates: [12.9941, 80.1709],
    capacity: 16000,
    currentLoad: 11200,
    activeLines: 78,
    status: "OPTIMAL",
    uptimePercentage: 98.2
  }
];

export const MASTER_ADMIN_DRIVERS = [
  {
    id: "drv-8469",
    driverId: "DRV-8469",
    name: "Captain Rishabh Pandey",
    phone: "+91 90042 78469",
    email: "driver@aerodispatch.io",
    vehicleNumber: "MH-02-EV-8469",
    vehicleType: "Electric Cargo Van",
    operationalZone: "Mumbai Metro & Western Corridor",
    zone: "Mumbai Metro & Western Corridor",
    hub: "Mumbai Cargo Gateway (BOM-01)",
    status: "ON_DUTY",
    activeDeliveries: 1,
    rating: 4.95,
    completedStopsToday: 14
  },
  {
    id: "drv-4122",
    driverId: "DRV-4122",
    name: "Captain Rajesh Kumar",
    phone: "+91 98110 33412",
    email: "rajesh.kumar@aerodispatch.io",
    vehicleNumber: "DL-01-EV-4122",
    vehicleType: "High-Capacity Linehaul Shuttle",
    operationalZone: "Delhi NCR & North Linehaul",
    zone: "Delhi NCR & North Linehaul",
    hub: "Delhi Central Air Cargo Hub (DEL-02)",
    status: "ON_DUTY",
    activeDeliveries: 1,
    rating: 4.91,
    completedStopsToday: 19
  },
  {
    id: "drv-7731",
    driverId: "DRV-7731",
    name: "Captain Priya Sharma",
    phone: "+91 98450 17731",
    email: "priya.sharma@aerodispatch.io",
    vehicleNumber: "KA-03-EV-7731",
    vehicleType: "Eco Urban Delivery Sprinter",
    operationalZone: "Bengaluru Tech Corridor",
    zone: "Bengaluru Tech Corridor",
    hub: "Bengaluru Air Logistics Complex (BLR-03)",
    status: "AVAILABLE",
    activeDeliveries: 0,
    rating: 4.98,
    completedStopsToday: 16
  }
];

// Clean fallback exports for brand new driver / customer logins
export const MOCK_SHIPMENTS = [];
export const MOCK_ADMIN_METRICS = MASTER_ADMIN_METRICS;
export const MOCK_HUBS = MASTER_ADMIN_HUBS;
export const MOCK_DRIVERS = MASTER_ADMIN_DRIVERS;

export const MOCK_NOTIFICATIONS = [
  {
    id: 'notif-init-1',
    category: 'assignment',
    title: 'New Captain Run Sheet Assigned',
    message: 'Express air consignment AD-1842-9901 assigned to Captain Rishabh Pandey for immediate hub linehaul dispatch.',
    time: '5 mins ago',
    awbNumber: 'AD-1842-9901',
    read: false,
    severity: 'warning'
  },
  {
    id: 'notif-init-2',
    category: 'alert',
    title: 'Express Linehaul Flight Departure Confirmed',
    message: 'Flight linehaul BOM-DEL #842 departed on schedule. 18 express cargo containers in-flight.',
    time: '22 mins ago',
    awbNumber: 'AD-8849-2041',
    read: false,
    severity: 'info'
  },
  {
    id: 'notif-init-3',
    category: 'shipment',
    title: 'Consignment Handed Over to Recipient',
    message: 'OTP 8469 verified successfully. Consignment delivered to Darshan Mehta at Hinjewadi Tech Park.',
    time: '1 hour ago',
    awbNumber: 'AD-1281-1969',
    read: false,
    severity: 'success'
  },
  {
    id: 'notif-init-4',
    category: 'system',
    title: 'Cognito Security Authorization Verified',
    message: 'HS256 Bearer Session verified with AWS Cognito IAM identity provider for operator session.',
    time: '2 hours ago',
    read: true,
    severity: 'info'
  },
  {
    id: 'notif-init-5',
    category: 'alert',
    title: 'Precautionary Weather Advisory: Mumbai Coastal Corridor',
    message: 'Monsoon reroute active via Coastal Highway. Estimated transit times adjusted by ~6 mins.',
    time: '4 hours ago',
    read: true,
    severity: 'warning'
  },
  {
    id: 'notif-init-6',
    category: 'shipment',
    title: 'Air Waybill Barcode Registered Nationwide',
    message: 'Consignment AD-2910-4491 registered with nationwide air cargo dispatch network and sorting hubs.',
    time: '6 hours ago',
    awbNumber: 'AD-2910-4491',
    read: true,
    severity: 'info'
  },
  {
    id: 'notif-init-7',
    category: 'assignment',
    title: 'Captain EV Fleet Battery Status Nominal',
    message: 'Smart telematics telemetry: 28 EV fleet vans fully charged and operational across Western Hubs.',
    time: '8 hours ago',
    read: true,
    severity: 'success'
  }
];

export const MOCK_USERS = {};
