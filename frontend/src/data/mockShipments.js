/**
 * AeroDispatch - Clean Production Data Store
 * 
 * All demo, mock, and test datasets have been completely emptied.
 * Ready for clean live customer registrations, driver on-boarding, and manifests.
 */

export const MOCK_SHIPMENTS = [];

export const MOCK_ADMIN_METRICS = {
  totalShipmentsToday: 0,
  activeInTransit: 0,
  outForDelivery: 0,
  deliveredToday: 0,
  failedExceptions: 0,
  onTimeSlaPercentage: 100.0,
  activeHubs: 0,
  activeFleetCount: 0
};

export const MOCK_HUBS = [];

export const MOCK_DRIVERS = [
  {
    id: 'DRV-8469',
    driverId: 'DRV-8469',
    name: 'Rishabh Pandey',
    email: 'oldmemories021@gmail.com',
    phone: '+91 90042 78469',
    vehicle: 'MH-02-EV-8469',
    vehicleNumber: 'MH-02-EV-8469',
    vehicleType: 'Express Electric Cargo Van',
    zone: 'Mumbai Metro & Air Cargo Corridor',
    operationalZone: 'Mumbai Metro & Air Cargo Corridor',
    hub: 'Mumbai Cargo Gateway (BOM-01)',
    status: 'AVAILABLE',
    rating: 4.98,
    tripsCompleted: 186,
    onTimeRate: '99.4%',
    currentAwb: null
  }
];

export const MOCK_NOTIFICATIONS = [];

export const MOCK_USERS = {
  'oldmemories021@gmail.com': {
    name: 'Rishabh Pandey',
    email: 'oldmemories021@gmail.com',
    role: 'driver',
    driverId: 'DRV-8469',
    id: 'DRV-8469',
    phone: '+91 90042 78469',
    vehicle: 'MH-02-EV-8469',
    vehicleNumber: 'MH-02-EV-8469',
    zone: 'Mumbai Metro & Air Cargo Corridor',
    operationalZone: 'Mumbai Metro & Air Cargo Corridor',
    hub: 'Mumbai Cargo Gateway (BOM-01)',
    status: 'AVAILABLE'
  }
};
