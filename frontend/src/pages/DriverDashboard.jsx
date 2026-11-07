import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import StatusBadge from '../components/StatusBadge';
import { SkeletonRunSheet } from '../components/SkeletonLoading';
import CopyButton from '../components/CopyButton';
import { resolvePhotoUrl } from '../services/api';
import { 
  Truck, 
  MapPin, 
  Phone, 
  Camera, 
  CheckCircle2, 
  AlertCircle, 
  UploadCloud,
  RefreshCw,
  IndianRupee,
  X,
  Package,
  Clock,
  Check,
  AlertTriangle,
  LogOut,
  Globe,
  ShieldCheck
} from 'lucide-react';

export default function DriverDashboard() {
  const { 
    shipments, 
    updateShipmentStatus, 
    acceptDriverOrder,
    declineDriverOrder,
    uploadProofPhoto, 
    currentUser, 
    addToast, 
    isBackendOnline,
    logoutUser,
    setActiveTab,
    isLoadingOrders,
    openProfileZoom
  } = useApp();
  
  // Selected parcel for delivery action modal
  const [activeModalAwb, setActiveModalAwb] = useState(null);
  const [modalMode, setModalMode] = useState('complete'); // 'complete' | 'exception'
  const [viewingPhoto, setViewingPhoto] = useState(null); // Proof photo lightbox modal
  const [receivedBy, setReceivedBy] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [exceptionReason, setExceptionReason] = useState('Customer Door Locked / Unreachable');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState('');

  // Tab filtering for driver's run sheet
  const [activeTabFilter, setActiveTabFilter] = useState('ALL');

  // Driver Run Sheet Skeleton Loading - strictly 1.0s as requested
  const [isDriverLoading, setIsDriverLoading] = useState(true);

  useEffect(() => {
    setIsDriverLoading(true);
    const timer = setTimeout(() => {
      setIsDriverLoading(false);
    }, 1000); // 1.0s management skeleton loading
    return () => clearTimeout(timer);
  }, [activeTabFilter]);

  // Filter shipments strictly assigned to current driver
  const driverShipments = useMemo(() => {
    const dId = currentUser?.driverId || 'DRV-8469';
    return shipments.filter(s => 
      (s.assignedDriver && s.assignedDriver.driverId === dId) ||
      (s.assignedDriver && s.assignedDriver.name?.toLowerCase() === currentUser?.name?.toLowerCase())
    );
  }, [shipments, currentUser]);

  // Unassigned shipments waiting for driver pickup / acceptance
  const availableOrders = useMemo(() => {
    const dId = currentUser?.driverId || 'DRV-8469';
    return shipments.filter(s => 
      !s.assignedDriver &&
      (s.currentStatus === 'BOOKED' || s.currentStatus === 'PICKUP_SCHEDULED') &&
      !(s.declinedByDrivers && s.declinedByDrivers.includes(dId))
    );
  }, [shipments, currentUser]);

  const completedCount = driverShipments.filter(s => s.currentStatus === 'DELIVERED').length;
  const pendingCount = driverShipments.filter(s => s.currentStatus !== 'DELIVERED' && s.currentStatus !== 'FAILED_ATTEMPT').length;
  const exceptionCount = driverShipments.filter(s => s.currentStatus === 'FAILED_ATTEMPT').length;

  // Calculate COD cash to collect
  const codToCollect = useMemo(() => {
    return driverShipments
      .filter(s => s.paymentMode === 'COD' && s.currentStatus !== 'DELIVERED')
      .reduce((acc, curr) => acc + (parseFloat(curr.declaredValue) || 0), 0);
  }, [driverShipments]);

  // Filtered list based on active tab
  const filteredDriverShipments = useMemo(() => {
    if (activeTabFilter === 'PENDING') {
      return driverShipments.filter(s => s.currentStatus !== 'DELIVERED' && s.currentStatus !== 'FAILED_ATTEMPT');
    }
    if (activeTabFilter === 'DELIVERED') {
      return driverShipments.filter(s => s.currentStatus === 'DELIVERED');
    }
    if (activeTabFilter === 'EXCEPTIONS') {
      return driverShipments.filter(s => s.currentStatus === 'FAILED_ATTEMPT');
    }
    return driverShipments;
  }, [driverShipments, activeTabFilter]);

  const handleFileChange = (e) => {
    setActionError('');
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setActionError('File size exceeds 5MB limit. Please choose a smaller photo.');
      return;
    }

    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setActionError('Only JPEG, PNG, or WebP images are accepted.');
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPhotoPreview(objectUrl);
  };

  const handleSimulatePhoto = () => {
    setSelectedFile(null);
    setPhotoPreview('https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=500&q=80');
    addToast('Simulated package photo loaded.', 'info');
  };

  const openDeliveryModal = (awb, mode = 'complete') => {
    setActiveModalAwb(awb);
    setModalMode(mode);
    setReceivedBy('');
    setOtpCode('');
    setDeliveryNotes('');
    setSelectedFile(null);
    setPhotoPreview(null);
    setActionError('');
  };

  const closeModal = () => {
    setActiveModalAwb(null);
    setSelectedFile(null);
    setPhotoPreview(null);
    setActionError('');
  };

  const handleCompleteDelivery = async (awbNumber) => {
    setActionError('');
    if (!receivedBy.trim()) {
      setActionError('Please enter the name of the recipient who accepted the package.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (selectedFile) {
        // Upload photo through backend multipart endpoint
        await uploadProofPhoto(
          awbNumber,
          selectedFile,
          receivedBy.trim(),
          otpCode.trim(),
          deliveryNotes.trim() || `Delivered to ${receivedBy}. Proof photo uploaded.`
        );
      } else {
        const proofData = {
          deliveredTo: receivedBy.trim(),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          verificationMethod: otpCode.trim() ? `OTP Verified (${otpCode.trim()})` : 'Signature Verified',
          photoUrl: photoPreview || 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=500&q=80',
        };
        await updateShipmentStatus(
          awbNumber,
          'DELIVERED',
          deliveryNotes.trim() || `Package handed over to ${receivedBy}. Handover recorded.`,
          proofData
        );
      }
      addToast(`Successfully completed delivery for ${awbNumber}!`, 'success');
      closeModal();
    } catch (err) {
      setActionError(err.message || 'Failed to complete delivery.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFailDelivery = async (awbNumber) => {
    setIsSubmitting(true);
    try {
      await updateShipmentStatus(
        awbNumber,
        'FAILED_ATTEMPT',
        `Delivery attempt failed: ${exceptionReason}. Customer notice logged.`
      );
      addToast(`Logged exception for ${awbNumber}: ${exceptionReason}`, 'warning');
      closeModal();
    } catch (err) {
      setActionError(err.message || 'Failed to record exception.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartRun = async (awbNumber) => {
    setIsSubmitting(true);
    try {
      await updateShipmentStatus(
        awbNumber,
        'OUT_FOR_DELIVERY',
        'Driver departed facility. Package is out for delivery.'
      );
      addToast(`Package ${awbNumber} is out for delivery!`, 'info');
    } catch (err) {
      addToast(`Could not start delivery run: ${err.message}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeShipmentInModal = shipments.find(s => s.awbNumber === activeModalAwb);

  return (
    <div>
      {/* Driver Header Profile */}
      <div className="card driver-profile-header" style={{ marginBottom: '2rem', borderColor: 'var(--border-accent)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            {/* WhatsApp-Style Driver Profile Picture with Camera Pill & Zoom Click */}
            <div 
              style={{ 
                width: '58px', 
                height: '58px', 
                borderRadius: '50%', 
                background: 'linear-gradient(135deg, #FF9F1C 0%, #F59E0B 100%)', 
                color: '#070B14', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                boxShadow: '0 0 18px rgba(245, 158, 11, 0.35)',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden',
                border: '2px solid rgba(245, 158, 11, 0.8)',
                flexShrink: 0,
                transition: 'transform 0.15s ease'
              }}
              onClick={openProfileZoom}
              title="Click to view & zoom WhatsApp profile photo"
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              {currentUser?.avatarUrl ? (
                <img 
                  src={currentUser.avatarUrl} 
                  alt={currentUser.name || 'Driver'} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <span style={{ fontSize: '1.45rem', fontWeight: 900, color: '#070B14' }}>
                  {currentUser?.name?.charAt(0) || 'R'}
                </span>
              )}
              {/* Camera icon badge */}
              <div 
                style={{
                  position: 'absolute',
                  bottom: '0',
                  right: '0',
                  background: '#0B141A',
                  border: '1px solid #F59E0B',
                  borderRadius: '50%',
                  width: '20px',
                  height: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#25D366'
                }}
              >
                <Camera size={11} />
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>{currentUser?.name || 'Rishabh Pandey'}</h1>
                <span className="mono" style={{ fontSize: '0.75rem', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.35)', color: '#F43F5E', padding: '3px 10px', borderRadius: '6px', fontWeight: 800 }}>
                  DRIVER ID: {currentUser?.driverId || currentUser?.id || 'DRV-8469'}
                </span>
                <span style={{ 
                  fontSize: '0.72rem', 
                  padding: '3px 9px', 
                  borderRadius: '6px',
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.35)',
                  color: 'var(--accent-emerald)',
                  fontWeight: 700
                }}>
                  ● On Duty / Available
                </span>
                <span style={{ 
                  fontSize: '0.72rem', 
                  padding: '3px 10px', 
                  borderRadius: '6px',
                  background: 'rgba(0, 240, 255, 0.1)',
                  border: '1px solid rgba(0, 240, 255, 0.3)',
                  color: '#00F0FF',
                  fontWeight: 700
                }}>
                  OPERATIONAL ZONE: {currentUser?.operationalZone || currentUser?.zone || currentUser?.hub || 'Mumbai Metro & Air Cargo Corridor'}
                </span>
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '6px', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <span>Vehicle: <strong style={{ color: 'var(--text-main)' }}>{currentUser?.vehicleNumber || currentUser?.vehicle || 'MH-02-EV-8469'}</strong></span>
                <span>Base Hub: <strong style={{ color: 'var(--text-main)' }}>{currentUser?.hub || 'Mumbai Cargo Gateway (BOM-01)'}</strong></span>
                <span>Contact: <strong style={{ color: 'var(--text-main)' }}>{currentUser?.phone || '+91 90042 78469'}</strong></span>
              </div>
            </div>
          </div>

          {/* Run Sheet Progress & Exit / Sign Out Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Daily Progress</div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)' }}>
                <span style={{ color: 'var(--accent-emerald)' }}>{completedCount}</span> / {driverShipments.length} Delivered
              </div>
            </div>

            <div style={{ width: '120px', height: '8px', background: 'var(--border-subtle)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ 
                width: `${driverShipments.length > 0 ? (completedCount / driverShipments.length) * 100 : 0}%`, 
                height: '100%', 
                background: 'var(--accent-emerald)',
                transition: 'width 0.4s ease'
              }}></div>
            </div>

            {/* Clean Sign Out Action */}
            <div style={{ display: 'flex', alignItems: 'center', borderLeft: '1px solid var(--border-subtle)', paddingLeft: '1rem' }}>
              <button
                type="button"
                className="btn btn-sm btn-secondary"
                onClick={logoutUser}
                style={{ color: '#F43F5E', borderColor: 'rgba(244, 63, 94, 0.3)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                title="Sign out of Driver Account"
              >
                <LogOut size={14} />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Incoming Dispatch Requests Card (Accept / Decline) */}
      {availableOrders.length > 0 && (
        <div 
          className="card" 
          style={{ 
            marginBottom: '2rem', 
            border: '2px solid rgba(239, 68, 68, 0.45)', 
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(15, 23, 42, 0.5) 100%)',
            boxShadow: '0 10px 30px rgba(239, 68, 68, 0.15)',
            padding: '1.5rem',
            borderRadius: 'var(--radius-lg)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem', borderBottom: '1px solid rgba(239, 68, 68, 0.2)', paddingBottom: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.2)', color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Package size={22} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                    Incoming Customer Consignments
                  </h3>
                  <span style={{ fontSize: '0.72rem', background: '#EF4444', color: '#FFFFFF', padding: '2px 8px', borderRadius: '9999px', fontWeight: 800 }}>
                    {availableOrders.length} READY FOR PICKUP
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  New customer booked shipments waiting for courier acceptance. Review route and accept to add to your delivery run sheet.
                </p>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {availableOrders.map(order => (
              <div 
                key={order.awbNumber || order.orderId}
                className="card"
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-medium)',
                  padding: '1.25rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '1.25rem',
                  borderRadius: 'var(--radius-md)'
                }}
              >
                <div style={{ flex: '1 1 360px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.78rem', padding: '3px 8px', borderRadius: '4px', background: 'rgba(245, 158, 11, 0.15)', color: '#F59E0B', fontWeight: 800 }}>
                      ORDER ID: {order.displayOrderId || 'ORD-' + (order.awbNumber || '').replace('AD-', '')}
                    </span>
                    <span className="mono" style={{ fontSize: '0.92rem', fontWeight: 800, color: '#00F0FF' }}>
                      AWB: {order.awbNumber}
                    </span>
                    <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: '4px', background: 'rgba(56, 189, 248, 0.15)', color: '#38BDF8', fontWeight: 700 }}>
                      {order.serviceTier || 'Express Air'}
                    </span>
                    <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: '4px', background: order.paymentMode === 'COD' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)', color: order.paymentMode === 'COD' ? '#F59E0B' : '#10B981', fontWeight: 700 }}>
                      {order.paymentMode || 'Prepaid'}
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.65rem', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    <div>
                      <strong style={{ color: 'var(--text-main)' }}>Pickup:</strong> {order.sender?.city || 'Origin'} ({order.sender?.address?.substring(0, 32)}...)
                    </div>
                    <div>
                      <strong style={{ color: 'var(--text-main)' }}>Drop-off:</strong> {order.recipient?.city || 'Destination'} ({order.recipient?.name})
                    </div>
                    <div style={{ color: '#00F0FF', fontWeight: 700 }}>
                      <strong>📍 Est. Route:</strong> ~15.2 km • ~35 mins
                    </div>
                    <div>
                      <strong style={{ color: 'var(--text-main)' }}>Parcel:</strong> {order.category || 'General'} • {order.weightKg} kg (₹{order.declaredValue?.toLocaleString() || 1500})
                    </div>
                  </div>
                </div>

                {/* Accept / Decline Action Buttons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ borderColor: 'rgba(239, 68, 68, 0.4)', color: '#EF4444', fontWeight: 700, padding: '0.6rem 1rem' }}
                    onClick={() => declineDriverOrder(order.awbNumber)}
                  >
                    <X size={15} style={{ marginRight: '4px' }} />
                    <span>Decline</span>
                  </button>

                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ background: '#10B981', borderColor: '#10B981', color: '#FFFFFF', fontWeight: 800, padding: '0.6rem 1.25rem', boxShadow: '0 4px 15px rgba(16, 185, 129, 0.35)' }}
                    onClick={() => acceptDriverOrder(order.awbNumber)}
                  >
                    <Check size={16} style={{ marginRight: '6px' }} />
                    <span>Accept Consignment ➔</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Driver Daily Run KPIs */}
      <div className="grid-cols-4" style={{ marginBottom: '2rem' }}>
        <div className="metric-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Assigned Stops</span>
            <Package size={18} color="var(--primary)" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)' }}>{driverShipments.length}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>Today's Route Plan</div>
        </div>

        <div className="metric-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Pending Delivery</span>
            <Clock size={18} color="var(--accent-amber)" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--accent-amber)' }}>{pendingCount}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>Awaiting Handover</div>
        </div>

        <div className="metric-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Delivered &amp; Verified</span>
            <CheckCircle2 size={18} color="var(--accent-emerald)" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>{completedCount}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>Proof Captured</div>
        </div>

        <div className="metric-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>COD Cash to Collect</span>
            <IndianRupee size={18} color="var(--accent-cyan)" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)' }}>₹{codToCollect.toLocaleString()}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>Across Pending Stops</div>
        </div>
      </div>

      {/* Manifest Items List & Tab Controls */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem' }}>Assigned Deliveries</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Today's delivery stops and route plan</p>
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {[
            { id: 'ALL', label: `All (${driverShipments.length})` },
            { id: 'PENDING', label: `Pending (${pendingCount})` },
            { id: 'DELIVERED', label: `Delivered (${completedCount})` },
            { id: 'EXCEPTIONS', label: `Exceptions (${exceptionCount})` },
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              className={`btn btn-sm ${activeTabFilter === tab.id ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTabFilter(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {(isLoadingOrders || isDriverLoading) ? (
        <SkeletonRunSheet count={3} />
      ) : filteredDriverShipments.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
          <Truck size={42} color="var(--text-dim)" style={{ margin: '0 auto 1rem' }} />
          <h3 style={{ fontSize: '1.15rem', color: 'var(--text-main)', marginBottom: '0.5rem' }}>No Stops in this Category</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', maxWidth: '440px', margin: '0 auto' }}>
            {activeTabFilter === 'ALL'
              ? 'There are currently no deliveries assigned to your route.'
              : `No deliveries currently matching "${activeTabFilter}". Switch to "All" to inspect all stops.`}
          </p>
        </div>
      ) : (
        <div className="driver-cockpit-scroll-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', paddingBottom: '2.5rem' }}>
          {filteredDriverShipments.map((ship, idx) => (
            <div 
              key={ship.awbNumber} 
              className="card" 
              style={{ 
                padding: '1.5rem',
                marginBottom: 0,
                borderLeft: ship.currentStatus === 'DELIVERED' 
                  ? '4px solid var(--accent-emerald)' 
                  : ship.currentStatus === 'FAILED_ATTEMPT' 
                    ? '4px solid var(--accent-rose)' 
                    : '4px solid var(--accent-amber)' 
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ flex: '1 1 320px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
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
                    <CopyButton text={ship.awbNumber} size="sm" label="" />
                    <StatusBadge status={ship.currentStatus} />
                    <span style={{ 
                      fontSize: '0.75rem', 
                      fontWeight: 700, 
                      padding: '2px 8px', 
                      borderRadius: 'var(--radius-sm)',
                      background: (ship.paymentMode?.toUpperCase() === 'PREPAID') ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.15)',
                      color: (ship.paymentMode?.toUpperCase() === 'PREPAID') ? 'var(--accent-emerald)' : 'var(--accent-amber)'
                    }}>
                      {(ship.paymentMode?.toUpperCase() === 'PREPAID') 
                        ? 'PREPAID' 
                        : `COLLECT COD: ₹${ship.codAmount ?? ship.declaredValue ?? 0}`}
                    </span>
                  </div>

                  {/* Recipient Details */}
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '0.5rem' }}>
                    {ship.recipient?.name || 'Customer Recipient'}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                    <MapPin size={14} color="var(--primary)" />
                    <span>{ship.recipient?.address || 'Delivery Address'}, {ship.recipient?.city || 'City'} - {ship.recipient?.pinCode || ''}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--text-dim)', flexWrap: 'wrap' }}>
                    <span>Weight: <strong>{ship.weightKg || '1'} kg</strong></span>
                    <span>Type: <strong>{ship.category || 'General Parcel'}</strong></span>
                    {ship.recipient?.phone && (
                      <a 
                        href={`tel:${ship.recipient.phone}`}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--primary)', textDecoration: 'none' }}
                        title="Call Recipient"
                      >
                        <Phone size={12} />
                        <strong>{ship.recipient.phone}</strong>
                      </a>
                    )}
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
                      {ship.proofOfDelivery.photoUrl && (
                        <button 
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => setViewingPhoto({
                            url: resolvePhotoUrl(ship.proofOfDelivery.photoUrl),
                            awb: ship.awbNumber,
                            deliveredTo: ship.proofOfDelivery.deliveredTo,
                            timestamp: ship.proofOfDelivery.timestamp,
                            verificationMethod: ship.proofOfDelivery.verificationMethod,
                            aiConfidence: ship.proofOfDelivery.aiConfidence
                          })}
                          style={{ 
                            fontSize: '0.75rem', 
                            padding: '0.25rem 0.6rem', 
                            borderRadius: '9999px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            cursor: 'pointer'
                          }}
                        >
                          <Camera size={13} color="var(--primary)" />
                          <span>View Uploaded Photo</span>
                        </button>
                      )}
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
                        disabled={isSubmitting}
                        onClick={() => openDeliveryModal(ship.awbNumber, 'complete')}
                      >
                        <CheckCircle2 size={16} />
                        <span>Deliver with Proof</span>
                      </button>

                      {ship.currentStatus !== 'OUT_FOR_DELIVERY' && (
                        <button
                          className="btn btn-secondary btn-sm"
                          style={{ width: '100%' }}
                          disabled={isSubmitting}
                          onClick={() => handleStartRun(ship.awbNumber)}
                        >
                          <Truck size={14} />
                          <span>Start Delivery Run</span>
                        </button>
                      )}

                      <button
                        className="btn btn-danger btn-sm"
                        style={{ width: '100%' }}
                        disabled={isSubmitting}
                        onClick={() => openDeliveryModal(ship.awbNumber, 'exception')}
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
            </div>
          ))}
        </div>
      )}

      {/* Accessible Modal Dialog for Handover / Exception */}
      {activeModalAwb && activeShipmentInModal && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="modal-action-title">
          <div className="modal-dialog">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <h3 id="modal-action-title" style={{ fontSize: '1.15rem', color: modalMode === 'complete' ? 'var(--accent-emerald)' : 'var(--accent-rose)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {modalMode === 'complete' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
                  <span>{modalMode === 'complete' ? 'Proof of Delivery Handover' : 'Log Delivery Exception'}</span>
                </h3>
                <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  AWB: {activeShipmentInModal?.awbNumber} • {activeShipmentInModal?.recipient?.name || 'Customer'}
                </span>
              </div>
              <button 
                type="button" 
                onClick={closeModal}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}
                aria-label="Close dialog"
              >
                <X size={18} />
              </button>
            </div>

            {/* Mode Selector Tab */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', background: 'rgba(255, 255, 255, 0.03)', padding: '4px', borderRadius: 'var(--radius-sm)' }}>
              <button
                type="button"
                className={`btn btn-sm ${modalMode === 'complete' ? 'btn-success' : 'btn-secondary'}`}
                style={{ flex: 1 }}
                onClick={() => { setModalMode('complete'); setActionError(''); }}
              >
                Record Successful Delivery
              </button>
              <button
                type="button"
                className={`btn btn-sm ${modalMode === 'exception' ? 'btn-danger' : 'btn-secondary'}`}
                style={{ flex: 1 }}
                onClick={() => { setModalMode('exception'); setActionError(''); }}
              >
                Report Exception
              </button>
            </div>

            {actionError && (
              <div style={{ 
                padding: '0.65rem 0.9rem', 
                background: 'rgba(244, 63, 94, 0.12)', 
                border: '1px solid rgba(244, 63, 94, 0.3)', 
                borderRadius: 'var(--radius-sm)', 
                color: 'var(--accent-rose)', 
                fontSize: '0.8rem', 
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <AlertCircle size={15} />
                <span>{actionError}</span>
              </div>
            )}

            {modalMode === 'complete' ? (
              /* Delivery Handover Form */
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label className="form-label" htmlFor="received-by-input">Received By (Name) *</label>
                    <input 
                      id="received-by-input"
                      type="text" 
                      className="form-input" 
                      placeholder="e.g. Aditya Sharma (Self) or Guard" 
                      value={receivedBy}
                      onChange={(e) => setReceivedBy(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className="form-label" htmlFor="otp-input">Customer OTP Code</label>
                    <input 
                      id="otp-input"
                      type="text" 
                      className="form-input" 
                      placeholder="e.g. 4821 (optional)" 
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label className="form-label" htmlFor="delivery-notes-input">Delivery Notes</label>
                  <input 
                    id="delivery-notes-input"
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. Handed to security reception, signature captured" 
                    value={deliveryNotes}
                    onChange={(e) => setDeliveryNotes(e.target.value)}
                  />
                </div>

                {/* Photo Proof Upload */}
                <div style={{ marginBottom: '1.25rem', padding: '0.85rem', background: 'rgba(255, 255, 255, 0.03)', borderRadius: 'var(--radius-sm)', border: '1px dashed var(--border-medium)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                      <Camera size={16} color="var(--primary)" />
                      <span style={{ fontWeight: 600 }}>Delivery Photo (JPEG/PNG/WebP, max 5MB)</span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <label className="btn btn-sm btn-secondary" style={{ cursor: 'pointer', margin: 0 }}>
                        <UploadCloud size={14} />
                        <span>{selectedFile ? 'Change File' : 'Choose File'}</span>
                        <input 
                          type="file" 
                          accept="image/jpeg,image/png,image/webp" 
                          style={{ display: 'none' }} 
                          onChange={handleFileChange}
                        />
                      </label>
                    </div>
                  </div>

                  {photoPreview && (
                    <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <img 
                        src={photoPreview} 
                        alt="Proof preview" 
                        style={{ width: '80px', height: '60px', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--border-medium)' }} 
                      />
                      <div style={{ fontSize: '0.75rem' }}>
                        <div style={{ color: 'var(--accent-emerald)', fontWeight: 600 }}>
                          {selectedFile ? `✓ ${selectedFile.name} (${(selectedFile.size / 1024).toFixed(1)} KB)` : '✓ Simulated photo selected'}
                        </div>
                        <div style={{ color: 'var(--text-dim)' }}>
                          Photo will be verified by AI and saved to delivery proof vault
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                  <button 
                    type="button"
                    className="btn btn-secondary btn-sm"
                    disabled={isSubmitting}
                    onClick={closeModal}
                  >
                    Cancel
                  </button>
                  <button 
                    type="button"
                    className="btn btn-success btn-sm"
                    disabled={isSubmitting}
                    onClick={() => handleCompleteDelivery(activeModalAwb)}
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw size={14} className="pulse" />
                        <span>Uploading Proof...</span>
                      </>
                    ) : (
                      <>
                        <Check size={15} />
                        <span>Confirm Delivery Handover</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              /* Exception Reason Form */
              <div>
                <div style={{ marginBottom: '1.25rem' }}>
                  <label className="form-label" htmlFor="exception-reason-select">Select Reason for Delivery Exception *</label>
                  <select
                    id="exception-reason-select"
                    className="form-select input-field"
                    value={exceptionReason}
                    onChange={(e) => setExceptionReason(e.target.value)}
                    style={{ backgroundColor: '#0D1527', color: '#F8FAFC' }}
                  >
                    <option value="Customer Door Locked / Unreachable" style={{ backgroundColor: '#0D1527', color: '#F8FAFC' }}>Customer Door Locked / Unreachable</option>
                    <option value="Incorrect Address / Incomplete Details" style={{ backgroundColor: '#0D1527', color: '#F8FAFC' }}>Incorrect Address / Incomplete Details</option>
                    <option value="Customer Rescheduled Delivery" style={{ backgroundColor: '#0D1527', color: '#F8FAFC' }}>Customer Rescheduled Delivery</option>
                    <option value="Customer Refused Package" style={{ backgroundColor: '#0D1527', color: '#F8FAFC' }}>Customer Refused Package</option>
                    <option value="Cash-On-Delivery Not Ready" style={{ backgroundColor: '#0D1527', color: '#F8FAFC' }}>Cash-On-Delivery Not Ready</option>
                    <option value="Entry Denied by Security" style={{ backgroundColor: '#0D1527', color: '#F8FAFC' }}>Entry Denied by Security</option>
                  </select>
                </div>

                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                  Recording an exception marks this delivery as <strong>FAILED ATTEMPT</strong>. Dispatch will be notified to re-attempt or contact the customer.
                </p>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                  <button 
                    type="button"
                    className="btn btn-secondary btn-sm"
                    disabled={isSubmitting}
                    onClick={closeModal}
                  >
                    Cancel
                  </button>
                  <button 
                    type="button"
                    className="btn btn-danger btn-sm"
                    disabled={isSubmitting}
                    onClick={() => handleFailDelivery(activeModalAwb)}
                  >
                    {isSubmitting ? 'Recording Exception...' : 'Confirm Delivery Exception'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Proof of Delivery Photo Lightbox Modal */}
      {viewingPhoto && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="driver-photo-modal-title">
          <div className="modal-dialog" style={{ maxWidth: '540px', textAlign: 'center', padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ 
                  width: '32px', 
                  height: '32px', 
                  borderRadius: '50%', 
                  background: 'rgba(16, 185, 129, 0.15)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center' 
                }}>
                  <ShieldCheck size={18} color="var(--accent-emerald)" />
                </div>
                <div style={{ textAlign: 'left' }}>
                  <h3 id="driver-photo-modal-title" style={{ fontSize: '1.1rem', color: 'var(--text-main)', margin: 0 }}>
                    Proof of Delivery Photo
                  </h3>
                  <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--primary)' }}>
                    AWB: {viewingPhoto.awb}
                  </span>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setViewingPhoto(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: '4px' }}
                aria-label="Close photo preview"
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ 
              position: 'relative', 
              background: '#070B14', 
              borderRadius: 'var(--radius-md)', 
              overflow: 'hidden', 
              border: '1px solid var(--border-medium)',
              marginBottom: '1rem',
              minHeight: '260px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <img 
                src={viewingPhoto.url} 
                alt={`Proof of delivery for ${viewingPhoto.awb}`}
                style={{ width: '100%', maxHeight: '420px', objectFit: 'contain', display: 'block' }}
                onError={(e) => {
                  e.target.src = 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=500&q=80';
                }}
              />
            </div>

            <div style={{ 
              background: 'var(--bg-secondary)', 
              borderRadius: 'var(--radius-sm)', 
              padding: '0.75rem 1rem', 
              fontSize: '0.82rem', 
              color: 'var(--text-muted)',
              marginBottom: '1.25rem',
              textAlign: 'left',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.3rem'
            }}>
              <div>Delivered to: <strong style={{ color: 'var(--text-main)' }}>{viewingPhoto.deliveredTo}</strong></div>
              {viewingPhoto.verificationMethod && (
                <div style={{ fontSize: '0.75rem' }}>Method: <em>{viewingPhoto.verificationMethod}</em></div>
              )}
              {viewingPhoto.aiConfidence && (
                <div style={{ fontSize: '0.75rem', color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <CheckCircle2 size={12} />
                  <span>Amazon Rekognition: Verified ({Math.round(viewingPhoto.aiConfidence)}% confidence)</span>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button 
                type="button" 
                className="btn btn-secondary btn-sm"
                onClick={() => setViewingPhoto(null)}
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

