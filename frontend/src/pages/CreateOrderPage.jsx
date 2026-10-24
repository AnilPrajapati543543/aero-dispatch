import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Package, 
  MapPin, 
  Truck, 
  Plane, 
  Zap, 
  CheckCircle, 
  ArrowRight, 
  Calculator,
  Shield,
  FileText
} from 'lucide-react';

export default function CreateOrderPage() {
  const { addShipment, setActiveTab, setSelectedAwb, setTrackingQuery } = useApp();

  const [formData, setFormData] = useState({
    senderName: 'Sharma Electronics Hub',
    senderPhone: '+91 98112 34567',
    senderCity: 'New Delhi',
    senderState: 'Delhi',
    senderPin: '110037',
    senderAddress: 'Warehouse 14, Aerocity Logistics Hub',
    
    recipientName: '',
    recipientPhone: '',
    recipientCity: '',
    recipientState: '',
    recipientPin: '',
    recipientAddress: '',

    weightKg: '1.5',
    length: '25',
    width: '18',
    height: '10',
    category: 'Electronics',
    declaredValue: '3500',
    paymentMode: 'Prepaid',
    serviceTier: 'AeroExpress Air'
  });

  const [createdOrder, setCreatedOrder] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Quick weight-based shipping estimate calculation
  const weight = parseFloat(formData.weightKg) || 1.0;
  const volumetricWeight = ((parseFloat(formData.length) || 20) * (parseFloat(formData.width) || 15) * (parseFloat(formData.height) || 10)) / 5000;
  const billableWeight = Math.max(weight, volumetricWeight).toFixed(2);
  
  let rateMultiplier = 120;
  if (formData.serviceTier === 'AeroExpress Air') rateMultiplier = 190;
  if (formData.serviceTier === 'AeroHyperlocal Priority') rateMultiplier = 150;
  
  const estimatedShippingCost = Math.round(billableWeight * rateMultiplier + (formData.paymentMode === 'COD' ? 50 : 0));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.recipientName || !formData.recipientCity || !formData.recipientPin) {
      alert('Please fill out all required recipient fields.');
      return;
    }

    const newOrder = addShipment(formData);
    setCreatedOrder(newOrder);
  };

  return (
    <div style={{ maxWidth: '980px', margin: '1rem auto 4rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.35rem' }}>Create New Consignment</h1>
        <p style={{ color: 'var(--text-muted)' }}>
          Book a shipment, calculate volumetric charges, and generate a Delhivery-style Air Waybill (AWB) tracking number.
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

          <h2 style={{ fontSize: '1.75rem', marginBottom: '0.5rem', color: '#FFFFFF' }}>Consignment Manifested Successfully!</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.75rem' }}>
            Air Waybill tracking barcode generated locally for Phase 1.
          </p>

          {/* Delhivery-style Digital Shipping Label */}
          <div style={{ 
            maxWidth: '520px', 
            margin: '0 auto 2rem', 
            background: '#FFFFFF', 
            color: '#070B14', 
            borderRadius: 'var(--radius-md)', 
            padding: '1.5rem', 
            textAlign: 'left',
            boxShadow: 'var(--shadow-lg)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #000000', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
              <div>
                <span style={{ fontSize: '1.25rem', fontWeight: 900, letterSpacing: '-0.03em' }}>AERODISPATCH</span>
                <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700 }}>EXPRESS CARGO LINE</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800 }}>SERVICE: {createdOrder.serviceTier.toUpperCase()}</span>
                <span style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800 }}>MODE: {createdOrder.paymentMode}</span>
              </div>
            </div>

            {/* Barcode Display */}
            <div style={{ textAlign: 'center', margin: '1rem 0' }}>
              <div className="barcode-stripes" style={{ letterSpacing: '4px' }}>||| | |||| | |||||| || | ||</div>
              <div className="awb-number-display" style={{ fontSize: '1.25rem' }}>{createdOrder.awbNumber}</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', borderTop: '1px solid #CCCCCC', paddingTop: '0.75rem', fontSize: '0.8rem' }}>
              <div>
                <strong>SHIP TO:</strong>
                <div>{createdOrder.recipient.name}</div>
                <div>{createdOrder.recipient.address}</div>
                <div>{createdOrder.recipient.city}, {createdOrder.recipient.pinCode}</div>
                <div>Contact: {createdOrder.recipient.phone}</div>
              </div>
              <div>
                <strong>ORIGIN:</strong>
                <div>{createdOrder.sender.name}</div>
                <div>{createdOrder.sender.city}, {createdOrder.sender.pinCode}</div>
                <div style={{ marginTop: '0.5rem' }}>
                  <strong>WEIGHT:</strong> {createdOrder.weightKg} kg
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <button
              className="btn btn-primary"
              onClick={() => {
                setSelectedAwb(createdOrder.awbNumber);
                setTrackingQuery(createdOrder.awbNumber);
                setActiveTab('track');
              }}
            >
              <span>Track This Consignment Now</span>
              <ArrowRight size={16} />
            </button>

            <button
              className="btn btn-secondary"
              onClick={() => {
                setCreatedOrder(null);
                setFormData({
                  ...formData,
                  recipientName: '',
                  recipientPhone: '',
                  recipientCity: '',
                  recipientState: '',
                  recipientPin: '',
                  recipientAddress: ''
                });
              }}
            >
              <span>Create Another Shipment</span>
            </button>
          </div>
        </div>
      ) : (
        /* Create Order Wizard Form */
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
            {/* Origin Details */}
            <div className="card">
              <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)' }}>
                <MapPin size={18} />
                <span>Consignor (Origin Pickup)</span>
              </h3>

              <div className="form-group">
                <label className="form-label">Merchant / Sender Name *</label>
                <input 
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
                  <label className="form-label">City *</label>
                  <input 
                    type="text" 
                    name="senderCity" 
                    className="form-input" 
                    value={formData.senderCity} 
                    onChange={handleChange} 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Postal PIN Code *</label>
                  <input 
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
                <label className="form-label">Pickup Address *</label>
                <input 
                  type="text" 
                  name="senderAddress" 
                  className="form-input" 
                  value={formData.senderAddress} 
                  onChange={handleChange} 
                  required 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Phone Contact *</label>
                <input 
                  type="text" 
                  name="senderPhone" 
                  className="form-input" 
                  value={formData.senderPhone} 
                  onChange={handleChange} 
                  required 
                />
              </div>
            </div>

            {/* Destination Details */}
            <div className="card">
              <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-amber)' }}>
                <Truck size={18} />
                <span>Consignee (Destination Delivery)</span>
              </h3>

              <div className="form-group">
                <label className="form-label">Recipient Full Name *</label>
                <input 
                  type="text" 
                  name="recipientName" 
                  placeholder="e.g. Meera Krishnan" 
                  className="form-input" 
                  value={formData.recipientName} 
                  onChange={handleChange} 
                  required 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Destination City *</label>
                  <input 
                    type="text" 
                    name="recipientCity" 
                    placeholder="e.g. Mumbai" 
                    className="form-input" 
                    value={formData.recipientCity} 
                    onChange={handleChange} 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Destination PIN *</label>
                  <input 
                    type="text" 
                    name="recipientPin" 
                    placeholder="e.g. 400001" 
                    className="form-input" 
                    value={formData.recipientPin} 
                    onChange={handleChange} 
                    required 
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Delivery Street Address *</label>
                <input 
                  type="text" 
                  name="recipientAddress" 
                  placeholder="e.g. Flat 301, Palm Court, Marine Drive" 
                  className="form-input" 
                  value={formData.recipientAddress} 
                  onChange={handleChange} 
                  required 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Recipient Mobile Number *</label>
                <input 
                  type="text" 
                  name="recipientPhone" 
                  placeholder="e.g. +91 98200 44112" 
                  className="form-input" 
                  value={formData.recipientPhone} 
                  onChange={handleChange} 
                  required 
                />
              </div>
            </div>
          </div>

          {/* Parcel Specifications & Service Speed */}
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Package size={18} color="var(--primary)" />
              <span>Consignment Specifications &amp; Speed Tier</span>
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label">Dead Weight (Kg) *</label>
                <input 
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
                <label className="form-label">Length (cm)</label>
                <input 
                  type="number" 
                  name="length" 
                  className="form-input" 
                  value={formData.length} 
                  onChange={handleChange} 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Width (cm)</label>
                <input 
                  type="number" 
                  name="width" 
                  className="form-input" 
                  value={formData.width} 
                  onChange={handleChange} 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Height (cm)</label>
                <input 
                  type="number" 
                  name="height" 
                  className="form-input" 
                  value={formData.height} 
                  onChange={handleChange} 
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label">Parcel Category</label>
                <select name="category" className="form-select" value={formData.category} onChange={handleChange}>
                  <option value="Electronics">Consumer Electronics</option>
                  <option value="Apparel & Textiles">Apparel &amp; Fashion</option>
                  <option value="Healthcare Pharma">Healthcare &amp; Pharma</option>
                  <option value="Documents">Critical Documents</option>
                  <option value="General Parcel">General Cargo</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Declared Value (₹ INR)</label>
                <input 
                  type="number" 
                  name="declaredValue" 
                  className="form-input" 
                  value={formData.declaredValue} 
                  onChange={handleChange} 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Payment Mode</label>
                <select name="paymentMode" className="form-select" value={formData.paymentMode} onChange={handleChange}>
                  <option value="Prepaid">Prepaid (Digital Payment)</option>
                  <option value="COD">Cash on Delivery (COD)</option>
                </select>
              </div>
            </div>

            {/* Service Speed Tier Radio Cards */}
            <div className="form-group">
              <label className="form-label">Delivery Service Speed</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                <label style={{ 
                  border: formData.serviceTier === 'AeroExpress Air' ? '2px solid var(--primary)' : '1px solid var(--border-medium)',
                  background: formData.serviceTier === 'AeroExpress Air' ? 'rgba(0, 240, 255, 0.05)' : 'rgba(255, 255, 255, 0.02)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem',
                  cursor: 'pointer',
                  display: 'block'
                }}>
                  <input 
                    type="radio" 
                    name="serviceTier" 
                    value="AeroExpress Air" 
                    checked={formData.serviceTier === 'AeroExpress Air'} 
                    onChange={handleChange}
                    style={{ marginRight: '0.5rem' }} 
                  />
                  <strong>AeroExpress Air</strong>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    Priority Air Linehaul • 24 to 48 Hours
                  </div>
                </label>

                <label style={{ 
                  border: formData.serviceTier === 'AeroSurface Standard' ? '2px solid var(--primary)' : '1px solid var(--border-medium)',
                  background: formData.serviceTier === 'AeroSurface Standard' ? 'rgba(0, 240, 255, 0.05)' : 'rgba(255, 255, 255, 0.02)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem',
                  cursor: 'pointer',
                  display: 'block'
                }}>
                  <input 
                    type="radio" 
                    name="serviceTier" 
                    value="AeroSurface Standard" 
                    checked={formData.serviceTier === 'AeroSurface Standard'} 
                    onChange={handleChange}
                    style={{ marginRight: '0.5rem' }} 
                  />
                  <strong>AeroSurface Standard</strong>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    Interstate Surface Convoy • 3 to 5 Days
                  </div>
                </label>

                <label style={{ 
                  border: formData.serviceTier === 'AeroHyperlocal Priority' ? '2px solid var(--primary)' : '1px solid var(--border-medium)',
                  background: formData.serviceTier === 'AeroHyperlocal Priority' ? 'rgba(0, 240, 255, 0.05)' : 'rgba(255, 255, 255, 0.02)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem',
                  cursor: 'pointer',
                  display: 'block'
                }}>
                  <input 
                    type="radio" 
                    name="serviceTier" 
                    value="AeroHyperlocal Priority" 
                    checked={formData.serviceTier === 'AeroHyperlocal Priority'} 
                    onChange={handleChange}
                    style={{ marginRight: '0.5rem' }} 
                  />
                  <strong>AeroHyperlocal Priority</strong>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    Direct Same-Day EV Delivery
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Pricing & Booking Action */}
          <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem', background: 'rgba(13, 21, 39, 0.9)' }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
                Estimated Billable Rate (Volumetric: {volumetricWeight.toFixed(2)} kg)
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
                style={{ padding: '0.8rem 2rem', fontSize: '1rem' }}
              >
                <span>Generate AWB &amp; Manifest Consignment</span>
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
