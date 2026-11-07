import React from 'react';
import { Clock, AlertCircle, PackageCheck, Truck, Send, MapPin } from 'lucide-react';

export default function TrackingTimeline({ events = [] }) {
  if (!events || events.length === 0) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        No tracking milestones recorded yet for this consignment.
      </div>
    );
  }

  // Helper to pick appropriate status icon
  const getIcon = (status) => {
    switch (status) {
      case 'DELIVERED':
        return <PackageCheck size={14} color="currentColor" />;
      case 'OUT_FOR_DELIVERY':
      case 'IN_TRANSIT':
        return <Truck size={14} color="currentColor" />;
      case 'PICKED_UP':
      case 'HUB_INBOUND':
        return <Send size={14} color="currentColor" />;
      case 'FAILED_ATTEMPT':
        return <AlertCircle size={14} color="currentColor" />;
      default:
        return <Clock size={14} color="currentColor" />;
    }
  };

  // Reverse so newest is at the top (Delhivery-style latest update on top)
  const sortedEvents = [...events].reverse();

  return (
    <div className="timeline-stepper">
      {sortedEvents.map((ev, index) => {
        const isLatest = index === 0;
        const isDelivered = ev.status === 'DELIVERED';
        const isFailed = ev.status === 'FAILED_ATTEMPT';

        let stepClass = 'completed';
        if (isLatest && !isDelivered && !isFailed) {
          stepClass = 'current';
        } else if (isFailed) {
          stepClass = 'failed';
        }

        return (
          <div key={ev.id || index} className={`timeline-step ${stepClass}`}>
            <div className="timeline-marker">
              {getIcon(ev.status)}
            </div>

            <div className="timeline-content">
              <div className="timeline-header">
                <span className="timeline-title">{ev.title || ev.status}</span>
                <span className="timeline-time">{ev.timestamp}</span>
              </div>

              {ev.location && (
                <div className="timeline-location">
                  <MapPin size={13} />
                  <span>{ev.location}</span>
                </div>
              )}

              {ev.notes && (
                <div className="timeline-notes">
                  {ev.notes}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
