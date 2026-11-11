/**
 * AeroDispatch - Authentic User Consignments & Operations Store
 * 
 * Clean slate state: All demo/test consignments removed.
 * Ready for real-time user accounts and live bookings.
 */

export const MASTER_ADMIN_SHIPMENTS = [];

export const MOCK_SHIPMENTS = MASTER_ADMIN_SHIPMENTS;

export const MASTER_ADMIN_METRICS = {
  totalShipmentsToday: 0,
  activeInTransit: 0,
  outForDelivery: 0,
  deliveredToday: 0,
  failedExceptions: 0,
  onTimeSlaPercentage: 100.0,
  activeHubs: 0,
  activeFleetCount: 0
};
export const MOCK_ADMIN_METRICS = MASTER_ADMIN_METRICS;

export const MASTER_ADMIN_HUBS = [];
export const MOCK_HUBS = MASTER_ADMIN_HUBS;

export const MASTER_ADMIN_DRIVERS = [];
export const MOCK_DRIVERS = MASTER_ADMIN_DRIVERS;

export const MOCK_NOTIFICATIONS = [];

export const MOCK_USERS = {};
