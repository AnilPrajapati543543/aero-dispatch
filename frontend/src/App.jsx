import React from 'react';
import { useApp } from './context/AppContext';
import MockNoticeBanner from './components/MockNoticeBanner';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import ToastContainer from './components/ToastContainer';

// Pages
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import CustomerDashboard from './pages/CustomerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import DriverDashboard from './pages/DriverDashboard';
import CreateOrderPage from './pages/CreateOrderPage';
import TrackingPage from './pages/TrackingPage';
import OrderDetailsPage from './pages/OrderDetailsPage';

export default function App() {
  const { activeTab, setActiveTab } = useApp();

  // Determine whether to show the dashboard sidebar (for customer, admin, driver, create-order, order-details)
  const isDashboardView = ['customer', 'admin', 'driver', 'create-order', 'order-details'].includes(activeTab);

  const renderContent = () => {
    switch (activeTab) {
      case 'landing':
        return <LandingPage />;
      case 'auth':
        return <AuthPage />;
      case 'customer':
        return <CustomerDashboard />;
      case 'admin':
        return <AdminDashboard />;
      case 'driver':
        return <DriverDashboard />;
      case 'create-order':
        return <CreateOrderPage />;
      case 'track':
        return <TrackingPage />;
      case 'order-details':
        return <OrderDetailsPage />;
      default:
        return <LandingPage />;
    }
  };

  return (
    <div className="app-container">
      {/* Simulation Banner */}
      <MockNoticeBanner />

      {/* Primary Sticky Navigation Header */}
      <Navbar />

      {/* Main Content Area */}
      <main className="main-content">
        {isDashboardView ? (
          <div className="dashboard-layout">
            <Sidebar />
            <div className="dashboard-body">
              {renderContent()}
            </div>
          </div>
        ) : (
          <div style={{ padding: '0 1.5rem', width: '100%' }}>
            {renderContent()}
          </div>
        )}
      </main>

      {/* Floating Toast Notification Stack */}
      <ToastContainer />

      {/* Footer */}
      <footer style={{ 
        borderTop: '1px solid var(--border-subtle)', 
        background: 'rgba(7, 11, 20, 0.95)', 
        padding: '2rem 1.5rem', 
        fontSize: '0.8rem', 
        color: 'var(--text-dim)',
        marginTop: 'auto'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <strong style={{ color: '#FFFFFF' }}>AeroDispatch Platform</strong> • Next-Gen Cloud Logistics &amp; Fleet Telemetry
            <div style={{ marginTop: '0.25rem' }}>
              Designed for enterprise workflows inspired by Delhivery. Phase 1 Frontend Complete (Mock Client-Side Store).
            </div>
          </div>
          <div style={{ display: 'flex', gap: '1.25rem' }}>
            <span style={{ color: 'var(--primary)' }}>Phase 1: Local Frontend (Active)</span>
            <span>Phase 2: Python Lambdas</span>
            <span>Phase 3: AWS SAM &amp; DynamoDB</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
