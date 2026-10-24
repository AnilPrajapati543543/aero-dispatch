import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  LayoutDashboard, 
  PackagePlus, 
  Search, 
  Truck, 
  ShieldCheck, 
  Layers, 
  MapPin, 
  UserCheck, 
  FileText,
  Radio
} from 'lucide-react';

export default function Sidebar() {
  const { currentRole, activeTab, setActiveTab, switchRole, shipments } = useApp();

  const inTransitCount = shipments.filter(s => s.currentStatus === 'IN_TRANSIT' || s.currentStatus === 'OUT_FOR_DELIVERY').length;

  return (
    <aside className="dashboard-sidebar">
      <div style={{ marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Active Viewport
        </div>
        <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '2px' }}>
          {currentRole === 'customer' && <LayoutDashboard size={16} color="var(--primary)" />}
          {currentRole === 'driver' && <Truck size={16} color="var(--accent-amber)" />}
          {currentRole === 'admin' && <ShieldCheck size={16} color="var(--secondary)" />}
          <span>
            {currentRole === 'customer' && 'Customer Portal'}
            {currentRole === 'driver' && 'Driver Delivery Board'}
            {currentRole === 'admin' && 'Admin Control Tower'}
          </span>
        </div>
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
        <button
          className={`btn ${activeTab === 'customer' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ justifyContent: 'flex-start', width: '100%', fontSize: '0.85rem' }}
          onClick={() => { switchRole('customer'); setActiveTab('customer'); }}
        >
          <LayoutDashboard size={16} />
          <span>Customer Dashboard</span>
        </button>

        <button
          className={`btn ${activeTab === 'admin' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ justifyContent: 'flex-start', width: '100%', fontSize: '0.85rem' }}
          onClick={() => { switchRole('admin'); setActiveTab('admin'); }}
        >
          <ShieldCheck size={16} />
          <span>Admin Dispatch Board</span>
        </button>

        <button
          className={`btn ${activeTab === 'driver' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ justifyContent: 'flex-start', width: '100%', fontSize: '0.85rem' }}
          onClick={() => { switchRole('driver'); setActiveTab('driver'); }}
        >
          <Truck size={16} />
          <span>Driver Run-Sheet</span>
        </button>

        <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '0.75rem 0' }} />

        <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0 0.5rem 0.25rem' }}>
          Operations
        </div>

        <button
          className={`btn ${activeTab === 'create-order' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ justifyContent: 'flex-start', width: '100%', fontSize: '0.85rem' }}
          onClick={() => setActiveTab('create-order')}
        >
          <PackagePlus size={16} />
          <span>Book Consignment</span>
        </button>

        <button
          className={`btn ${activeTab === 'track' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ justifyContent: 'flex-start', width: '100%', fontSize: '0.85rem' }}
          onClick={() => setActiveTab('track')}
        >
          <Search size={16} />
          <span>Live Tracking Search</span>
        </button>

        <button
          className={`btn ${activeTab === 'order-details' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ justifyContent: 'flex-start', width: '100%', fontSize: '0.85rem' }}
          onClick={() => setActiveTab('order-details')}
        >
          <FileText size={16} />
          <span>AWB Audit Inspector</span>
        </button>
      </nav>

      {/* Real-time Telemetry Health status box */}
      <div style={{ 
        marginTop: 'auto', 
        padding: '0.85rem', 
        background: 'rgba(0, 240, 255, 0.04)', 
        border: '1px solid var(--border-accent)', 
        borderRadius: 'var(--radius-md)' 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)' }}>
          <Radio size={14} className="status-dot pulse" />
          <span>Phase 1 Mock Telemetry</span>
        </div>
        <p style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '0.3rem', lineHeight: 1.3 }}>
          {inTransitCount} shipments live in transit on local client mock store.
        </p>
      </div>
    </aside>
  );
}
