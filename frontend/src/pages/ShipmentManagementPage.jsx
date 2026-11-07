import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import StatusBadge from '../components/StatusBadge';
import CopyButton from '../components/CopyButton';
import TrackingTimeline from '../components/TrackingTimeline';
import CustomSelect from '../components/CustomSelect';
import { SkeletonTableRows } from '../components/SkeletonLoading';
import { 
  Package, 
  Search, 
  Filter, 
  PlusCircle, 
  ChevronLeft, 
  ChevronRight, 
  Eye, 
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
  ArrowUpDown
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

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
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

      {/* 2. Filter & Search Control Bar */}
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
      {inspectingShipment && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(4px)',
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
              maxWidth: '720px',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '2rem',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button 
              className="btn btn-sm btn-secondary"
              onClick={() => setInspectingShipment(null)}
              style={{ position: 'absolute', right: '1.25rem', top: '1.25rem', padding: '0.4rem' }}
            >
              <X size={16} />
            </button>

            {/* Modal Header */}
            <div style={{ marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
                <span className="mono" style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--primary)' }}>
                  {inspectingShipment.awbNumber}
                </span>
                <StatusBadge status={inspectingShipment.currentStatus} />
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                {inspectingShipment.serviceTier} • Category: {inspectingShipment.category || 'General Cargo'}
              </p>
            </div>

            {/* Sender & Recipient Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.5rem' }}>
              <div style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-medium)' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Origin &amp; Shipper
                </span>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '0.35rem' }}>
                  {inspectingShipment.sender?.name}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  {inspectingShipment.sender?.address}<br />
                  {inspectingShipment.sender?.city}, {inspectingShipment.sender?.state} - {inspectingShipment.sender?.pinCode}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.4rem' }}>
                  Phone: {inspectingShipment.sender?.phone}
                </div>
              </div>

              <div style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-medium)' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#EF4444', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Destination &amp; Recipient
                </span>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '0.35rem' }}>
                  {inspectingShipment.recipient?.name}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  {inspectingShipment.recipient?.address}<br />
                  {inspectingShipment.recipient?.city}, {inspectingShipment.recipient?.state} - {inspectingShipment.recipient?.pinCode}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.4rem' }}>
                  Phone: {inspectingShipment.recipient?.phone}
                </div>
              </div>
            </div>

            {/* Assigned Driver Card */}
            {inspectingShipment.assignedDriver ? (
              <div style={{ padding: '1rem', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10B981' }}>
                      <Truck size={20} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#10B981', fontWeight: 800 }}>
                        ✓ Courier Driver Assigned
                      </div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)' }}>
                        {inspectingShipment.assignedDriver.name}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        Phone: <strong>{inspectingShipment.assignedDriver.phone || '+91 90043 58469'}</strong> • Vehicle: {inspectingShipment.assignedDriver.vehicleNumber}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <a
                      href={`tel:${inspectingShipment.assignedDriver.phone || '+919004358469'}`}
                      className="btn btn-sm btn-secondary"
                      style={{ padding: '0.45rem 0.85rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem' }}
                    >
                      <span>📞 Call Driver</span>
                    </a>
                    <button
                      type="button"
                      className="btn btn-sm btn-primary"
                      onClick={() => {
                        setInspectingShipment(null);
                        openChatbox();
                      }}
                      style={{ padding: '0.45rem 0.85rem', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                      <span>💬 Chat with Driver</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ padding: '0.85rem 1rem', background: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.25)', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <Clock size={16} color="#38BDF8" />
                <span style={{ fontSize: '0.82rem', color: '#E2E8F0' }}>
                  Awaiting courier driver acceptance. Broadcast dispatched to nearby fleet associates.
                </span>
              </div>
            )}

            {/* Proof of Delivery (If Delivered) */}
            {inspectingShipment.proofOfDelivery && (
              <div style={{ padding: '1rem', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#10B981', textTransform: 'uppercase' }}>
                  Proof-of-Delivery Verification
                </span>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-main)', marginTop: '0.3rem' }}>
                  Delivered To: <strong>{inspectingShipment.proofOfDelivery.deliveredTo}</strong>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Verification: {inspectingShipment.proofOfDelivery.verificationMethod} • Time: {inspectingShipment.proofOfDelivery.timestamp}
                </div>
              </div>
            )}

            {/* Milestone History Timeline */}
            <div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.75rem' }}>
                Milestone Timeline
              </h4>
              <TrackingTimeline events={inspectingShipment.events || []} />
            </div>

            {/* Modal Bottom Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
              <button 
                className="btn btn-secondary btn-sm"
                onClick={() => setInspectingShipment(null)}
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
              >
                Open Full Tracking Screen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

