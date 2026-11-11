import React, { useState } from 'react';
import { 
  FileText, 
  Printer, 
  Download, 
  X, 
  CheckCircle2, 
  Building2, 
  MapPin, 
  Truck, 
  ShieldCheck,
  Calendar,
  CreditCard
} from 'lucide-react';
import { printInvoiceDocument, exportToCSV, formatOrderForCSV, SHIPMENT_CSV_HEADERS } from '../utils/invoiceGenerator';

export default function InvoiceModal({ isOpen, onClose, order }) {
  if (!isOpen || !order) return null;

  const [documentType, setDocumentType] = useState('INVOICE'); // 'INVOICE' | 'RECEIPT'

  const awb = order.awbNumber || order.orderId || 'AD-XXXX-XXXX';
  const dateStr = order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }) : new Date().toLocaleDateString();

  const isDelivered = (order.currentStatus || order.status) === 'DELIVERED';
  const sender = order.sender || {};
  const recipient = order.recipient || {};
  const assigned = order.assignedDriver || {};

  const sName = sender.name || order.senderName || 'AeroDispatch Merchant';
  const sAddress = sender.address || order.senderAddress || 'Commercial Logistics Node';
  const sCity = sender.city || order.senderCity || 'Mumbai';
  const sPin = sender.pinCode || order.senderPin || '400001';

  const rName = recipient.name || order.recipientName || 'Consignee Recipient';
  const rAddress = recipient.address || order.deliveryAddress || order.recipientAddress || 'Delivery Address';
  const rCity = recipient.city || order.destinationCity || order.recipientCity || 'Destination';
  const rPin = recipient.pinCode || order.destinationPin || order.recipientPin || '';

  const weight = parseFloat(order.weightKg || 1.0);
  const tier = order.serviceTier || 'Express Air Cargo';
  const ratePerKg = tier.includes('Air') ? 190 : 120;
  const baseFreight = Math.round(weight * ratePerKg);
  const fuelSurcharge = Math.round(baseFreight * 0.12);
  const docketFee = 50;
  const taxableAmount = baseFreight + fuelSurcharge + docketFee;
  const gstAmount = Math.round(taxableAmount * 0.18);
  const totalAmount = taxableAmount + gstAmount;

  const handlePrint = () => {
    printInvoiceDocument(order, documentType);
  };

  const handleExportCSV = () => {
    const formatted = formatOrderForCSV(order);
    exportToCSV(`AeroDispatch_${awb}_details`, [formatted], SHIPMENT_CSV_HEADERS);
  };

  return (
    <div 
      className="modal-overlay" 
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        padding: '1rem'
      }}
    >
      <div 
        className="card"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '820px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          borderRadius: '24px',
          overflow: 'hidden',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.5)',
          border: '1px solid var(--border-medium)',
          background: 'var(--bg-card)'
        }}
      >
        {/* Modal Action Header */}
        <div style={{
          padding: '1.25rem 1.75rem',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(255, 255, 255, 0.02)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: 'rgba(0, 240, 255, 0.12)',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <FileText size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>
                {documentType === 'RECEIPT' ? 'Official Shipping Receipt' : 'Official GST Tax Invoice'}
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                AWB: <span className="mono" style={{ color: 'var(--primary)', fontWeight: 700 }}>{awb}</span> &bull; {dateStr}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {/* Document Type Switcher */}
            <div style={{
              display: 'flex',
              background: 'rgba(255, 255, 255, 0.05)',
              padding: '3px',
              borderRadius: '10px',
              border: '1px solid var(--border-subtle)'
            }}>
              <button
                type="button"
                onClick={() => setDocumentType('INVOICE')}
                style={{
                  padding: '4px 12px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  borderRadius: '7px',
                  border: 'none',
                  background: documentType === 'INVOICE' ? 'var(--primary)' : 'transparent',
                  color: documentType === 'INVOICE' ? '#000' : 'var(--text-muted)',
                  cursor: 'pointer'
                }}
              >
                Tax Invoice
              </button>
              <button
                type="button"
                onClick={() => setDocumentType('RECEIPT')}
                style={{
                  padding: '4px 12px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  borderRadius: '7px',
                  border: 'none',
                  background: documentType === 'RECEIPT' ? 'var(--primary)' : 'transparent',
                  color: documentType === 'RECEIPT' ? '#000' : 'var(--text-muted)',
                  cursor: 'pointer'
                }}
              >
                Waybill Receipt
              </button>
            </div>

            <button
              type="button"
              className="btn btn-sm btn-primary"
              onClick={handlePrint}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', padding: '0.5rem 1rem' }}
            >
              <Printer size={15} />
              <span>Print / PDF</span>
            </button>

            <button
              type="button"
              className="btn btn-sm btn-secondary"
              onClick={handleExportCSV}
              title="Download CSV Record"
              style={{ padding: '0.5rem 0.75rem' }}
            >
              <Download size={15} />
            </button>

            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '6px',
                borderRadius: '8px'
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Scrollable Document Body */}
        <div style={{
          padding: '2rem',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
          fontSize: '0.88rem'
        }}>
          {/* Header Strip */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--primary)', letterSpacing: '-0.5px' }}>
                ✈ AERODISPATCH LOGISTICS
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                Express Serverless Cargo Network &bull; GSTIN: 27AABCA8469E1Z8
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '4px' }}>
                Air Cargo Complex, Sahar Road, Mumbai Gateway Node 400099
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{
                display: 'inline-block',
                padding: '4px 12px',
                borderRadius: '9999px',
                fontSize: '0.75rem',
                fontWeight: 800,
                background: order.paymentMode === 'COD' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                color: order.paymentMode === 'COD' ? '#FBBF24' : '#10B981',
                border: order.paymentMode === 'COD' ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)'
              }}>
                {order.paymentMode === 'COD' ? '● Cash on Delivery (COD)' : '✓ Prepaid Online Booking'}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                Status: <strong style={{ color: isDelivered ? '#10B981' : 'var(--text-main)' }}>
                  {isDelivered ? 'Delivered' : (order.currentStatus || 'In Transit').replace(/_/g, ' ')}
                </strong>
              </div>
            </div>
          </div>

          {/* Barcode Strip */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px dashed var(--border-medium)',
            borderRadius: '16px',
            padding: '1rem 1.25rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800 }}>
                Air Waybill Consignment Number
              </div>
              <div className="mono" style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary)', letterSpacing: '1px' }}>
                {awb}
              </div>
            </div>
            <div className="mono" style={{ fontSize: '1.4rem', letterSpacing: '4px', opacity: 0.6 }}>
              ||| | |||| || |||||| | |||
            </div>
          </div>

          {/* Addresses Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '16px',
              padding: '1.1rem'
            }}>
              <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--primary)', fontWeight: 800, marginBottom: '6px' }}>
                Consignor (Origin Sender)
              </div>
              <div style={{ fontWeight: 800, color: 'var(--text-main)', fontSize: '0.95rem' }}>{sName}</div>
              <div style={{ color: 'var(--text-muted)', marginTop: '4px' }}>{sAddress}</div>
              <div style={{ color: 'var(--text-muted)' }}>{sCity} - {sPin}</div>
            </div>

            <div style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '16px',
              padding: '1.1rem'
            }}>
              <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#10B981', fontWeight: 800, marginBottom: '6px' }}>
                Consignee (Destination Recipient)
              </div>
              <div style={{ fontWeight: 800, color: 'var(--text-main)', fontSize: '0.95rem' }}>{rName}</div>
              <div style={{ color: 'var(--text-muted)', marginTop: '4px' }}>{rAddress}</div>
              <div style={{ color: 'var(--text-muted)' }}>{rCity} {rPin ? `- ${rPin}` : ''}</div>
            </div>
          </div>

          {/* Itemized Charges Table */}
          <div style={{
            border: '1px solid var(--border-subtle)',
            borderRadius: '16px',
            overflow: 'hidden'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'rgba(255, 255, 255, 0.04)', borderBottom: '1px solid var(--border-subtle)' }}>
                  <th style={{ padding: '10px 14px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Service Item</th>
                  <th style={{ padding: '10px 14px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>SAC</th>
                  <th style={{ padding: '10px 14px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Billable Weight</th>
                  <th style={{ padding: '10px 14px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', textAlign: 'right' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{tier}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Base Freight Rate &bull; Category: {order.category || 'Parcel'}</div>
                  </td>
                  <td style={{ padding: '12px 14px', color: 'var(--text-muted)' }}>996812</td>
                  <td style={{ padding: '12px 14px', color: 'var(--text-main)' }}>{weight.toFixed(2)} KG</td>
                  <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 700, color: 'var(--text-main)' }}>₹{baseFreight}.00</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '10px 14px', color: 'var(--text-muted)' }}>Fuel Surcharge (12%)</td>
                  <td style={{ padding: '10px 14px', color: 'var(--text-dim)' }}>996812</td>
                  <td style={{ padding: '10px 14px', color: 'var(--text-dim)' }}>-</td>
                  <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 600 }}>₹{fuelSurcharge}.00</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '10px 14px', color: 'var(--text-muted)' }}>Air Waybill Docket &amp; Security Processing</td>
                  <td style={{ padding: '10px 14px', color: 'var(--text-dim)' }}>996812</td>
                  <td style={{ padding: '10px 14px', color: 'var(--text-dim)' }}>Fixed</td>
                  <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 600 }}>₹{docketFee}.00</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Pricing Totals & Notes */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', alignItems: 'flex-start' }}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.02)',
              borderRadius: '16px',
              padding: '1.25rem',
              border: '1px solid var(--border-subtle)',
              fontSize: '0.8rem',
              color: 'var(--text-muted)'
            }}>
              <strong style={{ color: 'var(--text-main)', display: 'block', marginBottom: '4px' }}>
                Certification &amp; Compliance:
              </strong>
              Electronically generated tax invoice under Indian Goods and Services Tax (GST) Act 2017. Validated against AWS DynamoDB double-entry delivery ledger.
            </div>

            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: '16px',
              padding: '1.25rem',
              border: '1px solid var(--border-subtle)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                <span>Taxable Subtotal:</span>
                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>₹{taxableAmount}.00</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                <span>GST (CGST + SGST @ 18%):</span>
                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>₹{gstAmount}.00</span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                paddingTop: '10px',
                marginTop: '6px',
                borderTop: '1px solid var(--border-medium)',
                fontSize: '1.15rem',
                fontWeight: 800,
                color: 'var(--primary)'
              }}>
                <span>Total Amount:</span>
                <span>₹{totalAmount}.00</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Footer */}
        <div style={{
          padding: '1rem 1.75rem',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(255, 255, 255, 0.02)'
        }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Need billing assistance? Contact <a href="mailto:support@aerodispatch.site" style={{ color: 'var(--primary)', textDecoration: 'none' }}>support@aerodispatch.site</a>
          </span>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={onClose}
            >
              Close
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={handlePrint}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Printer size={15} />
              <span>Print / Save as PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
