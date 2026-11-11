import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import StatusBadge from '../components/StatusBadge';
import CopyButton from '../components/CopyButton';
import MetricCard from '../components/MetricCard';
import AeroLogo from '../components/AeroLogo';
import ParcelDetailModal from '../components/ParcelDetailModal';
import { getConsignmentPhoto } from '../utils/parcelUtils';
import { SkeletonMetricsGrid, SkeletonTableRows } from '../components/SkeletonLoading';
import { 
  Package, 
  Truck, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  TrendingUp, 
  ArrowUpRight, 
  PlusCircle, 
  Search, 
  Activity, 
  MapPin, 
  Layers, 
  ExternalLink,
  ChevronRight,
  Filter,
  RefreshCw,
  Zap,
  Globe2,
  Settings,
  Eye,
  Users,
  XCircle,
  ShieldCheck,
  X,
  Mail,
  Phone,
  UserCheck,
  UserPlus,
  BookOpen,
  HelpCircle
} from 'lucide-react';

export default function MainDashboard() {
  const { 
    shipments, 
    metrics, 
    hubs, 
    drivers, 
    currentUser,
    currentRole,
    switchRole,
    setActiveTab, 
    setSelectedAwb, 
    isBackendOnline,
    refreshBackendOrders,
    isLoadingOrders,
    customerAccountsCount,
    captainAccountsCount,
    completedDeliveriesCount,
    cancelledOrdersCount,
    openAddressBook,
    openSupportModal,
    addToast
  } = useApp();

  const [timeRange, setTimeRange] = useState('7d');
  const [isMainLoading, setIsMainLoading] = React.useState(true);
  const [viewingParcel, setViewingParcel] = useState(null);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');

  React.useEffect(() => {
    setIsMainLoading(true);
    const timer = setTimeout(() => {
      setIsMainLoading(false);
    }, 1000); // 1.0s management skeleton loading
    return () => clearTimeout(timer);
  }, []);

  // Compute live statistics from shipments state
  const totalCount = shipments.length;
  const bookedCount = shipments.filter(s => s.currentStatus === 'BOOKED').length;
  const inTransitCount = shipments.filter(s => s.currentStatus === 'IN_TRANSIT').length;
  const outForDeliveryCount = shipments.filter(s => s.currentStatus === 'OUT_FOR_DELIVERY').length;
  const deliveredCount = shipments.filter(s => s.currentStatus === 'DELIVERED').length;
  const delayedCount = shipments.filter(s => s.currentStatus === 'FAILED_ATTEMPT' || s.currentStatus === 'DELAYED').length;

  // Recent 5 shipments
  const recentShipments = shipments.slice(0, 5);

  // Group shipments dynamically by last 7 days
  const last7DaysData = React.useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const result = [];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dayLabel = days[d.getDay()];
      const dateStr = d.toISOString().split('T')[0];

      // Count shipments created on this day
      const count = shipments.filter(s => {
        if (!s.createdAt && (!s.events || s.events.length === 0)) return false;
        const sDate = s.createdAt 
          ? s.createdAt.split('T')[0] 
          : (s.events[0]?.timestamp ? new Date(s.events[0].timestamp).toISOString().split('T')[0] : '');
        return sDate === dateStr;
      }).length;

      result.push({ day: dayLabel, count, date: dateStr });
    }

    // If shipments exist but none matched exact recent dates, distribute on today's bucket
    const sumCount = result.reduce((acc, r) => acc + r.count, 0);
    if (totalCount > 0 && sumCount === 0) {
      result[result.length - 1].count = totalCount;
    }

    return result;
  }, [shipments, totalCount]);

  // SVG Chart Polyline & Points calculation
  const maxVal = Math.max(...last7DaysData.map(d => d.count), 5);
  const chartPoints = last7DaysData.map((d, i) => {
    const x = 40 + i * 90;
    const y = totalCount === 0 ? 180 : Math.round(180 - (d.count / maxVal) * 140);
    return { x, y, val: d.count, day: d.day };
  });

  const polylinePoints = chartPoints.map(p => `${p.x},${p.y}`).join(' ');
  const polygonPoints = `40,180 ${polylinePoints} 580,180`;

  // Live activity feed from all consignment milestones
  const allMilestones = shipments
    .flatMap(s => (s.events || []).map(ev => ({ ...ev, awbNumber: s.awbNumber, recipientCity: s.recipient?.city })))
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 6);

  // Consolidated registered and active customer accounts
  const customerList = React.useMemo(() => {
    const list = [];
    const seenEmails = new Set();

    // 1. Registered customer accounts from localStorage
    try {
      const reg = JSON.parse(localStorage.getItem('aerodispatch_registered_users') || '[]');
      if (Array.isArray(reg)) {
        reg.filter(u => u.role === 'customer').forEach(u => {
          const em = (u.email || '').toLowerCase().trim();
          if (em && !seenEmails.has(em)) {
            seenEmails.add(em);
            const userOrders = shipments.filter(s => 
              (s.customerEmail || '').toLowerCase() === em || 
              (s.sender?.email || '').toLowerCase() === em
            );
            list.push({
              name: u.name || 'Merchant Customer',
              email: em,
              phone: u.phone || '+91 84338 26567',
              role: 'customer',
              verified: true,
              ordersCount: userOrders.length,
              source: 'Cognito Verified'
            });
          }
        });
      }
    } catch (e) {}

    // 2. Customers derived from active consignments
    shipments.forEach(s => {
      const em = (s.customerEmail || s.sender?.email || '').toLowerCase().trim();
      if (em && !seenEmails.has(em)) {
        seenEmails.add(em);
        const userOrders = shipments.filter(o => 
          (o.customerEmail || '').toLowerCase() === em || 
          (o.sender?.email || '').toLowerCase() === em
        );
        list.push({
          name: s.sender?.name || 'Consignment Shipper',
          email: em,
          phone: s.sender?.phone || '+91 84338 26567',
          role: 'customer',
          verified: true,
          ordersCount: userOrders.length,
          source: 'Active Shipper'
        });
      }
    });

    // 3. Fallback: Seed customer Anil Prajapati (microsofty543@gmail.com)
    if (!seenEmails.has('microsofty543@gmail.com')) {
      list.unshift({
        name: 'Anil Prajapati',
        email: 'microsofty543@gmail.com',
        phone: '+91 84338 26567',
        role: 'customer',
        verified: true,
        ordersCount: shipments.length,
        source: 'Primary Merchant'
      });
    }

    return list;
  }, [shipments]);

  // Filtered customer list for modal search
  const filteredCustomerList = customerList.filter(c => {
    if (!customerSearchQuery.trim()) return true;
    const q = customerSearchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      (c.phone && c.phone.includes(q))
    );
  });

  return (
    <div className="dashboard-content" style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* 1. Header with Title & Quick Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Fleet Operations
            </span>
            <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--text-dim)' }} />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Logistics Network
            </span>
          </div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            Admin Dashboard
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.2rem' }}>
            Live tracking across delivery hubs, linehaul routes, and active couriers.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* Persona Role Switcher: Admin View / Customer View Toggle */}
          <div 
            className="portal-view-toggle-pill"
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              background: 'rgba(255, 255, 255, 0.05)', 
              borderRadius: '9999px', 
              padding: '3px',
              border: '1px solid var(--border-medium)',
              gap: '3px'
            }}
          >
            <button
              type="button"
              className="btn btn-sm btn-primary"
              style={{ borderRadius: '9999px', padding: '0.35rem 0.85rem', fontSize: '0.78rem', fontWeight: 800 }}
              title="Currently viewing Administrator Operations Console"
            >
              <ShieldCheck size={13} />
              <span>Admin View</span>
            </button>
            <button
              type="button"
              className="btn btn-sm btn-secondary"
              onClick={() => switchRole('customer')}
              style={{ borderRadius: '9999px', padding: '0.35rem 0.85rem', fontSize: '0.78rem', fontWeight: 700, color: '#00F0FF', borderColor: 'rgba(0, 240, 255, 0.35)' }}
              title="Switch to Customer Merchant Portal View"
            >
              <Users size={13} />
              <span>Switch to Customer ➔</span>
            </button>
          </div>

          <button 
            className="btn btn-secondary btn-sm google-pill-btn"
            onClick={openAddressBook}
            style={{ borderRadius: '9999px', padding: '0.5rem 1rem' }}
            title="Merchant Address Book & Saved Locations"
          >
            <BookOpen size={14} />
            <span>Address Book</span>
          </button>

          <button 
            className="btn btn-secondary btn-sm google-pill-btn"
            onClick={openSupportModal}
            style={{ borderRadius: '9999px', padding: '0.5rem 1rem' }}
            title="Customer Support & Help Desk Tickets"
          >
            <HelpCircle size={14} />
            <span>Support Tickets</span>
          </button>

          <button 
            className="btn btn-secondary btn-sm google-pill-btn"
            onClick={() => setActiveTab('settings')}
            style={{ borderRadius: '9999px', padding: '0.5rem 1.15rem' }}
            title="Administrator Profile & Security Settings"
          >
            <Settings size={14} />
            <span>Profile &amp; Settings</span>
          </button>

          <button 
            className="btn btn-secondary btn-sm"
            onClick={refreshBackendOrders}
            disabled={isLoadingOrders}
            title="Refresh database records"
          >
            <RefreshCw size={14} className={isLoadingOrders ? 'spin' : ''} />
            <span>{isLoadingOrders ? 'Refreshing...' : 'Refresh'}</span>
          </button>

          <button 
            className="btn btn-primary"
            onClick={() => setActiveTab('create-order')}
          >
            <PlusCircle size={16} />
            <span>Create Shipment</span>
          </button>
        </div>
      </div>

      {/* 2. Top Metric Cards (Dedicated Platform & Fleet Metric Tiles) */}
      {(isLoadingOrders || isMainLoading) ? (
        <SkeletonMetricsGrid count={4} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* 2A. The 4 Dedicated Core Metric Tiles */}
          <div className="grid-cols-4" style={{ gap: '1.25rem' }}>
            <MetricCard 
              title="Customer Accounts"
              value={customerAccountsCount ?? customerList.length}
              subtitle="Registered Customer Portals"
              icon={Users}
              color="#00F0FF"
              badge={customerAccountsCount > 0 ? `${customerAccountsCount} Verified` : "Cognito Active"}
              onClick={() => setIsCustomerModalOpen(true)}
            />
            <MetricCard 
              title="Captain Accounts"
              value={captainAccountsCount ?? 0}
              subtitle="Active Delivery Fleet"
              icon={ShieldCheck}
              color="#F59E0B"
              badge={captainAccountsCount > 0 ? `${captainAccountsCount} Couriers` : "Fleet Ready"}
              onClick={() => setActiveTab('drivers')}
            />
            <MetricCard 
              title="Completed Deliveries"
              value={completedDeliveriesCount ?? deliveredCount}
              subtitle="Proof-of-Delivery Verified"
              icon={CheckCircle2}
              color="#10B981"
              badge={totalCount > 0 ? `${Math.round(((completedDeliveriesCount ?? deliveredCount) / totalCount) * 100)}% Fulfilled` : "100% Target"}
              onClick={() => setActiveTab('shipments')}
            />
            <MetricCard 
              title="Cancelled Orders"
              value={cancelledOrdersCount ?? 0}
              subtitle="Terminated Consignments"
              icon={XCircle}
              color="#F43F5E"
              badge={cancelledOrdersCount > 0 ? `${cancelledOrdersCount} Cancelled` : "0 Exceptions"}
              onClick={() => setActiveTab('shipments')}
            />
          </div>

          {/* 2B. Real-Time Freight & Transit Pipeline Ribbon */}
          <div 
            className="card"
            style={{
              padding: '1rem 1.25rem',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '1rem',
              alignItems: 'center',
              background: 'linear-gradient(135deg, rgba(255,255,255,0.02) 0%, rgba(0,240,255,0.03) 100%)',
              border: '1px solid var(--border-subtle)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: 'var(--radius-sm)', background: 'rgba(0, 240, 255, 0.1)', color: '#00F0FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Package size={18} />
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total Shipments</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>{totalCount}</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: 'var(--radius-sm)', background: 'rgba(99, 102, 241, 0.1)', color: '#6366F1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Clock size={18} />
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Pending / Booked</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>{bookedCount}</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: 'var(--radius-sm)', background: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Truck size={18} />
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Active Linehaul</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>{inTransitCount + outForDeliveryCount}</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: 'var(--radius-sm)', background: 'rgba(244, 63, 94, 0.1)', color: '#F43F5E', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AlertTriangle size={18} />
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Exceptions &amp; Delays</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>{delayedCount}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Analytics Charts Section (Volume Trends & Distribution) */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        {/* Weekly Air Cargo Volume Trends (Custom SVG Area Chart) */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                Shipment Volume &amp; Transit Velocity
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Daily package throughput across registered consignments
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.35rem', background: 'rgba(0,0,0,0.3)', padding: '3px', borderRadius: 'var(--radius-sm)' }}>
              {['24h', '7d', '30d'].map(t => (
                <button
                  key={t}
                  className={`btn btn-sm ${timeRange === t ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '0.2rem 0.6rem', fontSize: '0.72rem' }}
                  onClick={() => setTimeRange(t)}
                >
                  {t.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* SVG Vector Chart */}
          <div style={{ position: 'relative', width: '100%', height: '200px', marginTop: '0.5rem' }}>
            {totalCount === 0 && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: '24px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 2,
                pointerEvents: 'none'
              }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-dim)' }}>
                  No consignments logged yet
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', opacity: 0.7 }}>
                  Create your first shipment to see real-time volume trends
                </span>
              </div>
            )}
            <svg viewBox="0 0 600 200" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
              <defs>
                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00F0FF" stopOpacity={totalCount > 0 ? "0.35" : "0.05"} />
                  <stop offset="100%" stopColor="#00F0FF" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#00F0FF" />
                  <stop offset="100%" stopColor="#6366F1" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1="40" y1="40" x2="580" y2="40" stroke="var(--border-subtle)" strokeDasharray="3 3" />
              <line x1="40" y1="90" x2="580" y2="90" stroke="var(--border-subtle)" strokeDasharray="3 3" />
              <line x1="40" y1="140" x2="580" y2="140" stroke="var(--border-subtle)" strokeDasharray="3 3" />
              <line x1="40" y1="180" x2="580" y2="180" stroke="var(--border-medium)" />

              {/* Area Fill */}
              <polygon 
                points={polygonPoints} 
                fill="url(#areaGradient)" 
              />

              {/* Smooth Trend Polyline */}
              <polyline 
                fill="none" 
                stroke={totalCount > 0 ? "url(#lineGradient)" : "var(--border-subtle)"} 
                strokeWidth="3" 
                strokeLinecap="round"
                strokeLinejoin="round"
                points={polylinePoints} 
              />

              {/* Data Node Points */}
              {chartPoints.map((pt, idx) => (
                <g key={idx}>
                  <circle cx={pt.x} cy={pt.y} r={totalCount > 0 && pt.val > 0 ? 5 : 3} fill="var(--bg-card)" stroke={totalCount > 0 && pt.val > 0 ? "#00F0FF" : "var(--border-subtle)"} strokeWidth="2" />
                  {pt.val > 0 && (
                    <text x={pt.x} y={pt.y - 9} fill="var(--primary)" fontSize="10" fontWeight="700" textAnchor="middle">
                      {pt.val}
                    </text>
                  )}
                </g>
              ))}

              {/* X-Axis Labels */}
              {chartPoints.map((pt, idx) => (
                <text key={idx} x={pt.x} y="196" fill="var(--text-dim)" fontSize="10" textAnchor="middle">
                  {pt.day}
                </text>
              ))}
            </svg>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <div style={{ display: 'flex', gap: '1.5rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#00F0FF' }} />
                Booked Shipments
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#6366F1' }} />
                Transit Dispatches
              </span>
            </div>
            <span style={{ fontWeight: 700, color: totalCount > 0 ? '#10B981' : 'var(--text-dim)' }}>
              {totalCount} Total Consignment{totalCount === 1 ? '' : 's'} Logged
            </span>
          </div>
        </div>

        {/* Consignment Status Breakdown (Donut & Status Meters) */}
        <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
              Status Distribution
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Real-time pipeline composition
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem', marginTop: '1.25rem' }}>
              {[
                { label: 'Delivered', count: deliveredCount, color: '#10B981', total: totalCount },
                { label: 'Out for Delivery', count: outForDeliveryCount, color: '#F59E0B', total: totalCount },
                { label: 'In Linehaul Transit', count: inTransitCount, color: '#00F0FF', total: totalCount },
                { label: 'Booked / Processing', count: bookedCount, color: '#6366F1', total: totalCount },
                { label: 'Exceptions / Delayed', count: delayedCount, color: '#F43F5E', total: totalCount },
                ...(cancelledOrdersCount > 0 ? [{ label: 'Cancelled Orders', count: cancelledOrdersCount, color: '#64748B', total: totalCount }] : [])
              ].map(st => {
                const pct = totalCount > 0 ? Math.round((st.count / totalCount) * 100) : 0;
                return (
                  <div key={st.label}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
                      <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{st.label}</span>
                      <span style={{ color: 'var(--text-muted)' }}>{st.count} ({pct}%)</span>
                    </div>
                    <div style={{ width: '100%', height: '6px', background: 'var(--border-subtle)', borderRadius: '9999px', overflow: 'hidden' }}>
                      <div 
                        style={{ 
                          width: `${pct}%`, 
                          height: '100%', 
                          background: st.color, 
                          borderRadius: '9999px',
                          transition: 'width 0.4s ease'
                        }} 
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(0, 240, 255, 0.05)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(0, 240, 255, 0.15)', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <Zap size={18} color="var(--primary)" />
            <span style={{ fontSize: '0.78rem', color: 'var(--text-main)' }}>
              <strong>{totalCount > 0 ? `${Math.round(((totalCount - delayedCount) / totalCount) * 100)}% SLA Compliance` : '100% SLA Baseline'}</strong> across {totalCount} active record{totalCount === 1 ? '' : 's'}.
            </span>
          </div>
        </div>
      </div>

      {/* 4. Middle Row: Recent Shipments & Geographic Gateway Telemetry */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.7fr 1.3fr', gap: '1.5rem' }}>
        {/* Recent Shipment Table */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                Recent Active Shipments
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Latest bookings and delivery updates
              </p>
            </div>

            <button 
              className="btn btn-secondary btn-sm"
              onClick={() => setActiveTab('shipments')}
            >
              <span>View All ({totalCount})</span>
              <ChevronRight size={14} />
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-medium)', color: 'var(--text-dim)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <th style={{ padding: '0.6rem 0.5rem', width: '56px' }}>Parcel</th>
                  <th style={{ padding: '0.6rem 0.5rem' }}>Air Waybill</th>
                  <th style={{ padding: '0.6rem 0.5rem' }}>Origin → Destination</th>
                  <th style={{ padding: '0.6rem 0.5rem' }}>Tier</th>
                  <th style={{ padding: '0.6rem 0.5rem' }}>Status</th>
                  <th style={{ padding: '0.6rem 0.5rem', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {(isLoadingOrders || isMainLoading) ? (
                  <SkeletonTableRows rows={5} cols={6} />
                ) : recentShipments.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '2.5rem 1rem' }}>
                      <Package size={32} color="var(--text-dim)" style={{ margin: '0 auto 0.5rem', opacity: 0.6 }} />
                      <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                        No consignments logged yet
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        Shipments created by customers will appear here in real-time.
                      </div>
                    </td>
                  </tr>
                ) : (
                  recentShipments.map((s) => (
                  <tr 
                    key={s.awbNumber}
                    style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'background 0.15s ease' }}
                    className="table-row-hover"
                  >
                    {/* Clickable Parcel Image Column */}
                    <td style={{ padding: '0.75rem 0.5rem', width: '56px' }}>
                      <div 
                        onClick={() => setViewingParcel(s)}
                        title="Click to view full consignment dossier & specs"
                        className="clickable-parcel-thumbnail"
                        style={{ width: '46px', height: '46px' }}
                      >
                        <img 
                          src={getConsignmentPhoto(s)} 
                          alt="Consignment Parcel" 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                        />
                        <div className="parcel-zoom-hint">
                          <Eye size={13} color="#ffffff" />
                        </div>
                      </div>
                    </td>

                    <td style={{ padding: '0.75rem 0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                          <span className="mono" style={{ fontWeight: 700, color: 'var(--primary)' }}>
                            {s.awbNumber}
                          </span>
                          <CopyButton text={s.awbNumber} size="sm" label="" />
                        </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--accent-amber)', fontWeight: 700 }}>
                        {s.orderId || s.displayOrderId || 'ORD-' + (s.awbNumber || '').replace('AD-', '')}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                        {s.category || 'General Parcel'} • {s.weightKg} kg
                      </div>
                    </td>

                    <td style={{ padding: '0.75rem 0.5rem' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                        {s.sender?.city} → {s.recipient?.city}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        To: {s.recipient?.name}
                      </div>
                    </td>

                    <td style={{ padding: '0.75rem 0.5rem' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {s.serviceTier}
                      </span>
                    </td>

                    <td style={{ padding: '0.75rem 0.5rem' }}>
                      <StatusBadge status={s.currentStatus} />
                      {s.assignedDriver ? (
                        <div style={{ fontSize: '0.72rem', color: '#10B981', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <Truck size={11} />
                          <span>Captain: {s.assignedDriver.name}</span>
                        </div>
                      ) : (
                        <div style={{ fontSize: '0.72rem', color: '#F59E0B', marginTop: '3px' }}>
                          ● Awaiting Captain Acceptance
                        </div>
                      )}
                    </td>

                    <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>
                      <button 
                        className="btn btn-sm btn-secondary"
                        onClick={() => {
                          setSelectedAwb(s.awbNumber);
                          setActiveTab('track');
                        }}
                        style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                        title="Track shipment progress"
                      >
                        Track
                      </button>
                    </td>
                  </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Geographic Gateway Telemetry (Hub Load Meters) */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                Gateway Sorting Facilities
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Regional node capacity and sorting terminal loads
              </p>
            </div>
            <Globe2 size={18} color="var(--primary)" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {hubs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2.5rem 1rem', background: 'rgba(0, 0, 0, 0.15)', borderRadius: 'var(--radius-sm)', border: '1px dashed var(--border-medium)' }}>
                <Globe2 size={28} color="var(--text-dim)" style={{ margin: '0 auto 0.5rem', opacity: 0.6 }} />
                <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.85rem', marginBottom: '0.2rem' }}>
                  No Active Sorting Gateways
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Gateways activate dynamically when shipments are booked.
                </div>
              </div>
            ) : (
              hubs.map(hub => {
                const isHigh = hub.capacityUsage >= 85;
                return (
                  <div 
                    key={hub.id}
                    style={{
                      padding: '0.85rem',
                      background: 'rgba(0, 0, 0, 0.25)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-subtle)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                      <div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>
                          {hub.name}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <MapPin size={11} color="var(--primary)" />
                          <span>{hub.city} • Gateway {hub.id}</span>
                        </div>
                      </div>
                      <span 
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          padding: '1px 6px',
                          borderRadius: '9999px',
                          background: isHigh ? 'rgba(244, 63, 94, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                          color: isHigh ? '#F43F5E' : '#10B981'
                        }}
                      >
                        {hub.status}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                      <span style={{ color: 'var(--text-dim)' }}>Sorter Utilization</span>
                      <span style={{ fontWeight: 700, color: isHigh ? '#F43F5E' : '#FFFFFF' }}>
                        {hub.capacityUsage}% ({hub.inTransit} parcels)
                      </span>
                    </div>

                    <div style={{ width: '100%', height: '5px', background: 'rgba(255,255,255,0.08)', borderRadius: '9999px', overflow: 'hidden' }}>
                      <div 
                        style={{
                          width: `${hub.capacityUsage}%`,
                          height: '100%',
                          background: isHigh ? 'linear-gradient(90deg, #F59E0B, #F43F5E)' : 'linear-gradient(90deg, #00F0FF, #10B981)',
                          borderRadius: '9999px'
                        }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* 5. Bottom Row: Real-Time Milestone Activity Feed */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Activity size={18} color="var(--primary)" />
              <span>Logistics Milestone Activity</span>
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Live event stream from linehaul cargo scans, sorting terminals, and last-mile couriers
            </p>
          </div>

          <span 
            style={{ 
              fontSize: '0.72rem', 
              color: '#10B981', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.4rem', 
              background: 'rgba(16, 185, 129, 0.1)', 
              padding: '3px 8px', 
              borderRadius: 'var(--radius-sm)' 
            }}
          >
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981', animation: 'aeroBeaconPing 1.5s infinite' }} />
            Listening to EventBus
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: allMilestones.length === 0 ? '1fr' : 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
          {allMilestones.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', background: 'rgba(0, 0, 0, 0.15)', borderRadius: 'var(--radius-sm)', border: '1px dashed var(--border-medium)' }}>
              <Activity size={24} color="var(--text-dim)" style={{ margin: '0 auto 0.4rem', opacity: 0.6 }} />
              <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.85rem', marginBottom: '0.2rem' }}>
                No Milestone Scans Recorded Yet
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Live dispatch scans and delivery events will stream here as packages transit.
              </div>
            </div>
          ) : (
            allMilestones.map((ev, i) => (
            <div 
              key={`${ev.id || i}-${ev.awbNumber}`}
              style={{
                padding: '0.9rem',
                background: 'rgba(0,0,0,0.2)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.35rem'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span 
                  className="mono" 
                  style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', cursor: 'pointer' }}
                  onClick={() => { setSelectedAwb(ev.awbNumber); setActiveTab('track'); }}
                >
                  {ev.awbNumber}
                </span>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>
                  {ev.timestamp}
                </span>
              </div>

              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
                {ev.title}
              </div>

              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <MapPin size={11} color="var(--secondary)" />
                <span>{ev.location}</span>
              </div>
            </div>
            ))
          )}
        </div>
      </div>

      {/* Customer Accounts Directory Modal (Opened by clicking Customer Accounts tile) */}
      {isCustomerModalOpen && (
        <div 
          className="modal-backdrop"
          onClick={() => setIsCustomerModalOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1200,
            padding: '1rem',
            animation: 'fadeIn 0.2s ease'
          }}
        >
          <div 
            className="card"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '720px',
              maxHeight: '85vh',
              display: 'flex',
              flexDirection: 'column',
              background: 'var(--bg-card)',
              borderRadius: '24px',
              border: '1px solid var(--border-medium)',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.45)',
              overflow: 'hidden'
            }}
          >
            {/* Modal Header */}
            <div 
              style={{
                padding: '1.25rem 1.5rem',
                borderBottom: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'rgba(255, 255, 255, 0.02)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div 
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '12px',
                    background: 'rgba(0, 240, 255, 0.12)',
                    color: '#00F0FF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid rgba(0, 240, 255, 0.25)'
                  }}
                >
                  <Users size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span>Customer Merchant Accounts</span>
                    <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '9999px', background: 'rgba(0, 240, 255, 0.15)', color: '#00F0FF', fontWeight: 700 }}>
                      {filteredCustomerList.length} Active
                    </span>
                  </h3>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                    AWS Cognito Verified Merchant Profiles &amp; Consignment Senders
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button
                  type="button"
                  className="btn btn-sm btn-primary"
                  onClick={() => {
                    setIsCustomerModalOpen(false);
                    switchRole('customer');
                  }}
                  style={{ borderRadius: '9999px', padding: '0.4rem 0.95rem', fontSize: '0.76rem', fontWeight: 700 }}
                  title="Switch to Customer Merchant Portal"
                >
                  <span>Switch to Customer View ➔</span>
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-secondary"
                  onClick={() => setIsCustomerModalOpen(false)}
                  style={{ padding: '0.4rem', borderRadius: '50%', width: '32px', height: '32px' }}
                  title="Close Directory"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Modal Search Bar */}
            <div style={{ padding: '1rem 1.5rem 0.5rem 1.5rem' }}>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Search size={15} style={{ position: 'absolute', left: '12px', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Search customer by name, email, or contact phone..."
                  value={customerSearchQuery}
                  onChange={(e) => setCustomerSearchQuery(e.target.value)}
                  className="form-input"
                  style={{ paddingLeft: '2.4rem', borderRadius: '12px', fontSize: '0.85rem' }}
                />
              </div>
            </div>

            {/* Modal Body: Customer Cards List */}
            <div 
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '0.75rem 1.5rem 1.5rem 1.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem'
              }}
            >
              {filteredCustomerList.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)' }}>
                  <Users size={32} style={{ margin: '0 auto 0.5rem', opacity: 0.5 }} />
                  <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.95rem' }}>No matching customer portals found</div>
                  <div style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>Try adjusting your search query.</div>
                </div>
              ) : (
                filteredCustomerList.map((cust) => (
                  <div
                    key={cust.email}
                    style={{
                      padding: '1rem 1.15rem',
                      background: 'var(--bg-secondary)',
                      borderRadius: '16px',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '0.85rem',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', minWidth: 0 }}>
                      <div 
                        style={{
                          width: '42px',
                          height: '42px',
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #00F0FF, #0284C7)',
                          color: '#070B14',
                          fontWeight: 800,
                          fontSize: '1.05rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}
                      >
                        {cust.name.charAt(0).toUpperCase()}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-main)' }}>
                            {cust.name}
                          </span>
                          <span 
                            style={{ 
                              fontSize: '0.68rem', 
                              padding: '2px 7px', 
                              borderRadius: '9999px', 
                              background: 'rgba(16, 185, 129, 0.12)', 
                              color: '#10B981', 
                              border: '1px solid rgba(16, 185, 129, 0.3)',
                              fontWeight: 700 
                            }}
                          >
                            ✓ {cust.source}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '3px', fontSize: '0.78rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                            <Mail size={12} color="var(--primary)" />
                            {cust.email}
                          </span>
                          {cust.phone && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                              <Phone size={12} color="var(--text-dim)" />
                              {cust.phone}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span 
                        style={{
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          padding: '4px 9px',
                          borderRadius: '8px',
                          background: 'rgba(255, 255, 255, 0.04)',
                          color: 'var(--text-muted)'
                        }}
                      >
                        {cust.ordersCount} Consignments
                      </span>
                      <button
                        type="button"
                        className="btn btn-sm btn-secondary"
                        onClick={() => {
                          setIsCustomerModalOpen(false);
                          setActiveTab('shipments');
                        }}
                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.74rem', borderRadius: '9999px' }}
                      >
                        <span>View Orders</span>
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-primary"
                        onClick={() => {
                          setIsCustomerModalOpen(false);
                          switchRole('customer');
                        }}
                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.74rem', borderRadius: '9999px', fontWeight: 700 }}
                      >
                        <span>Switch ➔</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Modal Footer */}
            <div 
              style={{
                padding: '0.85rem 1.5rem',
                borderTop: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'rgba(255, 255, 255, 0.02)',
                fontSize: '0.78rem',
                color: 'var(--text-muted)'
              }}
            >
              <span>Showing <strong>{filteredCustomerList.length}</strong> registered customer profiles</span>
              <button
                type="button"
                className="btn btn-sm btn-secondary"
                onClick={() => setIsCustomerModalOpen(false)}
                style={{ padding: '0.35rem 1rem', borderRadius: '9999px' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Google Material 3 Consignment Dossier Pop-up Modal */}
      {viewingParcel && (
        <ParcelDetailModal 
          parcel={viewingParcel} 
          onClose={() => setViewingParcel(null)} 
        />
      )}
    </div>
  );
}
