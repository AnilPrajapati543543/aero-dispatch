import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Send, 
  Search, 
  Truck, 
  ShieldCheck, 
  Zap, 
  MapPin, 
  Clock, 
  Layers, 
  ArrowRight, 
  Package, 
  BarChart3,
  CheckCircle2,
  Box
} from 'lucide-react';
import StatusBadge from '../components/StatusBadge';

export default function LandingPage() {
  const { 
    setActiveTab, 
    setSelectedAwb, 
    setTrackingQuery, 
    switchRole, 
    shipments,
    addToast 
  } = useApp();

  const [searchVal, setSearchVal] = useState('');

  const handleTrackSubmit = (e) => {
    e.preventDefault();
    if (!searchVal.trim()) {
      addToast('Please enter an AWB tracking number', 'warning');
      return;
    }
    setTrackingQuery(searchVal.trim());
    setSelectedAwb(searchVal.trim());
    setActiveTab('track');
  };

  const sampleAwbs = shipments.slice(0, 3).map(s => ({ awb: s.awbNumber, status: s.currentStatus, city: s.recipient.city }));

  return (
    <div style={{ paddingBottom: '4rem' }}>
      {/* Hero Section */}
      <section style={{
        padding: '4rem 1.5rem 3rem',
        maxWidth: '1200px',
        margin: '0 auto',
        textAlign: 'center'
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '4px 14px',
          borderRadius: 'var(--radius-full)',
          background: 'rgba(0, 240, 255, 0.08)',
          border: '1px solid rgba(0, 240, 255, 0.25)',
          color: 'var(--primary)',
          fontSize: '0.8rem',
          fontWeight: 700,
          marginBottom: '1.5rem'
        }}>
          <Zap size={14} />
          <span>PHASE 1 LOCAL PREVIEW • SERVERLESS ARCHITECTURE</span>
        </div>

        <h1 style={{
          fontSize: 'clamp(2.5rem, 5vw, 4rem)',
          fontWeight: 800,
          lineHeight: 1.15,
          marginBottom: '1.25rem',
          background: 'linear-gradient(180deg, #FFFFFF 30%, #94A3B8 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Smart Logistics &amp; Real-Time <br />
          <span style={{ color: 'var(--primary)', WebkitTextFillColor: 'var(--primary)' }}>Dispatch Telemetry</span>
        </h1>

        <p style={{
          fontSize: '1.15rem',
          color: 'var(--text-muted)',
          maxWidth: '720px',
          margin: '0 auto 2.5rem',
          lineHeight: 1.6
        }}>
          AeroDispatch powers mission-critical supply chains with sub-second AWB milestone tracking, 
          automated linehaul dispatch, and digital proof-of-delivery workflows inspired by modern logistics giants.
        </p>

        {/* Central AWB Tracking Form */}
        <div style={{
          maxWidth: '680px',
          margin: '0 auto 1.5rem',
          background: 'var(--bg-card)',
          padding: '0.75rem',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border-accent)',
          boxShadow: 'var(--shadow-glow)',
          backdropFilter: 'blur(16px)'
        }}>
          <form onSubmit={handleTrackSubmit} style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 300px', position: 'relative' }}>
              <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
              <input 
                type="text" 
                placeholder="Enter Consignment AWB (e.g. AD-8849-2041)..."
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '0.85rem 1rem 0.85rem 2.75rem',
                  color: '#FFFFFF',
                  fontSize: '0.95rem',
                  fontFamily: 'var(--font-mono)'
                }}
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ padding: '0.85rem 1.75rem', fontSize: '0.95rem' }}>
              <span>Track Consignment</span>
              <ArrowRight size={16} />
            </button>
          </form>

          {/* Quick Click Samples */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.75rem', padding: '0 0.5rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 600 }}>Quick sample AWBs:</span>
            {sampleAwbs.map(item => (
              <button
                key={item.awb}
                onClick={() => {
                  setSearchVal(item.awb);
                  setTrackingQuery(item.awb);
                  setSelectedAwb(item.awb);
                  setActiveTab('track');
                }}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '2px 8px',
                  color: 'var(--primary)',
                  fontSize: '0.75rem',
                  fontFamily: 'var(--font-mono)',
                  cursor: 'pointer'
                }}
              >
                {item.awb} ({item.city})
              </button>
            ))}
          </div>
        </div>

        {/* Action Button Tiers */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap', marginTop: '2rem' }}>
          <button 
            className="btn btn-primary"
            onClick={() => setActiveTab('create-order')}
          >
            <Package size={16} />
            <span>Book New Shipment</span>
          </button>

          <button 
            className="btn btn-secondary"
            onClick={() => { switchRole('customer'); setActiveTab('customer'); }}
          >
            <span>Customer Portal</span>
          </button>

          <button 
            className="btn btn-secondary"
            onClick={() => { switchRole('driver'); setActiveTab('driver'); }}
          >
            <Truck size={16} />
            <span>Driver Run-Sheet</span>
          </button>

          <button 
            className="btn btn-secondary"
            onClick={() => { switchRole('admin'); setActiveTab('admin'); }}
          >
            <ShieldCheck size={16} />
            <span>Admin Control Tower</span>
          </button>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section style={{ maxWidth: '1200px', margin: '3rem auto 0', padding: '0 1.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>Enterprise Core Capabilities</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Built specifically to reflect real-world logistics standards, sorting topologies, and driver dispatch manifests.
          </p>
        </div>

        <div className="grid-cols-3">
          <div className="card card-accent-border">
            <div style={{ width: '42px', height: '42px', borderRadius: 'var(--radius-md)', background: 'rgba(0, 240, 255, 0.1)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
              <Clock size={20} />
            </div>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Delhivery-Style Milestones</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: 1.6 }}>
              Full audit trail: Manifested, Picked Up, Hub Inbound Scans, Air/Surface Linehaul transit, Out for Delivery, and Doorstep Handover.
            </p>
          </div>

          <div className="card card-accent-border" style={{ borderTopColor: 'var(--secondary)' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: 'var(--radius-md)', background: 'rgba(99, 102, 241, 0.1)', color: 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
              <Layers size={20} />
            </div>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Role-Based Dashboards</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: 1.6 }}>
              Seamlessly toggle between Merchant Customers, On-Field Delivery Drivers, and Central Logistics Administrators.
            </p>
          </div>

          <div className="card card-accent-border" style={{ borderTopColor: 'var(--accent-emerald)' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: 'var(--radius-md)', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
              <ShieldCheck size={20} />
            </div>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>AWS Serverless Ready</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: 1.6 }}>
              Architected for Amazon DynamoDB, Python Boto3 Lambdas, S3 Presigned Photo Proofs, and EventBridge event notifications.
            </p>
          </div>
        </div>
      </section>

      {/* Live Sample Shipments Quick View */}
      <section style={{ maxWidth: '1200px', margin: '4rem auto 0', padding: '0 1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h2 style={{ fontSize: '1.35rem' }}>Active Live Network Shipments</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Sample consignments active in Phase 1 mock store</p>
          </div>
          <button 
            className="btn btn-secondary btn-sm"
            onClick={() => { switchRole('customer'); setActiveTab('customer'); }}
          >
            <span>View All in Dashboard</span>
            <ArrowRight size={14} />
          </button>
        </div>

        <div className="table-container">
          <table className="logistics-table">
            <thead>
              <tr>
                <th>AWB Number</th>
                <th>Service</th>
                <th>Route (Origin &rarr; Destination)</th>
                <th>Status</th>
                <th>Current Hub Location</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {shipments.slice(0, 4).map(ship => (
                <tr key={ship.awbNumber}>
                  <td>
                    <div className="mono" style={{ fontWeight: 700, color: 'var(--primary)' }}>
                      {ship.awbNumber}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{ship.category}</div>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{ship.serviceTier}</span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{ship.sender.city} &rarr; {ship.recipient.city}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Weight: {ship.weightKg} kg</div>
                  </td>
                  <td>
                    <StatusBadge status={ship.currentStatus} />
                  </td>
                  <td>
                    <div style={{ fontSize: '0.825rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <MapPin size={13} color="var(--primary)" />
                      <span>{ship.currentLocation}</span>
                    </div>
                  </td>
                  <td>
                    <button
                      className="btn btn-sm btn-outline-cyan"
                      onClick={() => {
                        setSelectedAwb(ship.awbNumber);
                        setTrackingQuery(ship.awbNumber);
                        setActiveTab('track');
                      }}
                    >
                      <span>Track</span>
                      <ArrowRight size={12} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
