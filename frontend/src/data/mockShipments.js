/**
 * AeroDispatch - Authentic User Consignments & Operations Store
 * 
 * Exclusively provides the authentic consignments created by the user:
 * 1. AD-9467-5001 (DIVA -> Kolkata, Deepak sharma -> Anil Prajapati, Driver Rishabh Pandey)
 * 2. AD-3317-2928 (Kolkata -> Hyderabad, Abhi -> Darshan, Delivered)
 * 3. AD-1281-1969 (Hyderabad -> Bengaluru, Darshan -> Anil Prajapati, Delivered)
 */

export const MASTER_ADMIN_SHIPMENTS = [
  {
    id: "AD-9467-5001",
    awbNumber: "AD-9467-5001",
    orderId: "AD-9467-5001",
    displayOrderId: "ORD-9467-5001",
    barcode: "||| | |||| | |||||| || | ||",
    serviceTier: "AeroExpress Air",
    currentStatus: "OUT_FOR_DELIVERY",
    paymentMode: "Prepaid",
    declaredValue: 3500,
    weightKg: 50,
    dimensions: "25 x 25 x 10 cm",
    category: "Healthcare Pharma",
    customerEmail: "microsofty543@gmail.com",
    createdAt: "2026-11-07T04:52:08.139Z",
    estimatedDelivery: "2026-11-09T04:52:08.139Z",
    currentLocation: "DIVA, Booking Station",
    sender: {
      name: "Deepak sharma",
      facility: "Origin Distribution Hub",
      city: "DIVA",
      state: "Maharashtra",
      pinCode: "400612",
      phone: "08433826579",
      address: "GANGOTRI APARTMENT , WAREKAR NAGAR"
    },
    recipient: {
      name: "Anil Prajapati",
      city: "Kolkata",
      state: "West Bengal",
      pinCode: "700001",
      phone: "+91 98200 44112",
      address: "BBD Bagh Commercial Arcade, Unit 12"
    },
    assignedDriver: {
      driverId: "DRV-658",
      name: "Rishabh Pandey",
      vehicleNumber: "MH-02-EE-8891",
      phone: "+91 90043 58469",
      rating: 4.9,
      assignedAt: "2026-11-07T04:57:52.977Z"
    },
    proofOfDelivery: null,
    events: [
      {
        id: "ev-1794027128139",
        status: "BOOKED",
        title: "Consignment Manifested & Booked",
        location: "DIVA Hub",
        timestamp: "Nov 7, 04:52 AM",
        notes: "Digital Air Waybill created. Awaiting first-mile pickup manifest."
      },
      {
        id: "ev-1794027472987",
        status: "BOOKED",
        title: "Assigned to Delivery Associate (Rishabh Pandey)",
        location: "DIVA, Booking Station",
        timestamp: "Nov 7, 04:57 AM",
        notes: "Driver Rishabh Pandey (DRV-658) assigned for dispatch."
      },
      {
        id: "ev-1794027473001",
        status: "OUT_FOR_DELIVERY",
        title: "Dispatched for Final Delivery",
        location: "DIVA, Booking Station",
        timestamp: "Nov 7, 04:57 AM",
        notes: "Accepted by courier associate Rishabh Pandey for immediate dispatch."
      }
    ]
  },
  {
    id: "AD-3317-2928",
    awbNumber: "AD-3317-2928",
    orderId: "AD-3317-2928",
    displayOrderId: "ORD-3317-2928",
    barcode: "||| ||| |||| | |||||| | |||",
    serviceTier: "Standard Surface",
    currentStatus: "DELIVERED",
    paymentMode: "Prepaid Online",
    declaredValue: 2400,
    weightKg: 5.2,
    dimensions: "28 x 20 x 14 cm",
    category: "Apparel & Textile",
    customerEmail: "microsofty543@gmail.com",
    createdAt: "2026-11-08T06:15:00.000Z",
    estimatedDelivery: "2026-11-10T12:00:00.000Z",
    currentLocation: "Hyderabad Delivery Terminal (HYD-04)",
    sender: {
      name: "Abhi",
      facility: "Kolkata Gateway Station",
      city: "Kolkata",
      state: "West Bengal",
      pinCode: "700001",
      phone: "+91 98300 12844",
      address: "BBD Bagh Commercial Arcade, Unit 12"
    },
    recipient: {
      name: "Darshan",
      city: "Hyderabad",
      state: "Telangana",
      pinCode: "500081",
      phone: "+91 90043 58469",
      address: "Tower B, HITEC City Gate"
    },
    assignedDriver: {
      driverId: "DRV-504",
      name: "Captain Ramesh Kumar",
      vehicleNumber: "TS-09-EV-5041",
      phone: "+91 98110 33412"
    },
    proofOfDelivery: {
      deliveredTo: "Darshan",
      photoUrl: "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=500&q=80",
      timestamp: "Nov 10, 02:24 PM",
      verificationMethod: "OTP Verified (4892)"
    },
    events: [
      {
        id: "ev-3317-1",
        status: "BOOKED",
        title: "Confirmed & Created",
        location: "Kolkata Hub",
        timestamp: "Nov 8, 06:15 AM",
        notes: "Waybill generated. Waiting for courier acceptance."
      },
      {
        id: "ev-3317-2",
        status: "IN_TRANSIT",
        title: "Linehaul Transit Inbound",
        location: "Eastern Air Corridor",
        timestamp: "Nov 9, 10:30 AM",
        notes: "Consignment in flight to Southern Regional Gateway."
      },
      {
        id: "ev-3317-3",
        status: "DELIVERED",
        title: "Package Delivered Successfully",
        location: "Hyderabad, HITEC City",
        timestamp: "Nov 10, 02:24 PM",
        notes: "Handover recorded with OTP verification (4892)."
      }
    ]
  },
  {
    id: "AD-1281-1969",
    awbNumber: "AD-1281-1969",
    orderId: "AD-1281-1969",
    displayOrderId: "ORD-1281-1969",
    barcode: "|||| ||| || |||||| | |||",
    serviceTier: "Same-Day Priority Air",
    currentStatus: "DELIVERED",
    paymentMode: "Prepaid Online",
    declaredValue: 42000,
    weightKg: 3.8,
    dimensions: "36 x 28 x 16 cm",
    category: "High-Priority Electronics",
    customerEmail: "microsofty543@gmail.com",
    createdAt: "2026-11-09T08:30:00.000Z",
    estimatedDelivery: "2026-11-10T14:00:00.000Z",
    currentLocation: "Bengaluru Delivery Gateway (BLR-03)",
    sender: {
      name: "Darshan Mehta",
      facility: "Hyderabad Cargo Complex",
      city: "Hyderabad",
      state: "Telangana",
      pinCode: "500081",
      phone: "+91 98490 12846",
      address: "Tower B, HITEC City Logistics Gate"
    },
    recipient: {
      name: "Anil Prajapati",
      city: "Bengaluru",
      state: "Karnataka",
      pinCode: "560100",
      phone: "+91 99001 88241",
      address: "Tech Park Lane, Block B, Electronic City"
    },
    assignedDriver: {
      driverId: "DRV-4122",
      name: "Captain Rajesh Kumar",
      vehicleNumber: "KA-04-EV-7731",
      phone: "+91 98450 78469"
    },
    proofOfDelivery: {
      deliveredTo: "Anil Prajapati",
      photoUrl: "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=500&q=80",
      timestamp: "Nov 10, 01:15 PM",
      verificationMethod: "OTP Verified (8469)"
    },
    events: [
      {
        id: "ev-1281-1",
        status: "BOOKED",
        title: "Air Waybill Booked",
        location: "Hyderabad Cargo Complex",
        timestamp: "Nov 9, 08:30 AM",
        notes: "Manifest accepted and priority barcode generated."
      },
      {
        id: "ev-1281-2",
        status: "IN_TRANSIT",
        title: "Flight Linehaul Departed",
        location: "Deccan Air Corridor",
        timestamp: "Nov 9, 04:00 PM",
        notes: "Air consignment departed for Bengaluru Terminal."
      },
      {
        id: "ev-1281-3",
        status: "DELIVERED",
        title: "Consignment Handed Over to Recipient",
        location: "Bengaluru, Electronic City",
        timestamp: "Nov 10, 01:15 PM",
        notes: "Consignment delivered safe and smooth. OTP 8469 verified."
      }
    ]
  }
];

