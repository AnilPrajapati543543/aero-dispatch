import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import MetricCard from '../components/MetricCard';
import StatusBadge from '../components/StatusBadge';
import { 
  ShieldCheck, 
  Truck, 
  AlertTriangle, 
  Building2, 
  Activity, 
  RefreshCw, 
  UserCheck, 
  Sliders, 
  MapPin,
  Clock,
  Send
} from 'lucide-react';

export default function AdminDashboard() {
  const { shipments, hubs, drivers, metrics, updateShipmentStatus, setSelectedAwb, setActiveTab, addToast } = useApp();
  const [selectedAwbToEdit, setSelectedAwbToEdit] = useState('');
  const [statusToApply, setStatusToApply] = useState('IN_TRANSIT');
  const [statusNotes, setStatusNotes] = useState('');

  const handleAdminStatusOverride = (e) => {
    e.preventDefault();
    if (!selectedAwbToEdit) {
      addToast('Please select a shipment to update.', 'warning');
      return;
    }
    updateShipmentStatus(selectedAwbToEdit, statusToApply, statusNotes || 'Admin manual override applied from Central Command Tower');
    setStatusNotes('');
  };

  const exceptions = shipments.filter(s => s.currentStatus === 'FAILED_ATTEMPT');

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <h1 style={{ fontSize: '1.75rem' }}>Logistics Control Tower</h1>
            <span style={{ 
              background: 'rgba(99, 102, 241, 0.15)', 
              color: '#818CF8', 
              border: '1px solid rgba(99, 102, 241, 0.3)', 
              fontSize: '0.7rem', 
              fontWeight: 800, 
              padding: '2px 8px', 
              borderRadius: 'var(--radius-sm)' 
            }}>
              NATIONWIDE DISPATCH
            </span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Central operations, nationwide linehaul sorting hubs, and fleet telemetry.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span className="status-dot pulse" style={{ background: 'var(--accent-emerald)' }}></span>
            Telemetry Stream Live
          </span>
        </div>
      </div>

      {/* High-level KPIs */}
      <div className="grid-cols-4" style={{ marginBottom: '2rem' }}>
        <MetricCard 
          title="Daily Network Volume" 
          value={metrics.totalShipmentsToday.toLocaleString()} 
          icon={Activity}
          trend="+8.2% vs yesterday"
          trendDirection="up"
        />
        <MetricCard 
          title="Linehaul In Transit" 
          value={metrics.activeInTransit.toLocaleString()} 
          icon={Truck}
          subtitle="42 Interstate Convoys"
        />
        <MetricCard 
          title="National SLA Compliance" 
          value={`${metrics.onTimeSlaPercentage}%`} 
          icon={ShieldCheck}
          trend="+0.3% this month"
          trendDirection="up"
        />
        <MetricCard 
          title="Delivery Exceptions" 
          value={exceptions.length} 
          icon={AlertTriangle}
          trend="Action required"
          trendDirection="down"
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Hub Operations Monitoring */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Building2 size={18} color="var(--primary)" />
              <span>Gateway Sorting Facilities &amp; Hub Health</span>
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>4 Primary Gateways</span>
          </div>

          <div className="table-container">
            <table className="logistics-table">
              <thead>
                <tr>
                  <th>Hub / Sorting Terminal</th>
                  <th>Location</th>
                  <th>Current Bag Volume</th>
                  <th>Optical Sorter Load</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {hubs.map(hub => (
                  <tr key={hub.id}>
                    <td>
                      <div style={{ fontWeight: 700, color: '#FFFFFF' }}>{hub.name}</div>
                      <div className="mono" style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>{hub.id}</div>
                    </td>
                    <td>{hub.city}</td>
                    <td className="mono" style={{ fontWeight: 600 }}>{hub.inTransit} bags</td>
                    <td style={{ minWidth: '130px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ flex: 1, height: '6px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ 
                            width: `${hub.capacityUsage}%`, 
                            height: '100%', 
                            background: hub.capacityUsage > 90 ? 'var(--accent-rose)' : hub.capacityUsage > 80 ? 'var(--accent-amber)' : 'var(--primary)' 
                          }}></div>
                        </div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>{hub.capacityUsage}%</span>
                      </div>
                    </td>
                    <td>
                      <span style={{ 
                        fontSize: '0.75rem', 
                        fontWeight: 700, 
                        color: hub.status === 'Optimal' ? 'var(--accent-emerald)' : 'var(--accent-amber)' 
                      }}>
                        {hub.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Live Admin Dispatch Override Tool */}
        <div className="card" style={{ borderColor: 'var(--border-accent)' }}>
          <h3 style={{ fontSize: '1.05rem', color: 'var(--primary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Sliders size={16} />
            <span>Telemetry Status Override</span>
          </h3>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
            Simulate an automated hub scan or manual delivery override across the network:
          </p>

          <form onSubmit={handleAdminStatusOverride}>
            <div className="form-group">
              <label className="form-label">Select Target AWB</label>
              <select
                className="form-select"
                value={selectedAwbToEdit}
                onChange={(e) => setSelectedAwbToEdit(e.target.value)}
                required
              >
                <option value="">-- Choose Shipment AWB --</option>
                {shipments.map(s => (
                  <option key={s.awbNumber} value={s.awbNumber}>
                    {s.awbNumber} ({s.recipient.city} - {s.currentStatus})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">New Milestone Status</label>
              <select
                className="form-select"
                value={statusToApply}
                onChange={(e) => setStatusToApply(e.target.value)}
              >
                <option value="PICKED_UP">PICKED_UP (Origin Pickup)</option>
                <option value="HUB_INBOUND">HUB_INBOUND (Gateway Sorter)</option>
                <option value="IN_TRANSIT">IN_TRANSIT (Linehaul Flight/Truck)</option>
                <option value="OUT_FOR_DELIVERY">OUT_FOR_DELIVERY (Last-Mile Courier)</option>
                <option value="DELIVERED">DELIVERED (Proof Handover Complete)</option>
                <option value="FAILED_ATTEMPT">FAILED_ATTEMPT (Delivery Exception)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Telemetry Log Note</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Optical sorting scan at Terminal Bay 12"
                value={statusNotes}
                onChange={(e) => setStatusNotes(e.target.value)}
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
              <Send size={15} />
              <span>Broadcast Telemetry Update</span>
            </button>
          </form>

          <div style={{ marginTop: '1rem', fontSize: '0.72rem', color: 'var(--text-dim)', textAlign: 'center' }}>
            ⚡ <em>In Phase 5, this will trigger an EventBridge event to notify the consignee.</em>
          </div>
        </div>
      </div>

      {/* Exception Management & Active Network Table */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1.1rem' }}>Active Consignment Registry</h3>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{shipments.length} total active consignments</span>
        </div>

        <div className="table-container">
          <table className="logistics-table">
            <thead>
              <tr>
                <th>AWB</th>
                <th>Sender</th>
                <th>Consignee</th>
                <th>Status</th>
                <th>Assigned Courier</th>
                <th>Latest Milestone Note</th>
                <th>Inspect</th>
              </tr>
            </thead>
            <tbody>
              {shipments.map(ship => (
                <tr key={ship.awbNumber}>
                  <td className="mono" style={{ fontWeight: 700, color: 'var(--primary)' }}>
                    {ship.awbNumber}
                  </td>
                  <td>
                    <div>{ship.sender.name}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>{ship.sender.city}</div>
                  </td>
                  <td>
                    <div>{ship.recipient.name}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>{ship.recipient.city}</div>
                  </td>
                  <td>
                    <StatusBadge status={ship.currentStatus} />
                  </td>
                  <td>
                    {ship.assignedDriver ? (
                      <div>
                        <div style={{ fontWeight: 600 }}>{ship.assignedDriver.name}</div>
                        <div className="mono" style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>{ship.assignedDriver.vehicleNumber}</div>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>Unassigned Linehaul</span>
                    )}
                  </td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)', maxWidth: '240px' }}>
                    {ship.events[ship.events.length - 1]?.notes || 'No events'}
                  </td>
                  <td>
                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={() => {
                        setSelectedAwb(ship.awbNumber);
                        setActiveTab('order-details');
                      }}
                    >
                      Audit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
