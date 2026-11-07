import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import StatusBadge from '../components/StatusBadge';
import TrackingTimeline from '../components/TrackingTimeline';
import CopyButton from '../components/CopyButton';
import { 
  FileText, 
  MapPin, 
  Printer, 
  ArrowLeft, 
  Database, 
  ExternalLink,
  Copy,
  Check,
  Truck
} from 'lucide-react';

export default function OrderDetailsPage() {
  const { shipments, selectedAwb, setActiveTab, setTrackingQuery, addToast } = useApp();
  const [copied, setCopied] = useState(false);

  const shipment = shipments.find(s => s.awbNumber === selectedAwb) || shipments[0];

  if (!shipment) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
        <h3>No Shipment Selected</h3>
        <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem', marginBottom: '1.5rem' }}>
          Please select a shipment from the Customer or Admin dashboard to inspect its details.
        </p>
        <button 
          type="button"
          className="btn btn-primary" 
          onClick={() => setActiveTab('customer')}
        >
          Back to Customer Portal
        </button>
      </div>
    );
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(shipment.awbNumber);
    setCopied(true);
    addToast(`Copied AWB ${shipment.awbNumber} to clipboard`, 'info');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '1rem auto 4rem' }}>
      {/* Back button and navigation actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <button 
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => setActiveTab('customer')}
        >
          <ArrowLeft size={14} />
          <span>Back to Shipments</span>
        </button>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button 
            type="button"
            className="btn btn-outline-cyan btn-sm"
            onClick={() => {
              setTrackingQuery(shipment.awbNumber);
              setActiveTab('track');
            }}
          >
            <span>Live Tracking</span>
            <ExternalLink size={14} />
          </button>

          <button 
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => window.print()}
          >
            <Printer size={14} />
            <span>Print Shipping Label</span>
          </button>
        </div>
      </div>

      {/* Main Order Header Card */}
      <div className="card" style={{ marginBottom: '1.5rem', borderColor: 'var(--border-accent)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
              <span className="mono" style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--primary)' }}>
                {shipment.awbNumber}
              </span>
              <CopyButton text={shipment.awbNumber} />
              <StatusBadge status={shipment.currentStatus} />
              <span style={{ 
                fontSize: '0.75rem', 
                fontWeight: 700, 
                padding: '2px 8px', 
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(255, 255, 255, 0.08)',
                color: 'var(--text-muted)'
              }}>
                {shipment.serviceTier}
              </span>
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Registered on: <strong>{new Date(shipment.createdAt).toLocaleString()}</strong> • Payment Mode: <strong>{shipment.paymentMode}</strong>
            </div>
          </div>

          <div className="awb-barcode-container" style={{ padding: '0.5rem 1rem' }}>
            <div className="barcode-stripes" style={{ fontSize: '1.5rem', letterSpacing: '2px' }}>||| | |||| | |||||| || | ||</div>
            <div className="awb-number-display" style={{ fontSize: '0.75rem' }}>{shipment.awbNumber}</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
        {/* Sender Origin Dossier */}
        <div className="card">
          <h2 style={{ fontSize: '1.05rem', color: 'var(--primary)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <MapPin size={16} />
            <span>Sender (Origin Details)</span>
          </h2>

          <div style={{ fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <div><strong>Company / Name:</strong> {shipment.sender?.name}</div>
            <div><strong>Warehouse Facility:</strong> {shipment.sender?.facility || 'Aerocity Express Terminal'}</div>
            <div><strong>Address:</strong> {shipment.sender?.address}</div>
            <div><strong>Location:</strong> {shipment.sender?.city}, {shipment.sender?.state} - {shipment.sender?.pinCode}</div>
            <div><strong>Contact Phone:</strong> {shipment.sender?.phone}</div>
          </div>
        </div>

        {/* Recipient Destination Dossier */}
        <div className="card">
          <h2 style={{ fontSize: '1.05rem', color: 'var(--accent-amber)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Truck size={16} />
            <span>Recipient (Delivery Details)</span>
          </h2>

          <div style={{ fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <div><strong>Recipient:</strong> {shipment.recipient?.name}</div>
            <div><strong>Street Address:</strong> {shipment.recipient?.address}</div>
            <div><strong>City &amp; PIN:</strong> {shipment.recipient?.city}, {shipment.recipient?.state} - {shipment.recipient?.pinCode}</div>
            <div><strong>Mobile Phone:</strong> {shipment.recipient?.phone}</div>
            <div><strong>Commercial Declared:</strong> ₹{shipment.declaredValue?.toLocaleString()} ({shipment.paymentMode})</div>
          </div>
        </div>
      </div>

      {/* Package Specs & Milestone Audit */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
        <div className="card">
          <h2 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText size={18} color="var(--primary)" />
            <span>Shipment Progress History</span>
          </h2>

          <TrackingTimeline events={shipment.events || []} currentStatus={shipment.currentStatus} />
        </div>

        {/* Architectural Inspector Panel: Data model design */}
        <div className="card" style={{ borderColor: 'var(--border-medium)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <Database size={18} color="var(--primary)" />
            <h2 style={{ fontSize: '1rem', color: 'var(--text-main)' }}>Serverless Data Model Mapping</h2>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '1rem', lineHeight: 1.5 }}>
            Shipment schema engineered for high-throughput <strong>Cloud Database Design</strong>:
          </p>

          <div style={{ 
            background: 'rgba(255, 255, 255, 0.03)', 
            border: '1px solid var(--border-subtle)', 
            borderRadius: 'var(--radius-sm)', 
            padding: '0.75rem',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.75rem',
            color: 'var(--text-highlight)',
            marginBottom: '1rem'
          }}>
            <div><strong>PK:</strong> ORDER#{shipment.awbNumber}</div>
            <div><strong>SK:</strong> METADATA</div>
            <div><strong>GSI1-PK:</strong> STATUS#{shipment.currentStatus}</div>
            <div><strong>GSI1-SK:</strong> {shipment.createdAt}</div>
            <div><strong>Data Model:</strong> Decimal({shipment.weightKg} kg), {shipment.events?.length || 0} Milestones</div>
          </div>

          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', lineHeight: 1.5 }}>
            <div style={{ marginBottom: '0.5rem' }}>
              🔒 <strong>Proof of Delivery:</strong> Encrypted proof photos verified by AI and saved to cloud vault.
            </div>
            <div>
              📡 <strong>Delivery Tracking:</strong> Automatic updates broadcasting delivery progress.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