export const MOCK_SHIPMENTS = MASTER_ADMIN_SHIPMENTS;

export const MASTER_ADMIN_METRICS = {
  totalShipmentsToday: 3,
  activeInTransit: 1,
  outForDelivery: 1,
  deliveredToday: 2,
  failedExceptions: 0,
  onTimeSlaPercentage: 100.0,
  activeHubs: 4,
  activeFleetCount: 3
};
export const MOCK_ADMIN_METRICS = MASTER_ADMIN_METRICS;

export const MASTER_ADMIN_HUBS = [
  { id: "HUB-DIVA", name: "Diva Booking Gateway", city: "DIVA", total: 1, inTransit: 1, capacityUsage: 45, status: "Optimal" },
  { id: "HUB-CCU", name: "Kolkata Commercial Gateway", city: "Kolkata", total: 2, inTransit: 1, capacityUsage: 60, status: "Optimal" },
  { id: "HUB-HYD", name: "Hyderabad Central Hub", city: "Hyderabad", total: 2, inTransit: 0, capacityUsage: 50, status: "Optimal" },
  { id: "HUB-BLR", name: "Bengaluru Tech Cargo Terminal", city: "Bengaluru", total: 1, inTransit: 0, capacityUsage: 40, status: "Optimal" }
];
export const MOCK_HUBS = MASTER_ADMIN_HUBS;

