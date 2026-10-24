import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import MetricCard from '../components/MetricCard';
import StatusBadge from '../components/StatusBadge';
import { 
  Package, 
  Truck, 
  CheckCircle2, 
  CreditCard, 
  PlusCircle, 
  Search, 
  ExternalLink, 
  ArrowRight,
  Filter
} from 'lucide-react';

export default function CustomerDashboard() {
  const { shipments, setActiveTab, setSelectedAwb, setTrackingQuery, currentUser } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Customer metrics
  const totalShipments = shipments.length;
  const inTransitCount = shipments.filter(s => ['PICKED_UP', 'HUB_INBOUND', 'IN_TRANSIT'].includes(s.currentStatus)).length;
  const outForDeliveryCount = shipments.filter(s => s.currentStatus === 'OUT_FOR_DELIVERY').length;
  const deliveredCount = shipments.filter(s => s.currentStatus === 'DELIVERED').length;

  const filteredShipments = shipments.filter(ship => {
    const matchesSearch = 
      ship.awbNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ship.recipient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ship.recipient.city.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = 
      statusFilter === 'ALL' ||
      (statusFilter === 'IN_TRANSIT' && ['PICKED_UP', 'HUB_INBOUND', 'IN_TRANSIT'].includes(ship.currentStatus)) ||
      ship.currentStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div>
      {/* Header bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>Customer Logistics Portal</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Welcome back, <strong>{currentUser?.name || 'Customer'}</strong> • Account: <code>{currentUser?.tier || 'Enterprise'}</code>
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button 
            className="btn btn-primary"
            onClick={() => setActiveTab('create-order')}
          >
            <PlusCircle size={16} />
            <span>Create New Shipment</span>
          </button>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid-cols-4" style={{ marginBottom: '2rem' }}>
        <MetricCard 
          title="Total Consignments" 
          value={totalShipments} 
          icon={Package}
          subtitle="All active & archive orders"
        />
        <MetricCard 
          title="In Transit / Linehaul" 
          value={inTransitCount} 
          icon={Truck}
          trend="+12% this week"
          trendDirection="up"
        />
        <MetricCard 
          title="Out for Delivery" 
          value={outForDeliveryCount} 
          icon={Truck}
          subtitle="Assigned to local drivers"
        />
        <MetricCard 
          title="Delivered Successfully" 
          value={deliveredCount} 
          icon={CheckCircle2}
          trend="99.2% on-time"
          trendDirection="up"
        />
      </div>

      {/* Main Shipments Table Card */}
      <div className="card">
        {/* Table Filters & Search */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ position: 'relative', width: '320px', maxWidth: '100%' }}>
            <Search size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
            <input 
              type="text" 
              placeholder="Search AWB, Recipient, City..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input"
              style={{ paddingLeft: '2.5rem', paddingBottom: '0.5rem', paddingTop: '0.5rem', fontSize: '0.85rem' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <Filter size={15} color="var(--text-dim)" />
            <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontWeight: 600 }}>Filter:</span>
            {['ALL', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED'].map((st) => (
              <button
                key={st}
                className={`btn btn-sm ${statusFilter === st ? 'btn-outline-cyan' : 'btn-secondary'}`}
                style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
                onClick={() => setStatusFilter(st)}
              >
                {st.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Orders Table */}
        <div className="table-container">
          <table className="logistics-table">
            <thead>
              <tr>
                <th>AWB Tracking ID</th>
                <th>Service &amp; Mode</th>
                <th>Recipient &amp; Address</th>
                <th>Status</th>
                <th>Weight</th>
                <th>Current Hub</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredShipments.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    No shipments found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredShipments.map(ship => (
                  <tr key={ship.awbNumber}>
                    <td>
                      <div 
                        className="mono" 
                        style={{ fontWeight: 700, color: 'var(--primary)', cursor: 'pointer' }}
                        onClick={() => {
                          setSelectedAwb(ship.awbNumber);
                          setActiveTab('order-details');
                        }}
                      >
                        {ship.awbNumber}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>{ship.category}</div>
                    </td>

                    <td>
                      <div style={{ fontWeight: 600, fontSize: '0.825rem' }}>{ship.serviceTier}</div>
                      <span style={{ 
                        fontSize: '0.7rem', 
                        padding: '1px 5px', 
                        borderRadius: '3px',
                        background: ship.paymentMode === 'Prepaid' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                        color: ship.paymentMode === 'Prepaid' ? '#10B981' : '#F59E0B'
                      }}>
                        {ship.paymentMode} (₹{ship.declaredValue.toLocaleString()})
                      </span>
                    </td>

                    <td>
                      <div style={{ fontWeight: 600 }}>{ship.recipient.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                        {ship.recipient.city}, {ship.recipient.state} ({ship.recipient.pinCode})
                      </div>
                    </td>

                    <td>
                      <StatusBadge status={ship.currentStatus} />
                    </td>

                    <td className="mono" style={{ fontSize: '0.85rem' }}>
                      {ship.weightKg} kg
                    </td>

                    <td style={{ fontSize: '0.825rem' }}>
                      {ship.currentLocation}
                    </td>

                    <td>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button
                          className="btn btn-sm btn-outline-cyan"
                          title="Track Live Milestones"
                          onClick={() => {
                            setSelectedAwb(ship.awbNumber);
                            setTrackingQuery(ship.awbNumber);
                            setActiveTab('track');
                          }}
                        >
                          <span>Track</span>
                        </button>
                        <button
                          className="btn btn-sm btn-secondary"
                          title="View Full Consignment Specifications"
                          onClick={() => {
                            setSelectedAwb(ship.awbNumber);
                            setActiveTab('order-details');
                          }}
                        >
                          <ExternalLink size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
