import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Package,
  MapPin,
  Truck,
  CheckCircle,
  ArrowRight,
  Calculator,
  Printer,
  Sparkles
} from 'lucide-react';

const QUICK_DESTINATIONS = [
  { city: 'Mumbai', state: 'Maharashtra', pin: '400001', address: 'Flat 402, Sea View Heights, Worli' },
  { city: 'Bengaluru', state: 'Karnataka', pin: '560001', address: 'Tech Park Zone, 100 Feet Road, Indiranagar' },
  { city: 'Hyderabad', state: 'Telangana', pin: '500081', address: 'Tower B, HITEC City Logistics Gate' },
  { city: 'Kolkata', state: 'West Bengal', pin: '700001', address: 'BBD Bagh Commercial Arcade, Unit 12' },
];

export default function CreateOrderPage() {
  const { addShipment, setActiveTab, setSelectedAwb, setTrackingQuery, addToast, currentUser } = useApp();

  const [formData, setFormData] = useState({
    senderName: currentUser?.company || currentUser?.name || '',
    senderPhone: currentUser?.phone || currentUser?.phoneNumber || '',
    customerEmail: currentUser?.email || '',
    senderCity: '',
    senderState: '',
    senderPin: '',
    senderAddress: '',

    recipientName: '',
    recipientPhone: '',
    recipientCity: '',
    recipientState: '',
    recipientPin: '',
    recipientAddress: '',

    weightKg: '1.0',
    length: '25',
    width: '18',
    height: '10',
    category: 'Electronics',
    declaredValue: '3500',
    paymentMode: 'Prepaid',
    serviceTier: 'Express Air'
  });

  const [createdOrder, setCreatedOrder] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  // Service Skeleton Shimmer Loading - strictly 1.0s as requested
  const [isServiceLoading, setIsServiceLoading] = useState(true);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsServiceLoading(false);
    }, 1000); // 1.0s service skeleton loading
    return () => clearTimeout(timer);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const applyQuickDestination = (dest) => {
    setFormData(prev => ({
      ...prev,
      recipientName: prev.recipientName || 'Consignee Recipient',
      recipientPhone: prev.recipientPhone || '+91 98200 44112',
      recipientCity: dest.city,
      recipientState: dest.state,
      recipientPin: dest.pin,
      recipientAddress: dest.address
    }));
    setFormErrors({});
    addToast(`Applied destination: ${dest.city} (${dest.pin})`, 'info');
  };

  // Weight-based shipping estimate calculation
  const deadWeight = parseFloat(formData.weightKg) || 1.0;
  const volumetricWeight = ((parseFloat(formData.length) || 20) * (parseFloat(formData.width) || 15) * (parseFloat(formData.height) || 10)) / 5000;
  const isVolumetricHigher = volumetricWeight > deadWeight;
  const billableWeight = Math.max(deadWeight, volumetricWeight).toFixed(2);

  let rateMultiplier = 120;
  if (formData.serviceTier?.includes('Air') || formData.serviceTier === 'Express Air') rateMultiplier = 190;
  if (formData.serviceTier?.includes('Priority') || formData.serviceTier?.includes('Same-Day') || formData.serviceTier?.includes('Hyperlocal')) rateMultiplier = 150;

  const estimatedShippingCost = Math.round(billableWeight * rateMultiplier + (formData.paymentMode === 'COD' ? 50 : 0));

  const validateForm = () => {
    const errors = {};
    if (!formData.senderName?.trim()) errors.senderName = 'Sender / Merchant name is required.';
    if (!formData.senderPhone?.trim()) errors.senderPhone = 'Sender phone number is required.';
    if (!formData.recipientName?.trim()) errors.recipientName = 'Recipient name is required.';
    if (!formData.recipientPhone?.trim()) errors.recipientPhone = 'Recipient mobile is required.';
    if (!formData.recipientCity?.trim()) errors.recipientCity = 'City is required.';
    if (!formData.recipientPin?.trim()) errors.recipientPin = 'PIN code is required.';
    if (!formData.recipientAddress?.trim()) errors.recipientAddress = 'Street address is required.';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      addToast('Please complete all mandatory delivery address fields.', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const submissionData = {
        ...formData,
        senderName: formData.senderName.trim() || 'AeroDispatch Peenya Hub',
        senderPhone: formData.senderPhone.trim() || '+91 98200 11223',
        customerEmail: (formData.customerEmail || currentUser?.email || '').trim().toLowerCase()
      };
      const newOrder = await addShipment(submissionData);
      setCreatedOrder(newOrder);
      addToast(`Shipment ${newOrder.awbNumber} booked successfully!`, 'success');
    } catch (err) {
      addToast(`Booking failed: ${err.message}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '1rem auto 4rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.35rem' }}>Book New Shipment</h1>
        <p style={{ color: 'var(--text-muted)' }}>
          Book a shipment, calculate volumetric charges, and generate an express Air Waybill (AWB) tracking number.
        </p>
      </div>

      {createdOrder ? (
        /* Order Success & Digital Label View */
        <div className="card" style={{ borderColor: 'var(--accent-emerald)', padding: '2.5rem', textAlign: 'center' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'rgba(16, 185, 129, 0.15)',
            color: 'var(--accent-emerald)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.25rem'
          }}>
            <CheckCircle size={36} />
          </div>

          <h2 style={{ fontSize: '1.75rem', marginBottom: '0.5rem', color: 'var(--text-main)' }}>Shipment Booked Successfully!</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.75rem' }}>
            Unique Air Waybill barcode generated and registered with nationwide dispatch network.
          </p>

          {/* Professional Digital Air Shipping Label */}
          <div style={{
            maxWidth: '540px',
            margin: '0 auto 2rem',
            background: '#FFFFFF',
            color: '#070B14',
            borderRadius: '16px',
            border: '2px solid #E2E8F0',
            padding: '1.75rem 2rem',
            textAlign: 'left',
            boxShadow: '0 12px 36px rgba(0, 0, 0, 0.12)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #0F172A', paddingBottom: '0.85rem', marginBottom: '1.25rem' }}>
              <div>
                <span style={{ fontSize: '1.35rem', fontWeight: 900, letterSpacing: '-0.03em', color: '#0F172A' }}>AERODISPATCH</span>
                <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#475569', letterSpacing: '0.04em' }}>EXPRESS CARGO LINE</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0F172A' }}>SERVICE: {createdOrder.serviceTier.toUpperCase()}</span>
                <span style={{ display: 'block', fontSize: '0.88rem', fontWeight: 900, color: createdOrder.paymentMode === 'COD' ? '#D97706' : '#059669' }}>
                  MODE: {createdOrder.paymentMode}
                </span>
              </div>
            </div>

            {/* Barcode & Identifiers Display */}
            <div style={{ textAlign: 'center', margin: '1.25rem 0' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#475569', letterSpacing: '0.05em', marginBottom: '8px' }}>
                CUSTOMER ORDER ID: <strong>{createdOrder.displayOrderId || 'ORD-' + (createdOrder.awbNumber || '').replace('AD-', '')}</strong>
              </div>
              
              {/* Crisp SVG Barcode */}
              <div style={{ padding: '6px 0', display: 'flex', justifyContent: 'center' }}>
                <svg width="280" height="44" viewBox="0 0 280 44" style={{ display: 'block' }}>
                  <rect x="10" y="0" width="3" height="44" fill="#0F172A" />
                  <rect x="16" y="0" width="2" height="44" fill="#0F172A" />
                  <rect x="22" y="0" width="4" height="44" fill="#0F172A" />
                  <rect x="30" y="0" width="2" height="44" fill="#0F172A" />
                  <rect x="36" y="0" width="5" height="44" fill="#0F172A" />
                  <rect x="45" y="0" width="2" height="44" fill="#0F172A" />
                  <rect x="51" y="0" width="4" height="44" fill="#0F172A" />
                  <rect x="60" y="0" width="2" height="44" fill="#0F172A" />
                  <rect x="66" y="0" width="3" height="44" fill="#0F172A" />
                  <rect x="73" y="0" width="5" height="44" fill="#0F172A" />
                  <rect x="82" y="0" width="2" height="44" fill="#0F172A" />
                  <rect x="88" y="0" width="4" height="44" fill="#0F172A" />
                  <rect x="96" y="0" width="3" height="44" fill="#0F172A" />
                  <rect x="103" y="0" width="5" height="44" fill="#0F172A" />
                  <rect x="112" y="0" width="2" height="44" fill="#0F172A" />
                  <rect x="118" y="0" width="4" height="44" fill="#0F172A" />
                  <rect x="126" y="0" width="2" height="44" fill="#0F172A" />
                  <rect x="132" y="0" width="5" height="44" fill="#0F172A" />
                  <rect x="141" y="0" width="3" height="44" fill="#0F172A" />
                  <rect x="148" y="0" width="4" height="44" fill="#0F172A" />
                  <rect x="156" y="0" width="2" height="44" fill="#0F172A" />
                  <rect x="162" y="0" width="5" height="44" fill="#0F172A" />
                  <rect x="171" y="0" width="2" height="44" fill="#0F172A" />
                  <rect x="177" y="0" width="4" height="44" fill="#0F172A" />
                  <rect x="185" y="0" width="3" height="44" fill="#0F172A" />
                  <rect x="192" y="0" width="5" height="44" fill="#0F172A" />
                  <rect x="201" y="0" width="2" height="44" fill="#0F172A" />
                  <rect x="207" y="0" width="4" height="44" fill="#0F172A" />
                  <rect x="215" y="0" width="3" height="44" fill="#0F172A" />
                  <rect x="222" y="0" width="5" height="44" fill="#0F172A" />
                  <rect x="231" y="0" width="2" height="44" fill="#0F172A" />
                  <rect x="237" y="0" width="4" height="44" fill="#0F172A" />
                  <rect x="245" y="0" width="3" height="44" fill="#0F172A" />
                  <rect x="252" y="0" width="5" height="44" fill="#0F172A" />
                  <rect x="261" y="0" width="3" height="44" fill="#0F172A" />
                </svg>
              </div>

              <div className="awb-number-display" style={{ fontSize: '1.3rem', fontWeight: 900, color: '#0F172A', letterSpacing: '2px', marginTop: '6px' }}>
                AWB: {createdOrder.awbNumber}
              </div>
              <div style={{ display: 'inline-block', marginTop: '8px', padding: '4px 12px', background: 'rgba(16, 185, 129, 0.15)', color: '#059669', borderRadius: '9999px', fontSize: '0.78rem', fontWeight: 800 }}>
                ● Awaiting Nearby Delivery Captain Acceptance
              </div>
              <div style={{ marginTop: '8px', fontSize: '0.82rem', color: '#0284C7', fontWeight: 700 }}>
                ✉ Booking receipt &amp; live tracking map link dispatched to: {createdOrder.customerEmail || currentUser?.email || 'your registered email'}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', borderTop: '1px solid #E2E8F0', paddingTop: '1rem', fontSize: '0.85rem' }}>
              <div>
                <strong style={{ color: '#0F172A', fontSize: '0.78rem', letterSpacing: '0.04em' }}>SHIP TO:</strong>
                <div style={{ fontWeight: 800, color: '#0F172A', marginTop: '3px' }}>{createdOrder.recipient.name}</div>
                <div style={{ color: '#475569', fontSize: '0.82rem', marginTop: '2px' }}>{createdOrder.recipient.address}</div>
                <div style={{ color: '#475569', fontSize: '0.82rem' }}>{createdOrder.recipient.city}, {createdOrder.recipient.pinCode}</div>
                <div style={{ color: '#0F172A', fontWeight: 600, fontSize: '0.8rem', marginTop: '4px' }}>Contact: {createdOrder.recipient.phone}</div>
              </div>
              <div>
                <strong style={{ color: '#0F172A', fontSize: '0.78rem', letterSpacing: '0.04em' }}>ORIGIN:</strong>
                <div style={{ fontWeight: 800, color: '#0F172A', marginTop: '3px' }}>{createdOrder.sender.name}</div>
                <div style={{ color: '#475569', fontSize: '0.82rem', marginTop: '2px' }}>{createdOrder.sender.city}, {createdOrder.sender.pinCode}</div>
                <div style={{ marginTop: '0.75rem' }}>
                  <strong style={{ color: '#0F172A' }}>BILLABLE WEIGHT:</strong> {createdOrder.weightKg} kg
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
            <button
              className="btn btn-primary"
              onClick={() => {
                setSelectedAwb(createdOrder.awbNumber);
                setTrackingQuery(createdOrder.awbNumber);
                setActiveTab('track');
              }}
            >
              <span>Track This Shipment</span>
              <ArrowRight size={16} />
            </button>

            <button
              className="btn btn-secondary"
              onClick={() => {
                setSelectedAwb(createdOrder.awbNumber);
                setActiveTab('shipments');
              }}
            >
              <Package size={16} />
              <span>View in All Shipments</span>
            </button>

            <button
              style={{
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                color: '#ffffff',
                border: 'none',
                padding: '0.65rem 1.25rem',
                borderRadius: '8px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)'
              }}
              onClick={() => {
                setSelectedAwb(createdOrder.awbNumber);
                setTrackingQuery(createdOrder.awbNumber);
                setActiveTab('track');
              }}
            >
              <CheckCircle size={16} />
              <span>Deliver &amp; Submit Proof (POD)</span>
            </button>

            <button
              className="btn btn-secondary"
              onClick={() => window.print()}
            >
              <Printer size={16} />
              <span>Print Label</span>
            </button>

            <button
              className="btn btn-secondary"
              onClick={() => {
                setCreatedOrder(null);
                setFormData(prev => ({
                  ...prev,
                  recipientName: '',
                  recipientPhone: '',
                  recipientCity: '',
                  recipientState: '',
                  recipientPin: '',
                  recipientAddress: ''
                }));
              }}
            >
              <span>Create Another Shipment</span>
            </button>
          </div>
        </div>
      ) : (
        /* Create Order Wizard Form */
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
            {/* Origin Details */}
            <div className="card">
              <h2 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)' }}>
                <MapPin size={18} />
                <span>Sender (Pickup Address)</span>
              </h2>

              <div className="form-group">
                <label className="form-label" htmlFor="sender-name">Sender Name *</label>
                <input
                  id="sender-name"
                  type="text"
                  name="senderName"
                  className="form-input"
                  value={formData.senderName}
                  onChange={handleChange}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="sender-city">Origin City *</label>
                  <input
                    id="sender-city"
                    type="text"
                    name="senderCity"
                    className="form-input"
                    value={formData.senderCity}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="sender-pin">Postal PIN Code *</label>
                  <input
                    id="sender-pin"
                    type="text"
                    name="senderPin"
                    className="form-input"
                    value={formData.senderPin}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="sender-address">Pickup Warehouse Address *</label>
                <input
                  id="sender-address"
                  type="text"
                  name="senderAddress"
                  className="form-input"
                  value={formData.senderAddress}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="sender-phone">Phone Contact *</label>
                <input
                  id="sender-phone"
                  type="text"
                  name="senderPhone"
                  className="form-input"
                  value={formData.senderPhone}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="customer-email">Customer Notification Email * (For Booking Receipt &amp; Live Tracking Map Link)</label>
                <input
                  id="customer-email"
                  type="email"
                  name="customerEmail"
                  className="form-input"
                  placeholder="e.g. yourname@gmail.com"
                  value={formData.customerEmail}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Destination Details */}
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <h2 style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-amber)' }}>
                  <Truck size={18} />
                  <span>Recipient (Delivery Address)</span>
                </h2>
              </div>

              {/* Quick Preset Chips */}
              <div style={{ marginBottom: '1rem', padding: '0.65rem 0.85rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Sparkles size={12} color="var(--primary)" />
                  <span>Quick Autofill Presets:</span>
                </div>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  {QUICK_DESTINATIONS.map(d => (
                    <button
                      key={d.city}
                      type="button"
                      className="btn btn-sm btn-secondary"
                      style={{ fontSize: '0.72rem', padding: '2px 8px' }}
                      onClick={() => applyQuickDestination(d)}
                    >
                      {d.city} ({d.pin})
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="recipient-name">Recipient Full Name *</label>
                <input
                  id="recipient-name"
                  type="text"
                  name="recipientName"
                  placeholder="e.g. Meera Krishnan"
                  className="form-input"
                  value={formData.recipientName}
                  onChange={handleChange}
                  required
                />
                {formErrors.recipientName && (
                  <span style={{ fontSize: '0.72rem', color: 'var(--accent-rose)' }}>{formErrors.recipientName}</span>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="recipient-city">Destination City *</label>
                  <input
                    id="recipient-city"
                    type="text"
                    name="recipientCity"
                    placeholder="e.g. Mumbai"
                    className="form-input"
                    value={formData.recipientCity}
                    onChange={handleChange}
                    required
                  />
                  {formErrors.recipientCity && (
                    <span style={{ fontSize: '0.72rem', color: 'var(--accent-rose)' }}>{formErrors.recipientCity}</span>
                  )}
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="recipient-pin">Postal PIN Code *</label>
                  <input
                    id="recipient-pin"
                    type="text"
                    name="recipientPin"
                    placeholder="e.g. 400001"
                    className="form-input"
                    value={formData.recipientPin}
                    onChange={handleChange}
                    required
                  />
                  {formErrors.recipientPin && (
                    <span style={{ fontSize: '0.72rem', color: 'var(--accent-rose)' }}>{formErrors.recipientPin}</span>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="recipient-address">Delivery Street Address *</label>
                <input
                  id="recipient-address"
                  type="text"
                  name="recipientAddress"
                  placeholder="e.g. Flat 301, Palm Court, Marine Drive"
                  className="form-input"
                  value={formData.recipientAddress}
                  onChange={handleChange}
                  required
                />
                {formErrors.recipientAddress && (
                  <span style={{ fontSize: '0.72rem', color: 'var(--accent-rose)' }}>{formErrors.recipientAddress}</span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="recipient-phone">Recipient Mobile Number *</label>
                <input
                  id="recipient-phone"
                  type="text"
                  name="recipientPhone"
                  placeholder="e.g. +91 98200 44112"
                  className="form-input"
                  value={formData.recipientPhone}
                  onChange={handleChange}
                  required
                />
                {formErrors.recipientPhone && (
                  <span style={{ fontSize: '0.72rem', color: 'var(--accent-rose)' }}>{formErrors.recipientPhone}</span>
                )}
              </div>
            </div>
          </div>

          {/* Parcel Specifications & Service Speed */}
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Package size={18} color="var(--primary)" />
              <span>Package Details &amp; Speed Tier</span>
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="dead-weight">Dead Weight (Kg) *</label>
                <input
                  id="dead-weight"
                  type="number"
                  step="0.1"
                  name="weightKg"
                  className="form-input"
                  value={formData.weightKg}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="dim-length">Length (cm)</label>
                <input
                  id="dim-length"
                  type="number"
                  name="length"
                  className="form-input"
                  value={formData.length}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="dim-width">Width (cm)</label>
                <input
                  id="dim-width"
                  type="number"
                  name="width"
                  className="form-input"
                  value={formData.width}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="dim-height">Height (cm)</label>
                <input
                  id="dim-height"
                  type="number"
                  name="height"
                  className="form-input"
                  value={formData.height}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Volumetric Weight Visual Comparison Box */}
            <div style={{
              marginBottom: '1.25rem',
              padding: '0.85rem 1.25rem',
              background: 'rgba(255, 255, 255, 0.02)',
              borderRadius: '20px',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Calculator size={18} color="var(--primary)" />
                <span style={{ fontSize: '0.85rem' }}>
                  Dead Weight: <strong>{deadWeight} kg</strong> vs. Volumetric: <strong>{volumetricWeight.toFixed(2)} kg</strong>
                </span>
              </div>
              <div style={{ fontSize: '0.8rem' }}>
                <span>Billable: </span>
                <strong style={{ color: 'var(--primary)', fontSize: '0.95rem' }}>{billableWeight} kg</strong>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginLeft: '0.4rem' }}>
                  ({isVolumetricHigher ? 'Volumetric applies' : 'Dead weight applies'})
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="parcel-cat">Parcel Category</label>
                <select
                  id="parcel-cat"
                  name="category"
                  className="form-select input-field"
                  value={formData.category}
                  onChange={handleChange}
                  style={{ backgroundColor: '#0D1527', color: '#F8FAFC' }}
                >
                  <option value="Electronics" style={{ backgroundColor: '#0D1527', color: '#F8FAFC' }}>Consumer Electronics</option>
                  <option value="Apparel & Textiles" style={{ backgroundColor: '#0D1527', color: '#F8FAFC' }}>Apparel &amp; Fashion</option>
                  <option value="Healthcare Pharma" style={{ backgroundColor: '#0D1527', color: '#F8FAFC' }}>Healthcare &amp; Pharma</option>
                  <option value="Documents" style={{ backgroundColor: '#0D1527', color: '#F8FAFC' }}>Critical Documents</option>
                  <option value="General Parcel" style={{ backgroundColor: '#0D1527', color: '#F8FAFC' }}>General Cargo</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="declared-val">Declared Value (₹ INR)</label>
                <input
                  id="declared-val"
                  type="number"
                  name="declaredValue"
                  className="form-input"
                  value={formData.declaredValue}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="payment-mode">Payment Mode</label>
                <select
                  id="payment-mode"
                  name="paymentMode"
                  className="form-select input-field"
                  value={formData.paymentMode}
                  onChange={handleChange}
                  style={{ backgroundColor: '#0D1527', color: '#F8FAFC' }}
                >
                  <option value="Prepaid" style={{ backgroundColor: '#0D1527', color: '#F8FAFC' }}>Prepaid (Digital Payment)</option>
                  <option value="COD" style={{ backgroundColor: '#0D1527', color: '#F8FAFC' }}>Cash on Delivery (COD + ₹50 fee)</option>
                </select>
              </div>
            </div>

            {/* Service Speed Tier Radio Cards */}
            <div className="form-group">
              <label className="form-label">Delivery Service Speed</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                <label style={{
                  border: formData.serviceTier === 'Express Air' ? '2px solid var(--primary)' : '1px solid var(--border-medium)',
                  background: formData.serviceTier === 'Express Air' ? 'rgba(0, 240, 255, 0.05)' : 'rgba(255, 255, 255, 0.02)',
                  borderRadius: '20px',
                  padding: '1.1rem 1.25rem',
                  cursor: 'pointer',
                  display: 'block',
                  transition: 'all 0.2s cubic-bezier(0.2, 0, 0, 1)'
                }}>
                  <input
                    type="radio"
                    name="serviceTier"
                    value="Express Air"
                    checked={formData.serviceTier === 'Express Air'}
                    onChange={handleChange}
                    style={{ marginRight: '0.5rem' }}
                  />
                  <strong>Express Air</strong>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    Priority Air Linehaul • 24 to 48 Hours
                  </div>
                </label>

                <label style={{
                  border: formData.serviceTier === 'Standard Surface' ? '2px solid var(--primary)' : '1px solid var(--border-medium)',
                  background: formData.serviceTier === 'Standard Surface' ? 'rgba(0, 240, 255, 0.05)' : 'rgba(255, 255, 255, 0.02)',
                  borderRadius: '20px',
                  padding: '1.1rem 1.25rem',
                  cursor: 'pointer',
                  display: 'block',
                  transition: 'all 0.2s cubic-bezier(0.2, 0, 0, 1)'
                }}>
                  <input
                    type="radio"
                    name="serviceTier"
                    value="Standard Surface"
                    checked={formData.serviceTier === 'Standard Surface'}
                    onChange={handleChange}
                    style={{ marginRight: '0.5rem' }}
                  />
                  <strong>Standard Surface</strong>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    Interstate Surface Convoy • 3 to 5 Days
                  </div>
                </label>

                <label style={{
                  border: formData.serviceTier === 'Same-Day Priority' ? '2px solid var(--primary)' : '1px solid var(--border-medium)',
                  background: formData.serviceTier === 'Same-Day Priority' ? 'rgba(0, 240, 255, 0.05)' : 'rgba(255, 255, 255, 0.02)',
                  borderRadius: '20px',
                  padding: '1.1rem 1.25rem',
                  cursor: 'pointer',
                  display: 'block',
                  transition: 'all 0.2s cubic-bezier(0.2, 0, 0, 1)'
                }}>
                  <input
                    type="radio"
                    name="serviceTier"
                    value="Same-Day Priority"
                    checked={formData.serviceTier === 'Same-Day Priority'}
                    onChange={handleChange}
                    style={{ marginRight: '0.5rem' }}
                  />
                  <strong>Same-Day Priority</strong>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    Direct Same-Day EV Delivery
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Pricing & Booking Action */}
          <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
                Estimated Billable Rate (Billable: {billableWeight} kg)
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary)' }}>
                ₹{estimatedShippingCost} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 500 }}>incl. all taxes &amp; fuel surcharge</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setActiveTab('customer')}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ padding: '0.8rem 2rem', fontSize: '1rem', opacity: isSubmitting ? 0.75 : 1 }}
                disabled={isSubmitting}
              >
                <span>{isSubmitting ? 'Booking Shipment...' : 'Book Shipment & Generate AWB'}</span>
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