export const MASTER_ADMIN_DRIVERS = [
  {
    id: "DRV-658",
    driverId: "DRV-658",
    name: "Captain Rishabh Pandey",
    email: "oldmemories021@gmail.com",
    phone: "+91 90043 58469",
    vehicle: "MH-02-EE-8891",
    vehicleNumber: "MH-02-EE-8891",
    vehicleType: "Express Electric Cargo Van",
    zone: "Western Hub & Airport Corridor",
    status: "ON_DUTY",
    rating: 4.9,
    tripsCompleted: 142,
    onTimeRate: "99.2%"
  },
  {
    id: "DRV-504",
    driverId: "DRV-504",
    name: "Captain Ramesh Kumar",
    email: "ramesh.kumar@aerodispatch.internal",
    phone: "+91 98110 33412",
    vehicle: "TS-09-EV-5041",
    vehicleNumber: "TS-09-EV-5041",
    vehicleType: "High-Capacity Linehaul Van",
    zone: "Telangana & Deccan Freight Corridors",
    status: "AVAILABLE",
    rating: 4.8,
    tripsCompleted: 218,
    onTimeRate: "98.7%"
  },
  {
    id: "DRV-4122",
    driverId: "DRV-4122",
    name: "Captain Rajesh Kumar",
    email: "rajesh.kumar@aerodispatch.internal",
    phone: "+91 98450 78469",
    vehicle: "KA-04-EV-7731",
    vehicleNumber: "KA-04-EV-7731",
    vehicleType: "Express Air Link Cargo EV",
    zone: "Southern Corridor & Electronic City Hub",
    status: "AVAILABLE",
    rating: 4.95,
    tripsCompleted: 312,
    onTimeRate: "99.6%"
  }
];
export const MOCK_DRIVERS = MASTER_ADMIN_DRIVERS;

export const MOCK_NOTIFICATIONS = [
  {
    id: "notif-1",
    category: "shipment",
    title: "Consignment Handed Over to Recipient",
    message: "OTP 8469 verified successfully. Consignment AD-1281-1969 delivered to Anil Prajapati at Electronic City.",
    time: "1 hour ago",
    awbNumber: "AD-1281-1969",
    read: false,
    severity: "success"
  },
  {
    id: "notif-2",
    category: "shipment",
    title: "Package Delivered Successfully",
    message: "Handover recorded with OTP verification. Consignment AD-3317-2928 delivered to Darshan.",
    time: "2 hours ago",
    awbNumber: "AD-3317-2928",
    read: false,
    severity: "success"
  },
  {
    id: "notif-3",
    category: "assignment",
    title: "Consignment Dispatched for Final Delivery",
    message: "Consignment AD-9467-5001 out for delivery with Captain Rishabh Pandey (DRV-658).",
    time: "3 hours ago",
    awbNumber: "AD-9467-5001",
    read: true,
    severity: "info"
  }
];

export const MOCK_USERS = {};
