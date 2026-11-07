import React from 'react';
import { useApp } from '../context/AppContext';
import AeroLogo from './AeroLogo';
import { 
  LayoutDashboard, 
  Package, 
  PackagePlus, 
  Search, 
  Truck, 
  Users, 
  BarChart3, 
  Bell, 
  Settings, 
  Lock, 
  ShieldCheck, 
  ChevronRight,
  Radio,
  Sparkles,
  LogOut,
  User,
  Globe
} from 'lucide-react';

export default function Sidebar() {
  const { 
    currentRole, 
    activeTab, 
    setActiveTab, 
    shipments, 
    visibleShipments,
    unreadNotificationsCount,
    isMobileSidebarOpen,
    closeMobileSidebar,
    isSidebarCollapsed,
    currentUser,
    logoutUser,
    openProfileZoom
  } = useApp();

  const userRole = currentUser?.role || 'guest';
  const myShipmentsCount = visibleShipments ? visibleShipments.length : shipments.length;
  const inTransitCount = shipments.filter(s => s.currentStatus === 'IN_TRANSIT' || s.currentStatus === 'OUT_FOR_DELIVERY').length;

  // Role-Specific Navigation Definitions
  let navGroups = [];

  if (userRole === 'customer') {
    navGroups = [
      {
        group: 'My Shipments & Orders',
        items: [
          {
            id: 'shipments',
            label: 'My Shipments',
            icon: Package,
            badge: `${myShipmentsCount} orders`
          },
          {
            id: 'create-order',
            label: 'Book Shipment',
            icon: PackagePlus,
            badge: 'Fast'
          },
          {
            id: 'track',
            label: 'Track Package',
            icon: Search,
            badge: null
          }
        ]
      },
      {
        group: 'Account',
        items: [
          {
            id: 'settings',
            label: 'Profile & Settings',
            icon: Settings,
            badge: null
          }
        ]
      }
    ];
  } else if (userRole === 'driver') {
    navGroups = [
      {
        group: 'Deliveries',
        items: [
          {
            id: 'driver',
            label: 'Today\'s Deliveries',
            icon: Truck,
            badge: 'Active'
          },
          {
            id: 'track',
            label: 'Track Package',
            icon: Search,
            badge: null
          }
        ]
      },
      {
        group: 'Preferences',
        items: [
          {
            id: 'settings',
            label: 'Vehicle & Shift',
            icon: Settings,
            badge: null
          }
        ]
      }
    ];
  } else {
    // Admin Navigation
    navGroups = [
      {
        group: 'Operations',
        items: [
          {
            id: 'dashboard',
            label: 'Overview Dashboard',
            icon: LayoutDashboard,
            badge: 'Live'
          },
          {
            id: 'shipments',
            label: 'All Shipments',
            icon: Package,
            badge: shipments.length
          },
          {
            id: 'create-order',
            label: 'New Shipment',
            icon: PackagePlus,
            badge: null
          },
          {
            id: 'track',
            label: 'Track Package',
            icon: Search,
            badge: `${inTransitCount} active`
          }
        ]
      },
      {
        group: 'Fleet & Drivers',
        items: [
          {
            id: 'drivers',
            label: 'Driver Management',
            icon: Users,
            badge: 'Fleet'
          },
          {
            id: 'driver',
            label: 'Driver Portal',
            icon: Truck,
            badge: null
          }
        ]
      },
      {
        group: 'Analytics & Alerts',
        items: [
          {
            id: 'analytics',
            label: 'Performance & Reports',
            icon: BarChart3,
            badge: 'SLA'
          },
          {
            id: 'notifications',
            label: 'Notifications',
            icon: Bell,
            badge: unreadNotificationsCount > 0 ? unreadNotificationsCount : null,
            badgeColor: '#F43F5E'
          }
        ]
      },
      {
        group: 'Settings',
        items: [
          {
            id: 'settings',
            label: 'System Settings',
            icon: Settings,
            badge: null
          }
        ]
      }
    ];
  }

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {isMobileSidebarOpen && (
        <div 
          className="sidebar-backdrop" 
          onClick={closeMobileSidebar}
          aria-hidden="true"
        />
      )}

      <aside className={`dashboard-sidebar ${isMobileSidebarOpen ? 'mobile-open' : ''} ${isSidebarCollapsed ? 'collapsed' : ''}`}>
        {/* Sidebar Brand Header */}
        <div style={{ marginBottom: '1.25rem', paddingBottom: '0.9rem', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Active Workspace
            </span>
            <span 
              style={{ 
                fontSize: '0.65rem', 
                fontWeight: 700, 
                padding: '2px 8px', 
                borderRadius: '9999px',
                background: userRole === 'admin' ? 'rgba(99, 102, 241, 0.2)' : 
                            userRole === 'driver' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(0, 240, 255, 0.15)',
                color: userRole === 'admin' ? '#818CF8' : userRole === 'driver' ? '#FBBF24' : '#00F0FF',
                textTransform: 'uppercase'
              }}
            >
              {userRole}
            </span>
          </div>

          <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {userRole === 'admin' && <ShieldCheck size={18} color="#EF4444" />}
            {userRole === 'driver' && <Truck size={18} color="var(--accent-amber)" />}
            {userRole === 'customer' && <Package size={18} color="#EF4444" />}
            <span>
              {userRole === 'admin' && 'Admin'}
              {userRole === 'driver' && 'Driver Hub'}
              {userRole === 'customer' && 'Customer Portal'}
            </span>
          </div>
        </div>

        {/* Grouped Navigation Links */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', flex: 1 }}>
          {navGroups.map((grp) => (
            <div key={grp.group} style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              <div 
                style={{ 
                  fontSize: '0.68rem', 
                  fontWeight: 800, 
                  color: 'var(--text-dim)', 
                  textTransform: 'uppercase', 
                  letterSpacing: '0.08em',
                  padding: '0 0.6rem 0.2rem' 
                }}
              >
                {grp.group}
              </div>

              {grp.items.map((item) => {
                const IconComponent = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    className={`btn ${isActive ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ 
                      justifyContent: 'space-between', 
                      width: '100%', 
                      fontSize: '0.85rem',
                      fontWeight: isActive ? 700 : 500,
                      padding: '0.6rem 0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      transition: 'all 0.15s ease'
                    }}
                    onClick={() => setActiveTab(item.id)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <IconComponent size={16} />
                      <span>{item.label}</span>
                    </div>

                    {item.badge && (
                      <span 
                        style={{
                          fontSize: '0.65rem',
                          fontWeight: 700,
                          padding: '1px 6px',
                          borderRadius: '9999px',
                          background: item.badgeColor || (isActive ? 'rgba(0, 0, 0, 0.25)' : 'rgba(255, 255, 255, 0.1)'),
                          color: '#FFFFFF'
                        }}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Sidebar Footer User Card with Clean Logout */}
        <div 
          style={{
            marginTop: '1.5rem',
            paddingTop: '1rem',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem'
          }}
        >
          <div 
            style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', cursor: 'pointer' }}
            onClick={(e) => {
              e.stopPropagation();
              openProfileZoom();
            }}
            title="Click to view & zoom profile picture"
          >
            {currentUser?.avatarUrl ? (
              <img 
                src={currentUser.avatarUrl} 
                alt={currentUser.name} 
                style={{ 
                  width: '36px', 
                  height: '36px', 
                  borderRadius: '50%', 
                  objectFit: 'cover',
                  border: '2px solid var(--primary)',
                  flexShrink: 0 
                }} 
              />
            ) : (
              <div 
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: userRole === 'admin' ? 'linear-gradient(135deg, #EF4444, #991B1B)' : 
                              userRole === 'driver' ? 'linear-gradient(135deg, #F59E0B, #D97706)' : 
                              'linear-gradient(135deg, #EF4444, #E11D48)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  color: '#FFFFFF',
                  flexShrink: 0
                }}
              >
                {currentUser?.name?.charAt(0) || 'U'}
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {currentUser?.name || 'User'}
              </span>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)', textTransform: 'capitalize' }}>
                {userRole} Account
              </span>
            </div>
          </div>

          {/* Clean Full-width Sign Out Button */}
          <button
            className="btn btn-sm btn-secondary"
            onClick={() => {
              closeMobileSidebar();
              logoutUser();
            }}
            style={{ 
              width: '100%',
              padding: '0.45rem 0.75rem', 
              color: '#EF4444', 
              borderColor: 'rgba(239, 68, 68, 0.35)', 
              fontSize: '0.78rem', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '6px',
              fontWeight: 700
            }}
            title="Sign out of active account"
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
