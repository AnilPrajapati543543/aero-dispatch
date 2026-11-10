import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import AeroLogo from './AeroLogo';
import {
  Search,
  Bell,
  Sun,
  Moon,
  Settings,
  PlusCircle,
  Radio,
  Menu,
  X,
  LayoutDashboard,
  ShieldCheck,
  Truck,
  UserCheck,
  Globe,
  Lock,
  ChevronRight,
  ExternalLink,
  LogOut,
  User,
  MessageSquare,
  Headphones,
  ZoomIn
} from 'lucide-react';

export default function Navbar() {
  const {
    currentRole,
    switchRole,
    activeTab,
    setActiveTab,
    setSelectedAwb,
    setTrackingQuery,
    currentUser,
    isAuthenticated,
    logoutUser,
    requireAuth,
    isBackendOnline,
    isSidebarCollapsed,
    toggleSidebar,
    unreadNotificationsCount,
    theme,
    toggleTheme,
    addToast,
    openChatbox,
    openProfileZoom
  } = useApp();

  const [inputSearch, setInputSearch] = useState('');
  const [landingRole, setLandingRole] = useState(() => {
    return localStorage.getItem('aerodispatch_auth_role') === 'driver' ? 'driver' : 'customer';
  });

  const handleRoleToggle = (role) => {
    setLandingRole(role);
    localStorage.setItem('aerodispatch_auth_role', role);
    setActiveTab('auth');
  };

  const isPublicView = activeTab === 'landing';

  const isDashboardTab = [
    'dashboard',
    'shipments',
    'create-order',
    'track',
    'drivers',
    'driver',
    'analytics',
    'notifications',
    'settings',
    'customer',
    'admin',
    'order-details'
  ].includes(activeTab);

  const handleSearch = (e) => {
    e.preventDefault();
    const query = inputSearch.trim();
    if (!query) {
      addToast('Please enter an Air Waybill (AWB) number to track.', 'warning');
      return;
    }
    setTrackingQuery(query);
    setSelectedAwb(query);
    setActiveTab('track');
    setInputSearch('');
  };

  // When on Authentication Page (Login / Register / OTP) or unauthenticated view,
  // keep navbar ultra-clean with ONLY the AeroDispatch logo
  if (activeTab === 'auth' || (!currentUser && activeTab !== 'landing' && activeTab !== 'track')) {
    return (
      <header className="navbar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', padding: '0.85rem 2.5rem', background: 'var(--bg-primary)', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => setActiveTab('landing')} title="Return to AeroDispatch Homepage">
          <AeroLogo
            size="md"
            animated={true}
            showText={true}
            showSubtitle={false}
            subtitle=""
          />
        </div>
      </header>
    );
  }

  return (
    <header className="navbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {/* Sidebar Hamburger Toggle (Smooth Collapse on Desktop & Drawer on Mobile) */}
        {isDashboardTab && (
          <button
            className={`btn btn-sm btn-secondary sidebar-toggle-btn ${isSidebarCollapsed ? 'collapsed' : ''}`}
            onClick={toggleSidebar}
            aria-label={isSidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            title={isSidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            style={{ padding: '0.35rem 0.5rem', display: 'flex', alignItems: 'center' }}
          >
            <Menu size={18} />
          </button>
        )}

        {/* Animated Brand Vector Logo & Typography (Click replays animation only, no navigation) */}
        <AeroLogo
          size="md"
          animated={true}
          showText={true}
          showSubtitle={false}
          subtitle=""
        />
      </div>

      {/* Center Section: Public Navigation Links OR Dashboard Search Bar */}
      {isPublicView ? (
        <nav className="desktop-only" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', fontSize: '0.88rem', fontWeight: 600 }}>
          <button
            type="button"
            className="nav-link-item"
            onClick={() => {
              const el = document.getElementById('public-tracking-hero');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            style={{ background: 'none', border: 'none', color: 'var(--text-main)', cursor: 'pointer', padding: '0.4rem 0' }}
          >
            Track Order
          </button>

          <button
            type="button"
            className="nav-link-item"
            onClick={() => {
              const el = document.getElementById('public-services-section');
              if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                el.classList.add('section-highlight-pulse');
                setTimeout(() => el.classList.remove('section-highlight-pulse'), 2500);
              }
            }}
            style={{ background: 'none', border: 'none', color: 'var(--text-main)', cursor: 'pointer', padding: '0.4rem 0' }}
          >
            Services
          </button>

          <button
            type="button"
            className="nav-link-item"
            onClick={() => {
              const el = document.getElementById('customer-care');
              if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                el.classList.add('section-highlight-pulse');
                setTimeout(() => el.classList.remove('section-highlight-pulse'), 2500);
              } else {
                openChatbox();
              }
            }}
            style={{ background: 'none', border: 'none', color: 'var(--text-main)', cursor: 'pointer', padding: '0.4rem 0', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            title="Jump to 24/7 Customer Care & Support Center"
          >
            <Headphones size={15} color="var(--primary)" />
            <span>Customer Care</span>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981', display: 'inline-block', boxShadow: '0 0 6px #10B981' }} />
          </button>

          <button
            type="button"
            className="nav-link-item"
            onClick={() => {
              if (!currentUser) {
                addToast('Sign in or register required to book express consignments.', 'warning');
                setActiveTab('auth');
              } else if (currentUser.role === 'driver') {
                addToast('Access Denied: Courier drivers cannot book shipments. Sign in as a merchant.', 'error');
              } else {
                setActiveTab('create-order');
              }
            }}
            style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 700, cursor: 'pointer', padding: '0.4rem 0' }}
          >
            Instant book Parcel ➔
          </button>
        </nav>
      ) : (
        /* Quick AWB Search on Dashboard views */
        <form className="nav-search" onSubmit={handleSearch} role="search">
          <input
            type="text"
            placeholder="Track AWB (e.g. AD-8849-2041)..."
            value={inputSearch}
            onChange={(e) => setInputSearch(e.target.value)}
            className="mono"
            aria-label="Track Air Waybill Number"
          />
          <button type="submit" title="Track Shipment" aria-label="Submit Tracking Search">
            <Search size={16} />
          </button>
        </form>
      )}

      {/* Navigation Actions */}
      <div className="nav-actions">
        {isPublicView ? (
          /* ==========================================================
             PUBLIC LANDING NAVBAR ACTIONS: SEPARATED ADMIN ACCESS
             ========================================================== */
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            {/* Theme Toggle */}
            <button
              className="btn btn-sm btn-secondary"
              onClick={toggleTheme}
              style={{ padding: '0.45rem' }}
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
              aria-label="Toggle visual theme"
            >
              {theme === 'dark' ? <Sun size={15} color="#FBBF24" /> : <Moon size={15} color="#6366F1" />}
            </button>

            {!currentUser ? (
              <div className="landing-role-toggle-pill" role="group" aria-label="Portal Persona Switcher">
                <div className={`landing-role-pill-slider ${landingRole === 'driver' ? 'is-driver' : 'is-customer'}`} />
                <button
                  type="button"
                  id="nav-role-customer-btn"
                  className={`landing-role-pill-btn ${landingRole === 'customer' ? 'active' : ''}`}
                  onClick={() => handleRoleToggle('customer')}
                  title="Customer Merchant Portal"
                  aria-label="Customer Merchant Portal"
                >
                  <User size={16} />
                </button>
                <button
                  type="button"
                  id="nav-role-driver-btn"
                  className={`landing-role-pill-btn ${landingRole === 'driver' ? 'active' : ''}`}
                  onClick={() => handleRoleToggle('driver')}
                  title="Courier Driver Portal"
                  aria-label="Courier Driver Portal"
                >
                  <Truck size={16} />
                </button>
              </div>
            ) : (
              <>
                {/* Logged-in shortcuts */}
                {currentUser.role === 'admin' && (
                  <button
                    className="btn btn-sm btn-primary"
                    onClick={() => setActiveTab('dashboard')}
                  >
                    <ShieldCheck size={15} />
                    <span>Admin ➔</span>
                  </button>
                )}
                {currentUser.role === 'driver' && (
                  <button
                    className="btn btn-sm btn-secondary"
                    style={{ borderColor: '#F59E0B', color: '#FBBF24', fontWeight: 700 }}
                    onClick={() => setActiveTab('driver')}
                  >
                    <Truck size={15} color="#FBBF24" />
                    <span>Today's Deliveries ➔</span>
                  </button>
                )}
                {currentUser.role === 'customer' && (
                  <button
                    className="btn btn-sm btn-outline-cyan"
                    style={{ fontWeight: 700 }}
                    onClick={() => setActiveTab('shipments')}
                  >
                    <span>My Orders ➔</span>
                  </button>
                )}

                {/* User Pill */}
                <div
                  onClick={() => setActiveTab('settings')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    padding: '0.25rem 0.65rem 0.25rem 0.35rem',
                    borderRadius: '9999px',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-medium)',
                    cursor: 'pointer'
                  }}
                  title="View your profile"
                >
                  <div
                    style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: '50%',
                      background: currentUser.role === 'admin' ? 'linear-gradient(135deg, #EF4444, #991B1B)' :
                        currentUser.role === 'driver' ? 'linear-gradient(135deg, #F59E0B, #D97706)' :
                          'linear-gradient(135deg, #EF4444, #E11D48)',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '0.72rem'
                    }}
                  >
                    {currentUser.name?.charAt(0) || 'U'}
                  </div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    {currentUser.name?.split(' ')[0]} ({currentUser.role})
                  </span>
                </div>

                {/* Sign Out Button */}
                <button
                  className="btn btn-sm btn-secondary"
                  onClick={logoutUser}
                  style={{ padding: '0.45rem 0.65rem', color: '#F43F5E', borderColor: 'rgba(244, 63, 94, 0.3)' }}
                  title="Sign out of active account"
                >
                  <LogOut size={14} />
                  <span>Logout</span>
                </button>
              </>
            )}
          </div>
        ) : (
          /* ==========================================================
             DASHBOARD NAVBAR ACTIONS (CLEAN, NO WASTE TELEMETRY PILLS)
             ========================================================== */
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            {/* Notifications Button with Badge */}
            <button
              className={`btn btn-sm ${activeTab === 'notifications' ? 'btn-outline-cyan' : 'btn-secondary'}`}
              onClick={() => setActiveTab('notifications')}
              style={{ position: 'relative', padding: '0.45rem' }}
              title="Logistics Notifications Center"
              aria-label="View notifications"
            >
              <Bell size={16} />
              {unreadNotificationsCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-3px',
                    right: '-3px',
                    background: '#F43F5E',
                    color: '#FFFFFF',
                    borderRadius: '9999px',
                    fontSize: '0.62rem',
                    fontWeight: 800,
                    padding: '1px 5px',
                    lineHeight: 1.2,
                    boxShadow: '0 0 8px rgba(244, 63, 94, 0.8)'
                  }}
                >
                  {unreadNotificationsCount}
                </span>
              )}
            </button>

            {/* Theme Toggle Button */}
            <button
              className="btn btn-sm btn-secondary"
              onClick={toggleTheme}
              style={{ padding: '0.45rem' }}
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
              aria-label="Toggle visual theme"
            >
              {theme === 'dark' ? <Sun size={15} color="#FBBF24" /> : <Moon size={15} color="#6366F1" />}
            </button>

            {/* Settings Button */}
            <button
              className={`btn btn-sm ${activeTab === 'settings' ? 'btn-outline-cyan' : 'btn-secondary'}`}
              onClick={() => setActiveTab('settings')}
              style={{ padding: '0.45rem' }}
              title="Application and Profile Settings"
              aria-label="Settings"
            >
              <Settings size={16} />
            </button>

            {/* Clean User Profile Avatar & Name Pill (With Zoom Option & Clickable to Settings) */}
            <div
              onClick={() => setActiveTab('settings')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.55rem',
                padding: '0.25rem 0.75rem 0.25rem 0.35rem',
                borderRadius: '9999px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-medium)',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              title="Click to view & edit Profile & Settings"
              onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-medium)'}
            >
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  openProfileZoom();
                }}
                style={{ position: 'relative', flexShrink: 0, cursor: 'zoom-in' }}
                title="Click to view & zoom profile picture"
              >
                {currentUser?.avatarUrl ? (
                  <img 
                    src={currentUser.avatarUrl} 
                    alt={currentUser.name} 
                    style={{ 
                      width: '28px', 
                      height: '28px', 
                      borderRadius: '50%', 
                      objectFit: 'cover',
                      border: '1.5px solid var(--primary)',
                      display: 'block'
                    }} 
                  />
                ) : (
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      background: currentRole === 'admin' ? 'linear-gradient(135deg, #EF4444, #991B1B)' :
                        currentRole === 'driver' ? 'linear-gradient(135deg, #F59E0B, #D97706)' :
                          'linear-gradient(135deg, #EF4444, #E11D48)',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '0.74rem'
                    }}
                  >
                    {currentUser?.name?.charAt(0) || 'U'}
                  </div>
                )}
              </div>

              <div
                onClick={() => setActiveTab('settings')}
                style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}
                title="Manage account settings"
              >
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-main)', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {currentUser?.name || 'Operator'}
                </span>
                <span style={{ fontSize: '0.62rem', color: 'var(--primary)', fontWeight: 600, textTransform: 'capitalize' }}>
                  {currentRole}
                </span>
              </div>
            </div>

            {/* Standardized Logout Button */}
            <button
              className="btn btn-sm btn-secondary"
              onClick={logoutUser}
              style={{ 
                padding: '0.45rem 0.85rem', 
                color: '#EF4444', 
                borderColor: 'rgba(239, 68, 68, 0.35)',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.78rem'
              }}
              title="Sign out of your account"
            >
              <LogOut size={14} />
              <span>Logout</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
