import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import StatusBadge from './StatusBadge';
import CopyButton from './CopyButton';
import { getConsignmentPhoto, formatINR } from '../utils/parcelUtils';
import { 
  X, 
  Package, 
  MapPin, 
  Truck, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Phone, 
  MessageSquare, 
  ExternalLink, 
  Printer, 
  ShieldCheck, 
  Maximize2, 
  Scale, 
  Box, 
  CreditCard,
  User,
  Share2
} from 'lucide-react';

export default function ParcelDetailModal({ parcel, onClose }) {
  const { setActiveTab, setSelectedAwb, setTrackingQuery, openChatbox, addToast } = useApp();
  const [isPhotoZoomed, setIsPhotoZoomed] = useState(false);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        if (isPhotoZoomed) {
          setIsPhotoZoomed(false);
        } else {
          onClose();
        }
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isPhotoZoomed, onClose]);

  if (!parcel) return null;

  const photoUrl = getConsignmentPhoto(parcel);
  const orderId = parcel.displayOrderId || parcel.orderId || `ORD-${(parcel.awbNumber || '').replace('AD-', '')}`;
  const weight = parcel.weightKg || '1.0';
  const dimensions = parcel.dimensions || '25 x 18 x 12 cm';
  const declaredValue = parcel.declaredValue || 1500;
  const paymentMode = parcel.paymentMode || 'Prepaid Online';
  const serviceTier = parcel.serviceTier || 'Express Air Cargo';
  const category = parcel.category || 'Standard Express Parcel';

  const handleTrackLive = () => {
    setSelectedAwb(parcel.awbNumber);
    setTrackingQuery(parcel.awbNumber);
    setActiveTab('track');
    onClose();
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Consignment Dossier: ${parcel.awbNumber}`,
        text: `Track package ${parcel.awbNumber} on AeroDispatch`,
        url: window.location.origin
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(`${window.location.origin}/#track=${parcel.awbNumber}`);
      addToast('Tracking link copied to clipboard!', 'info');
    }
  };

  return (
    <div 
      className="parcel-modal-backdrop"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(7, 11, 20, 0.78)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        zIndex: 1300,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.25rem',
        animation: 'modalBackdropFade 0.22s ease-out'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <style>{`
        @keyframes modalBackdropFade {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes modalContentPop {
          from { 
            opacity: 0; 
            transform: scale(0.94) translateY(12px); 
          }
          to { 
            opacity: 1; 
            transform: scale(1) translateY(0); 
          }
        }
        .parcel-photo-hover-scale {
          transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .parcel-photo-hover-scale:hover {
          transform: scale(1.03);
        }
      `}</style>

      {/* Main Google Material 3 Rounded Dossier Pop-Up */}
      <div
        className="parcel-modal-content card"
        style={{
          width: '100%',
          maxWidth: '740px',
          maxHeight: '90vh',
          borderRadius: '28px',
          padding: 0,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-medium)',
          boxShadow: '0 28px 70px rgba(0, 0, 0, 0.35), 0 8px 24px rgba(0, 0, 0, 0.15)',
          animation: 'modalContentPop 0.28s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header / HD Parcel Photo Banner */}
        <div 
          style={{ 
            position: 'relative', 
            height: '240px', 
            width: '100%', 
            overflow: 'hidden', 
            backgroundColor: '#0f172a',
            cursor: 'pointer'
          }}
          onClick={() => setIsPhotoZoomed(prev => !prev)}
          title="Click to zoom consignment photograph"
        >
          <img 
            src={photoUrl} 
            alt="Consignment Parcel Cargo" 
            className="parcel-photo-hover-scale"
            style={{ 
              width: '100%', 
              height: '100%', 
              objectFit: 'cover',
              objectPosition: 'center',
              display: 'block'
            }} 
          />

          {/* Gradient Overlay for Text Legibility */}
          <div 
            style={{ 
              position: 'absolute', 
              inset: 0, 
              background: 'linear-gradient(to top, rgba(7, 11, 20, 0.92) 0%, rgba(7, 11, 20, 0.2) 60%, rgba(7, 11, 20, 0.45) 100%)',
              pointerEvents: 'none'
            }} 
          />

          {/* Top Badges */}
          <div style={{ position: 'absolute', top: '16px', left: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap', zIndex: 2 }}>
            <span style={{ 
              background: 'rgba(239, 68, 68, 0.88)', 
              color: '#ffffff', 
              padding: '4px 12px', 
              borderRadius: '9999px', 
              fontSize: '0.74rem', 
              fontWeight: 800,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              backdropFilter: 'blur(8px)',
              boxShadow: '0 2px 10px rgba(239, 68, 68, 0.4)'
            }}>
              {serviceTier}
            </span>

            <span style={{ 
              background: 'rgba(15, 23, 42, 0.75)', 
              color: '#E2E8F0', 
              border: '1px solid rgba(255, 255, 255, 0.2)',
              padding: '4px 12px', 
              borderRadius: '9999px', 
              fontSize: '0.74rem', 
              fontWeight: 700,
              backdropFilter: 'blur(8px)'
            }}>
              {category}
            </span>
          </div>

          {/* Close Button Top Right */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              background: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 3,
              backdropFilter: 'blur(8px)',
              transition: 'transform 0.15s ease, background 0.15s ease'
            }}
            title="Close dossier (Esc)"
          >
            <X size={18} />
          </button>

          {/* Zoom hint overlay bottom-right */}
          <div 
            style={{ 
              position: 'absolute', 
              bottom: '16px', 
              right: '16px', 
              background: 'rgba(0, 0, 0, 0.6)', 
              padding: '4px 10px', 
              borderRadius: '9999px', 
              color: '#F1F5F9', 
              fontSize: '0.72rem', 
              fontWeight: 700, 
              display: 'flex', 
              alignItems: 'center', 
              gap: '5px',
              backdropFilter: 'blur(6px)',
              border: '1px solid rgba(255, 255, 255, 0.15)'
            }}
          >
            <Maximize2 size={12} />
            <span>Click to Zoom</span>
          </div>

          {/* Parcel Title / AWB Monospace on Image */}
          <div style={{ position: 'absolute', bottom: '16px', left: '20px', zIndex: 2 }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Consignment Dossier
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '2px' }}>
              <span className="mono" style={{ fontSize: '1.45rem', fontWeight: 900, color: '#FFFFFF', letterSpacing: '0.03em' }}>
                {parcel.awbNumber}
              </span>
              <CopyButton text={parcel.awbNumber} size="sm" label="" />
            </div>
          </div>
        </div>

        {/* Scrollable Dossier Body */}
        <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Header Identifiers & Status Row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', paddingBottom: '1.15rem', borderBottom: '1px solid var(--border-subtle)' }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Customer Order Reference:</div>
              <div className="mono" style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)' }}>
                {orderId}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <StatusBadge status={parcel.currentStatus} />
            </div>
          </div>

          {/* Shipper & Consignee Two-Column Route Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            {/* Origin Sender Card */}
            <div style={{ background: 'var(--bg-elevated)', borderRadius: '20px', padding: '1.15rem', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.65rem' }}>
                <MapPin size={14} color="#6366F1" />
                <span>Origin (Shipper)</span>
              </div>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)' }}>
                {parcel.sender?.name || 'Sender Client'}
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px', lineHeight: 1.4 }}>
                {parcel.sender?.address || 'Origin Logistics Facility'}, {parcel.sender?.city || 'Mumbai'}, {parcel.sender?.state || ''} - {parcel.sender?.pinCode || ''}
              </div>
              {parcel.sender?.phone && (
                <div style={{ fontSize: '0.78rem', color: 'var(--primary)', marginTop: '6px', fontWeight: 700 }}>
                  Phone: {parcel.sender.phone}
                </div>
              )}
            </div>

            {/* Destination Recipient Card */}
            <div style={{ background: 'var(--bg-elevated)', borderRadius: '20px', padding: '1.15rem', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.65rem' }}>
                <MapPin size={14} color="#10B981" />
                <span>Destination (Consignee)</span>
              </div>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)' }}>
                {parcel.recipient?.name || 'Recipient Customer'}
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px', lineHeight: 1.4 }}>
                {parcel.recipient?.address || 'Delivery Address'}, {parcel.recipient?.city || 'Bengaluru'}, {parcel.recipient?.state || ''} - {parcel.recipient?.pinCode || ''}
              </div>
              {parcel.recipient?.phone && (
                <div style={{ fontSize: '0.78rem', color: 'var(--primary)', marginTop: '6px', fontWeight: 700 }}>
                  Phone: {parcel.recipient.phone}
                </div>
              )}
            </div>
          </div>

          {/* Parcel Specifications Grid (4 Google Pill Boxes) */}
          <div>
            <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.65rem' }}>
              Consignment Specifications
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
              {/* Weight */}
              <div style={{ background: 'var(--bg-elevated)', borderRadius: '16px', padding: '0.85rem', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  <Scale size={13} color="var(--primary)" />
                  <span>Weight</span>
                </div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '4px' }}>
                  {weight} kg
                </div>
              </div>

              {/* Dimensions */}
              <div style={{ background: 'var(--bg-elevated)', borderRadius: '16px', padding: '0.85rem', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  <Box size={13} color="#00F0FF" />
                  <span>Dimensions</span>
                </div>
                <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '6px' }}>
                  {dimensions}
                </div>
              </div>

              {/* Declared Value */}
              <div style={{ background: 'var(--bg-elevated)', borderRadius: '16px', padding: '0.85rem', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  <CreditCard size={13} color="#FBBF24" />
                  <span>Cargo Value</span>
                </div>
                <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#FBBF24', marginTop: '4px' }}>
                  {formatINR(declaredValue)}
                </div>
              </div>

              {/* Payment Mode */}
              <div style={{ background: 'var(--bg-elevated)', borderRadius: '16px', padding: '0.85rem', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  <ShieldCheck size={13} color="#10B981" />
                  <span>Payment Mode</span>
                </div>
                <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--accent-emerald)', marginTop: '6px' }}>
                  {paymentMode}
                </div>
              </div>
            </div>
          </div>

          {/* Delivery Captain Section */}
          <div style={{ background: 'rgba(239, 68, 68, 0.05)', borderRadius: '20px', padding: '1.25rem', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'linear-gradient(135deg, #EF4444 0%, #991B1B 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF', fontWeight: 800, fontSize: '1.1rem', flexShrink: 0 }}>
                  <Truck size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '0.74rem', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>
                    Assigned Delivery Captain
                  </div>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)' }}>
                    {parcel.assignedDriver?.name || 'Captain Rishabh Pandey'}
                  </div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                    Vehicle: <strong>{parcel.assignedDriver?.vehicleNumber || 'MH-02-EV-8469 (Electric Cargo)'}</strong> • ID: {parcel.assignedDriver?.driverId || 'DRV-8469'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => openChatbox()}
                  style={{ borderRadius: '9999px', padding: '0.45rem 1rem', display: 'flex', alignItems: 'center', gap: '5px' }}
                >
                  <MessageSquare size={13} />
                  <span>Chat</span>
                </button>
                <a
                  href={`tel:${parcel.assignedDriver?.phone || '+919004278469'}`}
                  className="btn btn-primary btn-sm"
                  style={{ borderRadius: '9999px', padding: '0.45rem 1rem', display: 'inline-flex', alignItems: 'center', gap: '5px', textDecoration: 'none' }}
                >
                  <Phone size={13} />
                  <span>Call Captain</span>
                </a>
              </div>
            </div>
          </div>

          {/* Proof of Delivery Card (If Delivered) */}
          {parcel.proofOfDelivery && (
            <div style={{ background: 'rgba(16, 185, 129, 0.08)', borderRadius: '20px', padding: '1.25rem', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10B981', fontWeight: 800, fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                <CheckCircle2 size={18} />
                <span>Verified Handover &amp; Proof of Delivery</span>
              </div>
              <div style={{ fontSize: '0.84rem', color: 'var(--text-main)', lineHeight: 1.5 }}>
                Delivered to: <strong>{parcel.proofOfDelivery.deliveredTo || 'Recipient'}</strong> at {parcel.proofOfDelivery.timestamp || 'Today'}
              </div>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Verification: {parcel.proofOfDelivery.verificationMethod || 'Secure Recipient Signature'}
              </div>
            </div>
          )}

          {/* Lifecycle Milestones */}
          {Array.isArray(parcel.events) && parcel.events.length > 0 && (
            <div>
              <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.65rem' }}>
                Milestone Activity Log
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {parcel.events.map((evt, idx) => (
                  <div 
                    key={evt.id || idx}
                    style={{
                      background: 'var(--bg-elevated)',
                      borderRadius: '14px',
                      padding: '0.75rem 1rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '0.82rem',
                      border: '1px solid var(--border-subtle)'
                    }}
                  >
                    <div>
                      <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{evt.title || evt.status}</span>
                      <span style={{ color: 'var(--text-muted)', marginLeft: '8px' }}>({evt.location || 'Express Node'})</span>
                    </div>
                    <div style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>
                      {evt.timestamp || 'Logged'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div 
          style={{ 
            padding: '1rem 1.5rem', 
            background: 'var(--bg-elevated)', 
            borderTop: '1px solid var(--border-subtle)', 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            flexWrap: 'wrap', 
            gap: '0.75rem' 
          }}
        >
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handlePrint}
              style={{ borderRadius: '9999px', padding: '0.5rem 1rem' }}
              title="Print official shipping waybill"
            >
              <Printer size={14} />
              <span>Print Waybill</span>
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleShare}
              style={{ borderRadius: '9999px', padding: '0.5rem 1rem' }}
              title="Share consignment dossier"
            >
              <Share2 size={14} />
              <span>Share</span>
            </button>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={handleTrackLive}
              style={{ borderRadius: '9999px', padding: '0.5rem 1.4rem' }}
            >
              <ExternalLink size={14} />
              <span>Track on Live GPS Map</span>
            </button>

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={onClose}
              style={{ borderRadius: '9999px', padding: '0.5rem 1.25rem' }}
            >
              Close Dossier
            </button>
          </div>
        </div>
      </div>

      {/* Lightbox High-Res Zoom Modal */}
      {isPhotoZoomed && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.95)',
            zIndex: 1400,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            cursor: 'zoom-out'
          }}
          onClick={() => setIsPhotoZoomed(false)}
        >
          <img
            src={photoUrl}
            alt="Consignment Zoomed"
            style={{
              maxWidth: '92vw',
              maxHeight: '90vh',
              borderRadius: '24px',
              objectFit: 'contain',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8)'
            }}
          />
        </div>
      )}
    </div>
  );
}
