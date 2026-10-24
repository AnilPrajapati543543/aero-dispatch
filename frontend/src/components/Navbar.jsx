import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Send, Search, Shield, User, Truck, PlusCircle, Compass } from 'lucide-react';

export default function Navbar() {
  const { 
    currentRole, 
    switchRole, 
    activeTab, 
    setActiveTab, 
    setSelectedAwb, 
    trackingQuery, 
    setTrackingQuery,
    currentUser,
    addToast
  } = useApp();

  const [inputSearch, setInputSearch] = useState('');

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

  return (
    <header className="navbar">
      {/* Brand Logo & Name */}
      <div 
        className="nav-brand" 
        onClick={() => setActiveTab('landing')}
        title="Return to AeroDispatch Home"
      >
        <div className="brand-icon">
          <Send size={20} />
        </div>
        <div>
          <span className="brand-title">AeroDispatch</span>
          <span className="brand-tag">SERVERLESS</span>
        </div>
      </div>

      {/* Quick AWB Search */}
      <form className="nav-search" onSubmit={handleSearch}>
        <input 
          type="text" 
          placeholder="Track AWB (e.g. AD-8849-2041)..." 
          value={inputSearch}
          onChange={(e) => setInputSearch(e.target.value)}
          className="mono"
        />
        <button type="submit" title="Track Shipment">
          <Search size={16} />
        </button>
      </form>

      {/* Navigation Links and Role Switcher */}
      <div className="nav-actions">
        {/* Navigation Items */}
        <button 
          className={`btn btn-sm ${activeTab === 'landing' ? 'btn-outline-cyan' : 'btn-secondary'}`}
          onClick={() => setActiveTab('landing')}
        >
          <Compass size={14} />
          <span>Home</span>
        </button>

        <button 
          className={`btn btn-sm ${activeTab === 'create-order' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('create-order')}
        >
          <PlusCircle size={14} />
          <span>Book Parcel</span>
        </button>

        <button 
          className={`btn btn-sm ${activeTab === 'track' ? 'btn-outline-cyan' : 'btn-secondary'}`}
          onClick={() => {
            setActiveTab('track');
          }}
        >
          <Search size={14} />
          <span>Live Tracking</span>
        </button>

        {/* Dynamic Role Switcher */}
        <div className="role-switch-container" title="Switch persona to explore specific dashboards">
          <button 
            className={`role-btn ${currentRole === 'customer' ? 'active' : ''}`}
            onClick={() => switchRole('customer')}
          >
            Customer
          </button>
          <button 
            className={`role-btn ${currentRole === 'driver' ? 'active' : ''}`}
            onClick={() => switchRole('driver')}
          >
            Driver
          </button>
          <button 
            className={`role-btn ${currentRole === 'admin' ? 'active' : ''}`}
            onClick={() => switchRole('admin')}
          >
            Admin
          </button>
        </div>

        {/* User Pill / Login Switch */}
        <button 
          className="btn btn-sm btn-secondary"
          onClick={() => setActiveTab('auth')}
          title="Switch accounts / Login"
          style={{ borderColor: 'var(--border-medium)', background: 'rgba(255, 255, 255, 0.05)' }}
        >
          <User size={14} color="var(--primary)" />
          <span style={{ maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {currentUser?.name ? currentUser.name.split(' ')[0] : 'Sign In'}
          </span>
        </button>
      </div>
    </header>
  );
}
