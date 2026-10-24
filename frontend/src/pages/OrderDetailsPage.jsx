import React from 'react';
import { useApp } from '../context/AppContext';
import StatusBadge from '../components/StatusBadge';
import TrackingTimeline from '../components/TrackingTimeline';
import { 
  FileText, 
  MapPin, 
  Package, 
  Printer, 
  ArrowLeft, 
  Database, 
  Server, 
  Layers, 
  ShieldCheck,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';

export default function OrderDetailsPage() {
  const { shipments, selectedAwb, setActiveTab, setSelectedAwb, setTrackingQuery } = useApp();

  const shipment = shipments.find(s => s.awbNumber === selectedAwb) || shipments[0];

  if (!shipment) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
        <h3>No Consignment Selected</h3>
        <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => setActiveTab('customer')}>
          Back to Customer Portal
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1100px', margin: '1rem auto 4rem' }}>
      {/* Back button and title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <button 
          className="btn btn-secondary btn-sm"
          onClick={() => setActiveTab('customer')}
        >
          <ArrowLeft size={14} />
          <span>Back to Consignment List</span>
        </button>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button 
            className="btn btn-outline-cyan btn-sm"
            onClick={() => {
              setTrackingQuery(shipment.awbNumber);
              setActiveTab('track');
            }}
          >
            <span>Track Milestones</span>
            <ExternalLink size={14} />
          </button>

          <button 
            className="btn btn-secondary btn-sm"
            onClick={() => window.print()}
          >
            <Printer size={14} />
            <span>Print Manifest Label</span>
          </button>
        </div>
      </div>

      {/* Main Order Header Card */}
      <div className="card" style={{ marginBottom: '1.5rem', borderColor: 'var(--border-accent)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <span className="mono" style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--primary)' }}>
                {shipment.awbNumber}
              </span>
              <StatusBadge status={shipment.currentStatus} />
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Registered on: <strong>{new Date(shipment.createdAt).toLocaleString()}</strong> • Service: <strong>{shipment.serviceTier}</strong>
            </div>
          </div>

          <div className="awb-barcode-container" style={{ padding: '0.5rem 1rem' }}>
            <div className="barcode-stripes" style={{ fontSize: '1.5rem', letterSpacing: '2px' }}>||| | |||| | |||||| || | ||</div>
            <div className="awb-number-display" style={{ fontSize: '0.75rem' }}>{shipment.awbNumber}</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        {/* Consignor Origin Dossier */}
        <div className="card">
          <h3 style={{ fontSize: '1.05rem', color: 'var(--primary)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <MapPin size={16} />
            <span>Consignor (Origin Details)</span>
          </h3>

          <div style={{ fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <div><strong>Company / Name:</strong> {shipment.sender.name}</div>
            <div><strong>Facility:</strong> {shipment.sender.facility}</div>
            <div><strong>Address:</strong> {shipment.sender.address}</div>
            <div><strong>Location:</strong> {shipment.sender.city}, {shipment.sender.state} - {shipment.sender.pinCode}</div>
            <div><strong>Contact:</strong> {shipment.sender.phone}</div>
          </div>
        </div>

        {/* Consignee Destination Dossier */}
        <div className="card">
          <h3 style={{ fontSize: '1.05rem', color: 'var(--accent-amber)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <MapPin size={16} />
            <span>Consignee (Delivery Details)</span>
          </h3>

          <div style={{ fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <div><strong>Recipient:</strong> {shipment.recipient.name}</div>
            <div><strong>Street Address:</strong> {shipment.recipient.address}</div>
            <div><strong>City &amp; PIN:</strong> {shipment.recipient.city}, {shipment.recipient.state} - {shipment.recipient.pinCode}</div>
            <div><strong>Mobile Phone:</strong> {shipment.recipient.phone}</div>
            <div><strong>Payment Mode:</strong> {shipment.paymentMode} (Declared: ₹{shipment.declaredValue.toLocaleString()})</div>
          </div>
        </div>
      </div>

      {/* Package Specs & Milestone Audit */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        <div className="card">
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText size={18} color="var(--primary)" />
            <span>Consignment Audit Trail (Reverse Chronological)</span>
          </h3>

          <TrackingTimeline events={shipment.events} currentStatus={shipment.currentStatus} />
        </div>

        {/* Architectural Inspector Panel: How AWS will power this in Phase 3 */}
        <div className="card" style={{ background: 'rgba(7, 11, 20, 0.95)', borderColor: 'var(--border-medium)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <Database size={18} color="var(--primary)" />
            <h3 style={{ fontSize: '1rem', color: '#FFFFFF' }}>AWS Serverless Mapping</h3>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '1rem', lineHeight: 1.5 }}>
            This consignment data model is specifically engineered for Phase 3 <strong>Amazon DynamoDB Single-Table Design</strong>:
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
            <div><strong>Boto3 Model:</strong> Decimal(weight), Dict(events)</div>
          </div>

          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', lineHeight: 1.5 }}>
            <div style={{ marginBottom: '0.5rem' }}>
              🔒 <strong>Proof of Delivery:</strong> S3 Bucket <code>aerodispatch-pod-private</code> via presigned upload URL (Phase 5).
            </div>
            <div>
              📡 <strong>Live Telemetry:</strong> WebSocket connection broadcasting AWB location to active dispatchers.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
