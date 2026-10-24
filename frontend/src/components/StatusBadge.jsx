import React from 'react';

const STATUS_CONFIG = {
  BOOKED: { label: 'Booked / Manifested', className: 'booked', pulse: false },
  PICKED_UP: { label: 'Picked Up', className: 'picked_up', pulse: true },
  HUB_INBOUND: { label: 'At Hub Sorting', className: 'hub_inbound', pulse: true },
  IN_TRANSIT: { label: 'In Transit', className: 'in_transit', pulse: true },
  OUT_FOR_DELIVERY: { label: 'Out for Delivery', className: 'out_for_delivery', pulse: true },
  DELIVERED: { label: 'Delivered', className: 'delivered', pulse: false },
  FAILED_ATTEMPT: { label: 'Attempt Failed', className: 'failed_attempt', pulse: false },
};

export default function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || {
    label: status ? status.replace('_', ' ') : 'Pending',
    className: 'booked',
    pulse: false
  };

  return (
    <span className={`status-badge ${config.className}`}>
      <span className={`status-dot ${config.pulse ? 'pulse' : ''}`}></span>
      {config.label}
    </span>
  );
}
