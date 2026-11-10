/**
 * AeroDispatch - Clean Operational Stores
 * 
 * Zero pre-seeded demo records or mock shipments.
 * The system exclusively uses actual data created by the user.
 */

export const MOCK_SHIPMENTS = [];
export const MASTER_ADMIN_SHIPMENTS = [];

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
export const MASTER_ADMIN_METRICS = MOCK_ADMIN_METRICS;

export const MOCK_HUBS = [];
export const MASTER_ADMIN_HUBS = [];

export const MOCK_DRIVERS = [];
export const MASTER_ADMIN_DRIVERS = [];

export const MOCK_NOTIFICATIONS = [];

export const MOCK_USERS = {};
