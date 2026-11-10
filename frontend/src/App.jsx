import React from 'react';
import { useApp } from './context/AppContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import ToastContainer from './components/ToastContainer';
import AeroChatbox from './components/AeroChatbox';
import LoginRoleAnimation from './components/LoginRoleAnimation';
import FullPageSkeleton from './components/FullPageSkeleton';
import ProfilePictureZoomModal from './components/ProfilePictureZoomModal';
import CookieConsentBanner from './components/CookieConsentBanner';

// 10 Required Pages & Landing
import LandingPage from './pages/LandingPage';
import MainDashboard from './pages/MainDashboard';
import ShipmentManagementPage from './pages/ShipmentManagementPage';
import CreateOrderPage from './pages/CreateOrderPage';
import TrackingPage from './pages/TrackingPage';
import DriverManagementPage from './pages/DriverManagementPage';
import DriverDashboard from './pages/DriverDashboard';
import AnalyticsPage from './pages/AnalyticsPage';
import NotificationsPage from './pages/NotificationsPage';
import AuthPage from './pages/AuthPage';
import SettingsPage from './pages/SettingsPage';
import OrderDetailsPage from './pages/OrderDetailsPage';

export default function App() {
  const { 
    activeTab, 
    currentUser, 
    loginAnimationRole, 
    setLoginAnimationRole, 
    isSidebarCollapsed,
    isProfileZoomOpen,
    closeProfileZoom,
    updateUserAvatar,
    addToast
  } = useApp();

  // Full page reload skeleton state - strictly 2.0 seconds as requested
  const [isPageReloading, setIsPageReloading] = React.useState(true);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsPageReloading(false);
    }, 2000); // 2.0 seconds full page reload time
    return () => clearTimeout(timer);
  }, []);

  // Determine whether to show the dashboard sidebar (Only for logged-in operators)
  const isDashboardView = !!currentUser && [
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

  const renderContent = () => {
    // 1. Unauthenticated Visitor Guard: Any internal operation redirects to Auth
    if (!currentUser && !['landing', 'auth', 'track'].includes(activeTab)) {
      return <AuthPage />;
    }

    // 2. Customer Isolation: Strictly restrict to Customer Portal
    if (currentUser?.role === 'customer') {
      if (['dashboard', 'drivers', 'driver', 'analytics', 'admin'].includes(activeTab)) {
        return <ShipmentManagementPage />;
      }
    }

    // 3. Driver Isolation: Strictly restrict to Driver Portal
    if (currentUser?.role === 'driver') {
      if (['dashboard', 'shipments', 'create-order', 'drivers', 'analytics', 'admin', 'customer'].includes(activeTab)) {
        return <DriverDashboard />;
      }
    }

    switch (activeTab) {
      case 'landing':
        if (currentUser) {
          if (currentUser.role === 'admin') return <MainDashboard />;
          if (currentUser.role === 'driver') return <DriverDashboard />;
          if (currentUser.role === 'customer') return <ShipmentManagementPage />;
        }
        return <LandingPage />;
      case 'dashboard':
      case 'admin':
        return <MainDashboard />;
      case 'shipments':
      case 'customer':
        return <ShipmentManagementPage />;
      case 'create-order':
        return <CreateOrderPage />;
      case 'track':
        return <TrackingPage />;
      case 'drivers':
        return <DriverManagementPage />;
      case 'driver':
        return <DriverDashboard />;
      case 'analytics':
        return <AnalyticsPage />;
      case 'notifications':
        return <NotificationsPage />;
      case 'auth':
        return <AuthPage />;
      case 'settings':
        return <SettingsPage />;
      case 'order-details':
        return <OrderDetailsPage />;
      default:
        return <LandingPage />;
    }
  };

  if (isPageReloading) {
    return <FullPageSkeleton isDashboardView={isDashboardView} />;
  }

  return (
    <div className="app-container">
      {/* Primary Sticky Navigation Header */}
      {activeTab !== 'auth' && <Navbar />}

      {/* Main Content Area */}
      <main className="main-content" style={{ overflow: activeTab === 'auth' ? 'auto' : 'visible' }}>
        {isDashboardView ? (
          <div className={`dashboard-layout ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
            <Sidebar />
            <div className="dashboard-body">
              {renderContent()}
            </div>
          </div>
        ) : (
          <div style={{ padding: activeTab === 'auth' ? '0' : '0 1.5rem', width: '100%', minHeight: activeTab === 'auth' ? '100vh' : 'auto', overflow: activeTab === 'auth' ? 'auto' : 'visible' }}>
            {renderContent()}
          </div>
        )}
      </main>

      {/* Role-Specific Login Transition Animation (Without Heavy Background) */}
      {loginAnimationRole && (
        <LoginRoleAnimation 
          role={loginAnimationRole} 
          onComplete={() => setLoginAnimationRole(null)} 
        />
      )}

      {/* Floating Toast Notification Stack */}
      <ToastContainer />

      {/* Floating Customer & Care Support Assistant */}
      <AeroChatbox />

      {/* Profile Picture View & Zoom Inspector Modal (WhatsApp Style) */}
      <ProfilePictureZoomModal
        isOpen={isProfileZoomOpen}
        onClose={closeProfileZoom}
        user={currentUser}
        avatarUrl={currentUser?.avatarUrl}
        onUploadNewPhoto={(newAvatar) => {
          updateUserAvatar(newAvatar);
        }}
        onRemovePhoto={() => {
          updateUserAvatar(null);
        }}
      />

      {/* Floating GDPR & DPDP Cookie Consent Banner (New Visitors Only) */}
      <CookieConsentBanner />

      {/* Footer */}
      {activeTab !== 'auth' && (
        <footer style={{ 
          borderTop: '1px solid var(--border-subtle)', 
          background: 'var(--bg-secondary)', 
          padding: '1.75rem 1.5rem', 
          fontSize: '0.82rem', 
          color: 'var(--text-dim)',
          marginTop: 'auto'
        }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <strong style={{ color: 'var(--text-main)' }}>AeroDispatch</strong> • Smart Express Logistics Platform
              <div style={{ marginTop: '0.25rem', color: 'var(--text-muted)' }}>
                Next-generation dispatch network connecting shippers, captains, and recipients.
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', fontSize: '0.78rem' }}>
              <span style={{ color: '#10B981', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981', display: 'inline-block' }}></span>
                Network Active
              </span>
              <span>Package Tracking</span>
              <span>Verified Delivery</span>
              <span>Cloud Secured</span>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
