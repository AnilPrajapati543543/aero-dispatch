import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import StatusBadge from '../components/StatusBadge';
import CopyButton from '../components/CopyButton';
import TrackingTimeline from '../components/TrackingTimeline';
import CustomSelect from '../components/CustomSelect';
import ProfileOverviewCard from '../components/ProfileOverviewCard';
import { SkeletonTableRows } from '../components/SkeletonLoading';
import { 
  Package, 
  Search, 
  Filter, 
  PlusCircle, 
  ChevronLeft, 
  ChevronRight, 
  Eye, 
  Clock,
  MapPin, 
  Calendar, 
  Download, 
  ExternalLink,
  Printer,
  CheckCircle2,
  X,
  User,
  Truck,
  Layers,
  ArrowUpDown,
  Settings
} from 'lucide-react';

export default function ShipmentManagementPage() {
  const { 
    shipments, 
    visibleShipments,
    currentUser,
    setActiveTab, 
    setSelectedAwb, 
    addToast,
    openChatbox
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedTier, setSelectedTier] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [inspectingShipment, setInspectingShipment] = useState(null);
  const itemsPerPage = 7;

  // Management Skeleton Shimmer Loading - strictly 1.0s as requested
  const [isManagementLoading, setIsManagementLoading] = useState(true);

  useEffect(() => {
    setIsManagementLoading(true);
    const timer = setTimeout(() => {
      setIsManagementLoading(false);
    }, 1000); // 1.0 second management skeleton loading
    return () => clearTimeout(timer);
  }, [selectedStatus, selectedTier]);

  // Base list strictly isolated by role: customers only see their orders, drivers see assigned, admin sees all
  const baseShipments = useMemo(() => {
    if (currentUser?.role === 'admin') return shipments;
    return visibleShipments || [];
  }, [currentUser, shipments, visibleShipments]);

  const statusOptions = [
    { value: 'ALL', label: 'All Statuses' },
    { value: 'BOOKED', label: 'Booked' },
    { value: 'IN_TRANSIT', label: 'In Transit' },
    { value: 'OUT_FOR_DELIVERY', label: 'Out for Delivery' },
    { value: 'DELIVERED', label: 'Delivered' },
    { value: 'FAILED_ATTEMPT', label: 'Exceptions' }
  ];

  // Filter & Search Logic
  const filteredShipments = useMemo(() => {
    return baseShipments.filter(s => {
      // Status filter
      if (selectedStatus !== 'ALL') {
        if (selectedStatus === 'FAILED_ATTEMPT') {
          if (s.currentStatus !== 'FAILED_ATTEMPT' && s.currentStatus !== 'DELAYED') return false;
        } else if (s.currentStatus !== selectedStatus) {
          return false;
        }
      }

      // Tier filter
      if (selectedTier !== 'ALL' && s.serviceTier !== selectedTier) {
        return false;
      }

      // Query search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const awbMatch = s.awbNumber?.toLowerCase().includes(q);
        const senderMatch = s.sender?.name?.toLowerCase().includes(q) || s.sender?.city?.toLowerCase().includes(q);
        const recipientMatch = s.recipient?.name?.toLowerCase().includes(q) || s.recipient?.city?.toLowerCase().includes(q);
        const categoryMatch = s.category?.toLowerCase().includes(q);
        if (!awbMatch && !senderMatch && !recipientMatch && !categoryMatch) return false;
      }

      return true;
    });
  }, [baseShipments, selectedStatus, selectedTier, searchQuery]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredShipments.length / itemsPerPage));
  const paginatedShipments = filteredShipments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleExportCSV = () => {
    const headers = ["AWB Number", "Service Tier", "Status", "Sender", "Sender City", "Recipient", "Recipient City", "Weight (kg)", "Declared Value"];
    const rows = filteredShipments.map(s => [
      s.awbNumber,
      s.serviceTier,
      s.currentStatus,
      `"${s.sender?.name || ''}"`,
      s.sender?.city || '',
      `"${s.recipient?.name || ''}"`,
      s.recipient?.city || '',
      s.weightKg,
      s.declaredValue
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `aerodispatch_shipments_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast(`Exported ${filteredShipments.length} shipments to CSV`, 'success');
  };

  return (
    <div className="dashboard-content" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* 1. Header & Quick Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '2px 8px', borderRadius: '9999px', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.35rem', background: currentUser?.role === 'admin' ? 'rgba(99, 102, 241, 0.15)' : currentUser?.role === 'driver' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(0, 240, 255, 0.12)', color: currentUser?.role === 'admin' ? '#818CF8' : currentUser?.role === 'driver' ? '#FBBF24' : '#00F0FF', border: `1px solid ${currentUser?.role === 'admin' ? 'rgba(99, 102, 241, 0.3)' : currentUser?.role === 'driver' ? 'rgba(245, 158, 11, 0.3)' : 'rgba(0, 240, 255, 0.25)'}` }}>
            {currentUser?.role === 'admin' ? 'Admin' : currentUser?.role === 'driver' ? 'Driver Portal' : 'Customer Portal'}
          </div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
            {currentUser?.role === 'customer' ? 'My Shipments & Bookings' : currentUser?.role === 'driver' ? 'Assigned Route Deliveries' : 'National Shipments Database'}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.2rem' }}>
            {currentUser?.role === 'customer' 
              ? `Account: ${currentUser?.name || 'Customer Account'} (${currentUser?.company || 'Business Merchant'}). Showing exclusively orders booked by or addressed to your account.`
              : currentUser?.role === 'driver'
              ? `Assigned deliveries for ${currentUser?.name || 'Courier Associate'} (${currentUser?.driverId || 'DRV-Active'}).`
              : 'Filter, search, inspect, and export express shipments across all active hubs.'
            }
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button 
            className="btn btn-secondary btn-sm"
            onClick={() => setActiveTab('settings')}
            title="Account & Profile Settings"
          >
            <Settings size={14} />
            <span>Profile &amp; Settings</span>
          </button>

          <button 
            className="btn btn-secondary btn-sm"
            onClick={handleExportCSV}
            title="Download CSV export"
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>

          {currentUser?.role !== 'driver' && (
            <button 
              className="btn btn-primary"
              onClick={() => setActiveTab('create-order')}
            >
              <PlusCircle size={16} />
              <span>Book Parcel</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Customer Profile Hero Card (Exact Google Rounded Card Layout with 5 Capsule Stat Pills) */}
      {currentUser?.role === 'customer' && (
        <ProfileOverviewCard allowInlineEdit={true} />
      )}

      {/* 3. Filter & Search Control Bar */}
      <div className="card" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Search Box */}
          <div style={{ position: 'relative', flex: 1, minWidth: '260px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
            <input 
              type="text"
              placeholder="Search by AWB, sender, recipient, city, category..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="input-field"
              style={{ paddingLeft: '2.4rem' }}
            />
          </div>

          {/* Status Filter Buttons */}
          <div style={{ display: 'flex', gap: '0.35rem', overflowX: 'auto', paddingBottom: '2px' }}>
            {statusOptions.map(opt => (
              <button
                key={opt.value}
                className={`btn btn-sm ${selectedStatus === opt.value ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem', whiteSpace: 'nowrap' }}
                onClick={() => { setSelectedStatus(opt.value); setCurrentPage(1); }}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Tier Filter Dropdown (Custom High-Contrast Aviation Component) */}
          <CustomSelect 
            id="shipment-tier-filter"
            value={selectedTier}
            onChange={(e) => { setSelectedTier(e.target.value); setCurrentPage(1); }}
            options={[
              { value: 'ALL', label: 'All Service Tiers' },
              { value: 'Express Air', label: 'Express Air' },
              { value: 'Standard Surface', label: 'Standard Surface' },
              { value: 'Same-Day Priority', label: 'Same-Day Priority' }
            ]}
            style={{ width: 'auto', minWidth: '170px' }}
          />
        </div>
      </div>

      {/* 3. Main Shipments Table */}
      <div className="card" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Showing <strong>{filteredShipments.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}</strong> - <strong>{Math.min(currentPage * itemsPerPage, filteredShipments.length)}</strong> of <strong>{filteredShipments.length}</strong> shipments
          </span>
          {isManagementLoading && (
            <span style={{ fontSize: '0.75rem', color: '#10B981', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981', animation: 'aeroBeaconPing 1s infinite' }} />
              Updating Shipment Manifest (2.5s)
            </span>
          )}
        </div>

        {isManagementLoading ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-medium)', color: 'var(--text-dim)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Air Waybill</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Sender (Origin)</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Recipient (Destination)</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Parcel Specs</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Service Tier</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Status</th>
                  <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                <SkeletonTableRows rows={6} cols={7} />
              </tbody>
            </table>
          </div>
        ) : paginatedShipments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
            <Package size={42} color="var(--text-dim)" style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
            <h3 style={{ fontSize: '1.1rem', color: 'var(--text-main)', marginBottom: '0.35rem' }}>No shipments found</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', maxWidth: '400px', margin: '0 auto 1.25rem' }}>
              No shipments matched your search criteria. Try modifying your filter or create a new shipment.
            </p>
            <button 
              className="btn btn-secondary btn-sm"
              onClick={() => { setSearchQuery(''); setSelectedStatus('ALL'); setSelectedTier('ALL'); }}
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-medium)', color: 'var(--text-dim)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Air Waybill</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Sender (Origin)</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Recipient (Destination)</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Parcel Specs</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Service Tier</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Status</th>
                  <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedShipments.map((s) => (
                  <tr 
                    key={s.awbNumber}
                    style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'background 0.15s ease' }}
                    className="table-row-hover"
                  >
                    {/* AWB & Order ID */}
                    <td style={{ padding: '0.85rem 0.5rem' }}>
                      <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 700 }}>
                        ORDER: {s.displayOrderId || 'ORD-' + (s.awbNumber || '').replace('AD-', '')}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                        <span className="mono" style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '0.9rem' }}>
                          {s.awbNumber}
                        </span>
                        <CopyButton text={s.awbNumber} size="sm" label="" />
                      </div>
                      {s.assignedDriver ? (
                        <div style={{ fontSize: '0.72rem', color: '#10B981', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '3px', marginTop: '2px' }}>
                          <Truck size={11} /> Driver: {s.assignedDriver.name}
                        </div>
                      ) : (
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                          Created: {s.createdAt?.slice(0, 10) || 'Recent'}
                        </div>
                      )}
                    </td>

                    {/* Sender */}
                    <td style={{ padding: '0.85rem 0.5rem' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{s.sender?.name}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {s.sender?.city}, {s.sender?.pinCode}
                      </div>
                    </td>

                    {/* Recipient */}
                    <td style={{ padding: '0.85rem 0.5rem' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{s.recipient?.name}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {s.recipient?.city}, {s.recipient?.pinCode}
                      </div>
                    </td>

                    {/* Specs */}
                    <td style={{ padding: '0.85rem 0.5rem' }}>
                      <div style={{ color: '#E2E8F0' }}>{s.weightKg} kg</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                        {s.category || 'Parcel'} • ₹{s.declaredValue?.toLocaleString() || 1500}
                      </div>
                    </td>

                    {/* Tier */}
                    <td style={{ padding: '0.85rem 0.5rem' }}>
                      <span style={{ fontSize: '0.78rem', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: s.serviceTier?.includes('Air') ? 'var(--primary)' : 'var(--secondary)' }} />
                        {s.serviceTier}
                      </span>
                    </td>

                    {/* Status */}
                    <td style={{ padding: '0.85rem 0.5rem' }}>
                      <StatusBadge status={s.currentStatus} />
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '0.85rem 0.5rem', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                        <button
                          className="btn btn-sm btn-secondary"
                          onClick={() => setInspectingShipment(s)}
                          style={{ padding: '0.3rem 0.55rem' }}
                          title="Inspect shipment details"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          className="btn btn-sm btn-outline-cyan"
                          onClick={() => {
                            setSelectedAwb(s.awbNumber);
                            setActiveTab('track');
                          }}
                          style={{ padding: '0.3rem 0.55rem' }}
                          title="Open shipment tracking"
                        >
                          <ExternalLink size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 4. Pagination Bar */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
            </span>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                className="btn btn-sm btn-secondary"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              >
                <ChevronLeft size={14} />
                <span>Previous</span>
              </button>

              <button
                className="btn btn-sm btn-secondary"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              >
                <span>Next</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 5. Detailed Consignment Slide-Over Modal */}
      {inspectingShipment && (() => {
        const sender = typeof inspectingShipment.sender === 'object' && inspectingShipment.sender !== null 
          ? inspectingShipment.sender 
          : { name: inspectingShipment.sender || inspectingShipment.senderName || 'Merchant Origin Facility', address: inspectingShipment.senderAddress || 'Terminal Booking Station', city: inspectingShipment.senderCity || 'Origin Hub', state: inspectingShipment.senderState || 'Cargo Hub', pinCode: inspectingShipment.senderPin || '400001', phone: inspectingShipment.senderPhone || '+91 98000 00000' };

        const recipient = typeof inspectingShipment.recipient === 'object' && inspectingShipment.recipient !== null 
          ? inspectingShipment.recipient 
          : { name: inspectingShipment.recipient || inspectingShipment.recipientName || 'Delivery Consignee', address: inspectingShipment.recipientAddress || 'Doorstep Delivery Address', city: inspectingShipment.recipientCity || 'Destination Metro', state: inspectingShipment.recipientState || 'Transit Zone', pinCode: inspectingShipment.recipientPin || '500001', phone: inspectingShipment.recipientPhone || '+91 99000 00000' };

        const driver = inspectingShipment.assignedDriver;

        return (
          <div 
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.75)',
              backdropFilter: 'blur(6px)',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1.5rem'
            }}
            onClick={() => setInspectingShipment(null)}
          >
            <div 
              className="card"
              style={{
                width: '100%',
                maxWidth: '740px',
                maxHeight: '90vh',
                overflowY: 'auto',
                padding: '2rem',
                position: 'relative',
                borderRadius: '24px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-medium)',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.35)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button 
                className="btn btn-sm btn-secondary"
                onClick={() => setInspectingShipment(null)}
                style={{ position: 'absolute', right: '1.25rem', top: '1.25rem', padding: '0.4rem', borderRadius: '50%' }}
                title="Close consignment inspector"
              >
                <X size={16} />
              </button>

              {/* Modal Header */}
              <div style={{ marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
                  <span className="mono" style={{ fontSize: '1.45rem', fontWeight: 900, color: 'var(--primary)' }}>
                    {inspectingShipment.awbNumber}
                  </span>
                  <StatusBadge status={inspectingShipment.currentStatus} />
                  <span style={{ fontSize: '0.75rem', padding: '3px 10px', borderRadius: '9999px', background: 'var(--bg-secondary)', border: '1px solid var(--border-medium)', color: 'var(--text-muted)', fontWeight: 700 }}>
                    ORDER: {inspectingShipment.displayOrderId || ('ORD-' + (inspectingShipment.awbNumber || '').replace('AD-', ''))}
                  </span>
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
                  Service Tier: <strong style={{ color: 'var(--text-main)' }}>{inspectingShipment.serviceTier || 'Priority Air'}</strong> • 
                  Category: <strong style={{ color: 'var(--text-main)' }}>{inspectingShipment.category || 'General Cargo'}</strong> • 
                  Payment: <strong style={{ color: inspectingShipment.paymentMode === 'COD' ? '#F59E0B' : '#10B981' }}>{inspectingShipment.paymentMode || 'Prepaid'}</strong>
                </p>
              </div>

              {/* Sender & Recipient Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
                <div style={{ padding: '1.25rem', background: 'var(--bg-secondary)', borderRadius: '18px', border: '1px solid var(--border-medium)' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Origin &amp; Shipper
                  </span>
                  <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.4rem' }}>
                    {sender.name || 'Merchant Shipper'}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.25rem', lineHeight: 1.4 }}>
                    {sender.address || 'Cargo Facility'}<br />
                    {sender.city}{sender.state ? `, ${sender.state}` : ''} {sender.pinCode ? `- ${sender.pinCode}` : ''}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '0.5rem', fontWeight: 600 }}>
                    Phone: {sender.phone || '+91 98000 00000'}
                  </div>
                </div>

                <div style={{ padding: '1.25rem', background: 'var(--bg-secondary)', borderRadius: '18px', border: '1px solid var(--border-medium)' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#EF4444', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Destination &amp; Recipient
                  </span>
                  <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.4rem' }}>
                    {recipient.name || 'Consignee'}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.25rem', lineHeight: 1.4 }}>
                    {recipient.address || 'Delivery Address'}<br />
                    {recipient.city}{recipient.state ? `, ${recipient.state}` : ''} {recipient.pinCode ? `- ${recipient.pinCode}` : ''}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '0.5rem', fontWeight: 600 }}>
                    Phone: {recipient.phone || '+91 99000 00000'}
                  </div>
                </div>
              </div>

              {/* Assigned Captain Card */}
              {driver ? (
                <div style={{ padding: '1.25rem', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.35)', borderRadius: '18px', marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                      <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10B981', flexShrink: 0 }}>
                        <Truck size={22} />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#10B981', fontWeight: 800, letterSpacing: '0.04em' }}>
                          ✓ Delivery Captain Assigned
                        </div>
                        <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)' }}>
                          Captain {driver.name}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          Phone: <strong>{driver.phone || '+91 90043 58469'}</strong> • Van: {driver.vehicleNumber || 'MH-02-EV-8469'}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <a
                        href={`tel:${driver.phone || '+919004358469'}`}
                        className="btn btn-sm btn-secondary"
                        style={{ padding: '0.45rem 0.85rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', borderRadius: '9999px' }}
                      >
                        <span>📞 Call Captain</span>
                      </a>
                      <button
                        type="button"
                        className="btn btn-sm btn-primary"
                        onClick={() => {
                          setInspectingShipment(null);
                          openChatbox();
                        }}
                        style={{ padding: '0.45rem 0.85rem', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '4px', borderRadius: '9999px' }}
                      >
                        <span>💬 Chat with Captain</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ padding: '1rem 1.25rem', background: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.25)', borderRadius: '18px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Clock size={18} color="#38BDF8" style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: 500 }}>
                    Awaiting Delivery Captain acceptance. Dispatch broadcast active across nearby fleet terminals.
                  </span>
                </div>
              )}

              {/* Consignment Weight & Specs Summary Bar */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <div style={{ padding: '0.75rem 1rem', background: 'var(--bg-secondary)', borderRadius: '14px', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>Billable Weight</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '2px' }}>{inspectingShipment.weightKg || 1.0} kg</div>
                </div>
                <div style={{ padding: '0.75rem 1rem', background: 'var(--bg-secondary)', borderRadius: '14px', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>Dimensions</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '2px' }}>{inspectingShipment.dimensions || '20 x 15 x 10 cm'}</div>
                </div>
                <div style={{ padding: '0.75rem 1rem', background: 'var(--bg-secondary)', borderRadius: '14px', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>Declared Value</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '2px' }}>₹{(inspectingShipment.declaredValue || 1500).toLocaleString()}</div>
                </div>
                <div style={{ padding: '0.75rem 1rem', background: 'var(--bg-secondary)', borderRadius: '14px', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>Payment Method</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 800, color: inspectingShipment.paymentMode === 'COD' ? '#F59E0B' : '#10B981', marginTop: '2px' }}>{inspectingShipment.paymentMode || 'Prepaid'}</div>
                </div>
              </div>

              {/* Proof of Delivery (If Delivered) */}
              {inspectingShipment.proofOfDelivery && (
                <div style={{ padding: '1rem 1.25rem', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: '18px', marginBottom: '1.5rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#10B981', textTransform: 'uppercase' }}>
                    Proof-of-Delivery Verification
                  </span>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-main)', marginTop: '0.3rem', fontWeight: 700 }}>
                    Delivered To: {inspectingShipment.proofOfDelivery.deliveredTo || 'Authorized Recipient'}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Method: {inspectingShipment.proofOfDelivery.verificationMethod || 'Digital OTP & Photo'} • Timestamp: {inspectingShipment.proofOfDelivery.timestamp || 'Recorded'}
                  </div>
                </div>
              )}

              {/* Milestone History Timeline */}
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.75rem' }}>
                  Consignment Milestone Timeline
                </h4>
                <TrackingTimeline events={inspectingShipment.events || []} />
              </div>

              {/* Modal Bottom Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
                <button 
                  className="btn btn-secondary btn-sm"
                  onClick={() => setInspectingShipment(null)}
                  style={{ borderRadius: '9999px', padding: '0.55rem 1.25rem' }}
                >
                  Close
                </button>
                <button 
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    setSelectedAwb(inspectingShipment.awbNumber);
                    setActiveTab('track');
                    setInspectingShipment(null);
                  }}
                  style={{ borderRadius: '9999px', padding: '0.55rem 1.35rem', fontWeight: 700 }}
                >
                  Open Full Tracking Radar ➔
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

