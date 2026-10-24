import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import StatusBadge from '../components/StatusBadge';
import { 
  Truck, 
  MapPin, 
  Phone, 
  Camera, 
  CheckCircle2, 
  AlertCircle, 
  Navigation, 
  ShieldCheck,
  Package,
  Clock,
  ArrowRight
} from 'lucide-react';

export default function DriverDashboard() {
  const { shipments, updateShipmentStatus, currentUser, addToast } = useApp();
  
  // Selected parcel for delivery action modal
  const [activeModalAwb, setActiveModalAwb] = useState(null);
  const [receivedBy, setReceivedBy] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [photoPreview, setPhotoPreview] = useState(null);
  const [exceptionReason, setExceptionReason] = useState('Customer Door Locked / Unreachable');

  // Filter shipments assigned to current driver (or all out for delivery / local deliveries for demo)
  const driverShipments = shipments.filter(s => 
    (s.assignedDriver && s.assignedDriver.driverId === (currentUser?.driverId || 'DRV-504')) ||
    ['OUT_FOR_DELIVERY', 'DELIVERED', 'FAILED_ATTEMPT'].includes(s.currentStatus)
  );

  const completedCount = driverShipments.filter(s => s.currentStatus === 'DELIVERED').length;
  const pendingCount = driverShipments.filter(s => s.currentStatus !== 'DELIVERED').length;

  const handleSimulatePhoto = () => {
    // Simulated proof-of-delivery photo
    setPhotoPreview('https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=500&q=80');
    addToast('Proof-of-delivery photo captured (Phase 1 local simulation)', 'info');
  };

  const handleCompleteDelivery = (awbNumber) => {
    if (!receivedBy.trim()) {
      addToast('Please enter the name of the recipient who accepted the package', 'warning');
      return;
    }

    const proofData = {
      deliveredTo: receivedBy,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      verificationMethod: otpCode ? `OTP Verified (${otpCode})` : 'Signature Verified',
      photoUrl: photoPreview || 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=500&q=80'
    };

    updateShipmentStatus(awbNumber, 'DELIVERED', `Package handed over to ${receivedBy}. Proof captured.`, proofData);
    setActiveModalAwb(null);
    setReceivedBy('');
    setOtpCode('');
    setPhotoPreview(null);
  };

  const handleFailDelivery = (awbNumber) => {
    updateShipmentStatus(awbNumber, 'FAILED_ATTEMPT', `Delivery attempt failed: ${exceptionReason}. Re-attempt logged.`);
    setActiveModalAwb(null);
  };

  return (
    <div>
      {/* Driver Header Profile */}
      <div className="card" style={{ marginBottom: '2rem', background: 'linear-gradient(135deg, rgba(16, 26, 48, 0.9) 0%, rgba(26, 38, 70, 0.9) 100%)', borderColor: 'var(--border-accent)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div style={{ 
              width: '56px', 
              height: '56px', 
              borderRadius: 'var(--radius-md)', 
              background: 'linear-gradient(135deg, #FF9F1C 0%, #F59E0B 100%)', 
              color: '#070B14', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              boxShadow: '0 0 15px rgba(245, 158, 11, 0.3)'
            }}>
              <Truck size={28} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <h1 style={{ fontSize: '1.5rem' }}>{currentUser?.name || 'Ramesh Kumar'}</h1>
                <span className="mono" style={{ fontSize: '0.75rem', background: 'rgba(255, 255, 255, 0.08)', padding: '2px 8px', borderRadius: 'var(--radius-sm)' }}>
                  ID: {currentUser?.driverId || 'DRV-504'}
                </span>
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '2px' }}>
                Vehicle: <strong>{currentUser?.vehicleNumber || 'KA-03-EV-4412'}</strong> • Zone: <strong>Bengaluru East Hub</strong>
              </div>
            </div>
          </div>

          {/* Run Sheet Progress */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Daily Manifest Run</div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#FFFFFF' }}>
                <span style={{ color: 'var(--accent-emerald)' }}>{completedCount}</span> / {driverShipments.length} Delivered
              </div>
            </div>

            <div style={{ width: '100px', height: '8px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ 
                width: `${driverShipments.length > 0 ? (completedCount / driverShipments.length) * 100 : 0}%`, 
                height: '100%', 
                background: 'var(--accent-emerald)' 
              }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Manifest Items List */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem' }}>Assigned Delivery Manifest</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Run-sheet stops optimized for first-mile &amp; last-mile handover</p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {driverShipments.map((ship, idx) => (
          <div 
            key={ship.awbNumber} 
            className="card" 
            style={{ 
              borderLeft: ship.currentStatus === 'DELIVERED' 
                ? '4px solid var(--accent-emerald)' 
                : ship.currentStatus === 'FAILED_ATTEMPT' 
                  ? '4px solid var(--accent-rose)' 
                  : '4px solid var(--accent-amber)' 
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ flex: '1 1 320px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                  <span style={{ 
                    width: '26px', 
                    height: '26px', 
                    borderRadius: '50%', 
                    background: 'rgba(255, 255, 255, 0.08)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    fontSize: '0.75rem', 
                    fontWeight: 800 
                  }}>
                    #{idx + 1}
                  </span>
                  <span className="mono" style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary)' }}>
                    {ship.awbNumber}
                  </span>
                  <StatusBadge status={ship.currentStatus} />
                  <span style={{ 
                    fontSize: '0.75rem', 
                    fontWeight: 700, 
                    padding: '2px 8px', 
                    borderRadius: 'var(--radius-sm)',
                    background: ship.paymentMode === 'Prepaid' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.15)',
                    color: ship.paymentMode === 'Prepaid' ? 'var(--accent-emerald)' : 'var(--accent-amber)'
                  }}>
                    {ship.paymentMode === 'Prepaid' ? 'PREPAID' : `COLLECT COD: ₹${ship.declaredValue}`}
                  </span>
                </div>

                {/* Recipient Details */}
                <div style={{ fontSize: '1rem', fontWeight: 700, color: '#FFFFFF', marginTop: '0.5rem' }}>
                  {ship.recipient.name}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                  <MapPin size={14} color="var(--primary)" />
                  <span>{ship.recipient.address}, {ship.recipient.city} - {ship.recipient.pinCode}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                  <span>Weight: <strong>{ship.weightKg} kg</strong></span>
                  <span>Type: <strong>{ship.category}</strong></span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Phone size={12} color="var(--primary)" />
                    <strong>{ship.recipient.phone}</strong>
                  </span>
                </div>

                {/* Proof of Delivery Details if completed */}
                {ship.proofOfDelivery && (
                  <div style={{ 
                    marginTop: '0.85rem', 
                    padding: '0.75rem 1rem', 
                    background: 'rgba(16, 185, 129, 0.08)', 
                    border: '1px solid rgba(16, 185, 129, 0.25)', 
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    flexWrap: 'wrap'
                  }}>
                    <CheckCircle2 size={18} color="var(--accent-emerald)" />
                    <div style={{ fontSize: '0.8rem' }}>
                      <strong>Delivered to:</strong> {ship.proofOfDelivery.deliveredTo} • <em>{ship.proofOfDelivery.verificationMethod}</em>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons for Driver */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: '180px' }}>
                {ship.currentStatus !== 'DELIVERED' ? (
                  <>
                    <button
                      className="btn btn-success"
                      style={{ width: '100%' }}
                      onClick={() => setActiveModalAwb(ship.awbNumber)}
                    >
                      <CheckCircle2 size={16} />
                      <span>Mark Delivered</span>
                    </button>

                    {ship.currentStatus !== 'OUT_FOR_DELIVERY' && (
                      <button
                        className="btn btn-secondary btn-sm"
                        style={{ width: '100%' }}
                        onClick={() => updateShipmentStatus(ship.awbNumber, 'OUT_FOR_DELIVERY', 'Driver picked up consignment from local delivery center.')}
                      >
                        <Truck size={14} />
                        <span>Start Delivery Run</span>
                      </button>
                    )}

                    <button
                      className="btn btn-danger btn-sm"
                      style={{ width: '100%' }}
                      onClick={() => {
                        setActiveModalAwb(ship.awbNumber);
                      }}
                    >
                      <AlertCircle size={14} />
                      <span>Report Exception</span>
                    </button>
                  </>
                ) : (
                  <div style={{ textAlign: 'center', padding: '0.5rem', color: 'var(--accent-emerald)', fontWeight: 700, fontSize: '0.85rem' }}>
                    ✓ Delivery Complete
                  </div>
                )}
              </div>
            </div>

            {/* In-Card Modal for Delivery Handover & Photo Proof */}
            {activeModalAwb === ship.awbNumber && (
              <div style={{ 
                marginTop: '1.25rem', 
                padding: '1.25rem', 
                background: 'rgba(7, 11, 20, 0.85)', 
                border: '1px solid var(--border-accent)', 
                borderRadius: 'var(--radius-md)' 
              }}>
                <h4 style={{ fontSize: '0.95rem', color: 'var(--primary)', marginBottom: '0.75rem' }}>
                  Doorstep Verification &amp; Proof of Delivery
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label className="form-label">Received By (Name)</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="e.g. Aditya Sharma (Self) or Guard" 
                      value={receivedBy}
                      onChange={(e) => setReceivedBy(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="form-label">Customer OTP Code</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="e.g. 4821" 
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                    />
                  </div>
                </div>

                {/* S3 Presigned URL Photo Proof Simulation */}
                <div style={{ marginBottom: '1rem', padding: '0.75rem', background: 'rgba(255, 255, 255, 0.03)', borderRadius: 'var(--radius-sm)', border: '1px dashed var(--border-medium)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem' }}>
                      <Camera size={16} color="var(--primary)" />
                      <span>Delivery Photo Capture (Doorstep / Parcel Handover)</span>
                    </div>
                    <button 
                      type="button" 
                      className="btn btn-sm btn-secondary"
                      onClick={handleSimulatePhoto}
                    >
                      {photoPreview ? 'Retake Photo' : 'Capture Simulation Photo'}
                    </button>
                  </div>

                  {photoPreview && (
                    <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <img 
                        src={photoPreview} 
                        alt="Proof simulation" 
                        style={{ width: '80px', height: '60px', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--border-medium)' }} 
                      />
                      <span style={{ fontSize: '0.75rem', color: 'var(--accent-emerald)' }}>
                        ✓ Photo ready for private S3 presigned upload
                      </span>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                  <button 
                    className="btn btn-secondary btn-sm"
                    onClick={() => setActiveModalAwb(null)}
                  >
                    Cancel
                  </button>
                  <button 
                    className="btn btn-danger btn-sm"
                    onClick={() => handleFailDelivery(ship.awbNumber)}
                  >
                    Confirm Delivery Failure
                  </button>
                  <button 
                    className="btn btn-success btn-sm"
                    onClick={() => handleCompleteDelivery(ship.awbNumber)}
                  >
                    Confirm Delivery Handover
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
