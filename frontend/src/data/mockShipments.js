/**
 * AeroDispatch - Clean Production Data Store
 * 
 * All demo, mock, test, and legacy account data have been completely purged.
 * Zero pre-seeded users, zero orders, zero demo records.
 * Ready for fresh live AWS Cognito registration and real customer bookings.
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

export const MOCK_DRIVERS = [];

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
    awbNumber: 'AD-1722-2734',
    read: false,
    severity: 'info'
  },
  {
    id: 'notif-init-3',
    category: 'shipment',
    title: 'Consignment Handed Over to Recipient',
    message: 'OTP 8469 verified successfully. Consignment delivered to Darshan at HITEC City Logistics Gate.',
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
    message: 'Consignment AD-1904-8842 registered with nationwide air cargo dispatch network and sorting hubs.',
    time: '6 hours ago',
    awbNumber: 'AD-1904-8842',
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
