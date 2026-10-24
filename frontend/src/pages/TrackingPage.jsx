import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import StatusBadge from '../components/StatusBadge';
import TrackingTimeline from '../components/TrackingTimeline';
import { 
  Search, 
  MapPin, 
  Truck, 
  Package, 
  Calendar, 
  Clock, 
  User, 
  Phone, 
  CheckCircle2, 
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Share2
} from 'lucide-react';

export default function TrackingPage() {
  const { 
    shipments, 
    selectedAwb, 
    setSelectedAwb, 
    trackingQuery, 
    setTrackingQuery, 
    setActiveTab, 
    addToast 
  } = useApp();

  const [inputVal, setInputVal] = useState(trackingQuery || selectedAwb || 'AD-8849-2041');

  useEffect(() => {
    if (trackingQuery) {
      setInputVal(trackingQuery);
    }
  }, [trackingQuery]);

  const activeShipment = shipments.find(s => 
    s.awbNumber.toLowerCase() === inputVal.trim().toLowerCase()
  ) || shipments[0];

  const handleSearch = (e) => {
    e.preventDefault();
    const query = inputVal.trim();
    if (!query) {
      addToast('Please enter an AWB number', 'warning');
      return;
    }
    const found = shipments.find(s => s.awbNumber.toLowerCase() === query.toLowerCase());
    if (found) {
      setSelectedAwb(found.awbNumber);
      setTrackingQuery(found.awbNumber);
      addToast(`Located consignment: ${found.awbNumber}`, 'success');
    } else {
      addToast(`AWB "${query}" not found in current mock database. Try sample: AD-8849-2041`, 'warning');
    }
  };

  // Horizontal milestone stages calculation
  const getStageIndex = (status) => {
    switch (status) {
      case 'BOOKED': return 0;
      case 'PICKED_UP': return 1;
      case 'HUB_INBOUND': return 2;
      case 'IN_TRANSIT': return 3;
      case 'OUT_FOR_DELIVERY': return 4;
      case 'DELIVERED': return 5;
      case 'FAILED_ATTEMPT': return 4;
      default: return 0;
    }
  };

  const currentStageIndex = getStageIndex(activeShipment?.currentStatus);
  const stages = [
    { label: 'Booked', icon: Package },
    { label: 'Picked Up', icon: Clock },
    { label: 'At Hub', icon: MapPin },
    { label: 'In Transit', icon: Truck },
    { label: 'Out for Delivery', icon: Truck },
    { label: 'Delivered', icon: CheckCircle2 }
  ];

  return (
    <div style={{ maxWidth: '1050px', margin: '1rem auto 4rem' }}>
      {/* Search Header */}
      <div className="card" style={{ marginBottom: '2rem', padding: '1.25rem 1.5rem', background: 'rgba(13, 21, 39, 0.9)', borderColor: 'var(--border-accent)' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: '1 1 340px', position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
            <input 
              type="text" 
              placeholder="Track by Air Waybill (e.g. AD-8849-2041)..." 
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              className="mono form-input"
              style={{ paddingLeft: '2.75rem', fontSize: '1rem' }}
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem 1.5rem' }}>
            <span>Search AWB</span>
            <ArrowRight size={16} />
          </button>
        </form>

        {/* Quick Click Samples */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Sample AWBs:</span>
          {shipments.map(s => (
            <button
              key={s.awbNumber}
              onClick={() => {
                setInputVal(s.awbNumber);
                setSelectedAwb(s.awbNumber);
                setTrackingQuery(s.awbNumber);
              }}
              style={{
                background: s.awbNumber === activeShipment?.awbNumber ? 'rgba(0, 240, 255, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                border: s.awbNumber === activeShipment?.awbNumber ? '1px solid var(--primary)' : '1px solid var(--border-subtle)',
                color: s.awbNumber === activeShipment?.awbNumber ? 'var(--primary)' : 'var(--text-muted)',
                borderRadius: 'var(--radius-sm)',
                padding: '2px 8px',
                fontSize: '0.75rem',
                fontFamily: 'var(--font-mono)',
                cursor: 'pointer'
              }}
            >
              {s.awbNumber} ({s.currentStatus})
            </button>
          ))}
        </div>
      </div>

      {activeShipment ? (
        <>
          {/* Shipment Header Banner */}
          <div className="card" style={{ marginBottom: '1.5rem', position: 'relative', overflow: 'hidden' }}>
            <div style={{ 
              position: 'absolute', 
              top: 0, 
              right: 0, 
              width: '180px', 
              height: '180px', 
              background: 'radial-gradient(circle, rgba(0, 240, 255, 0.08) 0%, transparent 70%)',
              pointerEvents: 'none' 
            }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.25rem', marginBottom: '1.5rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
                  <h1 className="mono" style={{ fontSize: '1.85rem', color: 'var(--primary)', letterSpacing: '-0.02em' }}>
                    {activeShipment.awbNumber}
                  </h1>
                  <StatusBadge status={activeShipment.currentStatus} />
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  Service: <strong>{activeShipment.serviceTier}</strong> • Category: <strong>{activeShipment.category}</strong>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
                  {activeShipment.currentStatus === 'DELIVERED' ? 'Delivered On' : 'Estimated Delivery'}
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'flex-end', marginTop: '2px' }}>
                  <Calendar size={18} color="var(--primary)" />
                  <span>
                    {new Date(activeShipment.estimatedDelivery).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
              </div>
            </div>

            {/* Delhivery-style Horizontal Step Ribbon */}
            <div className="horizontal-steps">
              {stages.map((stg, i) => {
                const Icon = stg.icon;
                const isCompleted = i < currentStageIndex;
                const isActive = i === currentStageIndex;

                let cls = '';
                if (isActive) cls = 'active';
                else if (isCompleted) cls = 'completed';

                return (
                  <div key={stg.label} className={`h-step ${cls}`}>
                    <div className="h-marker">
                      <Icon size={16} />
                    </div>
                    <span className="h-label">{stg.label}</span>
                  </div>
                );
              })}
            </div>

            {/* Quick Route Summary */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr auto 1fr', 
              alignItems: 'center', 
              gap: '1rem', 
              background: 'rgba(255, 255, 255, 0.02)', 
              padding: '1rem 1.25rem', 
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              marginTop: '1rem'
            }}>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Origin Consignor</div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{activeShipment.sender.city}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{activeShipment.sender.facility}</div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)' }}>
                <span style={{ height: '1px', width: '40px', background: 'var(--border-accent)' }}></span>
                <Truck size={18} />
                <span style={{ height: '1px', width: '40px', background: 'var(--border-accent)' }}></span>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Destination Consignee</div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{activeShipment.recipient.city}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{activeShipment.recipient.name} ({activeShipment.recipient.pinCode})</div>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
            {/* Left: Detailed Delhivery-style Milestone Timeline */}
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h3 style={{ fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Clock size={18} color="var(--primary)" />
                  <span>Activity &amp; Milestone History</span>
                </h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Newest on top</span>
              </div>

              <TrackingTimeline events={activeShipment.events} currentStatus={activeShipment.currentStatus} />
            </div>

            {/* Right: Driver Information & Consignment Attributes */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Delivery Associate Card */}
              {activeShipment.assignedDriver && (
                <div className="card" style={{ borderColor: 'var(--border-accent)' }}>
                  <h4 style={{ fontSize: '0.95rem', color: 'var(--primary)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Truck size={16} />
                    <span>Delivery Associate</span>
                  </h4>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                    <div style={{ 
                      width: '40px', 
                      height: '40px', 
                      borderRadius: '50%', 
                      background: 'rgba(0, 240, 255, 0.1)', 
                      color: 'var(--primary)', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      fontWeight: 800
                    }}>
                      {activeShipment.assignedDriver.name.charAt(0)}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{activeShipment.assignedDriver.name}</div>
                      <div className="mono" style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                        Vehicle: {activeShipment.assignedDriver.vehicleNumber}
                      </div>
                    </div>
                  </div>

                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Phone size={13} color="var(--primary)" />
                    <span>{activeShipment.assignedDriver.phone}</span>
                  </div>
                </div>
              )}

              {/* Proof of Delivery Details (if delivered) */}
              {activeShipment.proofOfDelivery && (
                <div className="card" style={{ borderColor: 'rgba(16, 185, 129, 0.4)', background: 'rgba(16, 185, 129, 0.04)' }}>
                  <h4 style={{ fontSize: '0.95rem', color: 'var(--accent-emerald)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <CheckCircle2 size={16} />
                    <span>Proof of Delivery (POD)</span>
                  </h4>

                  <div style={{ fontSize: '0.825rem', marginBottom: '0.5rem' }}>
                    <div><strong>Received By:</strong> {activeShipment.proofOfDelivery.deliveredTo}</div>
                    <div><strong>Handover Time:</strong> {activeShipment.proofOfDelivery.timestamp}</div>
                    <div style={{ color: 'var(--text-dim)' }}>{activeShipment.proofOfDelivery.verificationMethod}</div>
                  </div>

                  {activeShipment.proofOfDelivery.photoUrl && (
                    <div style={{ marginTop: '0.5rem' }}>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginBottom: '0.25rem' }}>
                        POD Photo (S3 Private Presigned Asset Simulation):
                      </div>
                      <img 
                        src={activeShipment.proofOfDelivery.photoUrl} 
                        alt="Proof" 
                        style={{ width: '100%', height: '110px', objectFit: 'cover', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-medium)' }} 
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Package Specs */}
              <div className="card">
                <h4 style={{ fontSize: '0.95rem', marginBottom: '0.75rem', color: '#FFFFFF' }}>Consignment Specs</h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.825rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.35rem' }}>
                    <span style={{ color: 'var(--text-dim)' }}>Weight</span>
                    <span className="mono" style={{ fontWeight: 600 }}>{activeShipment.weightKg} kg</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.35rem' }}>
                    <span style={{ color: 'var(--text-dim)' }}>Dimensions</span>
                    <span className="mono" style={{ fontWeight: 600 }}>{activeShipment.dimensions}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.35rem' }}>
                    <span style={{ color: 'var(--text-dim)' }}>Payment</span>
                    <span style={{ fontWeight: 600 }}>{activeShipment.paymentMode} (₹{activeShipment.declaredValue})</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-dim)' }}>Current Hub</span>
                    <span style={{ fontWeight: 600, color: 'var(--primary)' }}>{activeShipment.currentLocation}</span>
                  </div>
                </div>

                <button
                  className="btn btn-secondary btn-sm"
                  style={{ width: '100%', marginTop: '1.25rem' }}
                  onClick={() => {
                    setSelectedAwb(activeShipment.awbNumber);
                    setActiveTab('order-details');
                  }}
                >
                  <ExternalLink size={14} />
                  <span>Inspect Full Consignment Audit</span>
                </button>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <AlertTriangle size={36} color="var(--accent-amber)" style={{ margin: '0 auto 1rem' }} />
          <h3>Shipment Not Found</h3>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            No shipment with AWB "{inputVal}" exists in the current Phase 1 mock store.
          </p>
        </div>
      )}
    </div>
  );
}
