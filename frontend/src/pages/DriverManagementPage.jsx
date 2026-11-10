import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { SkeletonMetricsGrid, SkeletonBlock } from '../components/SkeletonLoading';
import { 
  Users, 
  Truck, 
  Search, 
  Filter, 
  Star, 
  Phone, 
  MapPin, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  UserCheck, 
  Package, 
  X,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Zap,
  PlusCircle,
  UserPlus,
  Mail,
  Lock
} from 'lucide-react';
import { apiRegister } from '../services/api';
import { getPersistentAvatar } from '../utils/avatarUtils';

export default function DriverManagementPage() {
  const { 
    drivers, 
    driversList, 
    setDriversList,
    updateDriverStatus, 
    shipments, 
    assignDriverToOrder, 
    addToast 
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedDriverForAssign, setSelectedDriverForAssign] = useState(null);
  const [selectedAwbToAssign, setSelectedAwbToAssign] = useState('');

  // Fleet Management Skeleton Shimmer Loading - strictly 1.0s as requested
  const [isDriverMgmtLoading, setIsDriverMgmtLoading] = useState(true);

  useEffect(() => {
    setIsDriverMgmtLoading(true);
    const timer = setTimeout(() => {
      setIsDriverMgmtLoading(false);
    }, 1000); // 1.0s management skeleton loading
    return () => clearTimeout(timer);
  }, [statusFilter]);

  // Add Driver Modal State
  const [isAddDriverModalOpen, setIsAddDriverModalOpen] = useState(false);
  const [newDriverName, setNewDriverName] = useState('');
  const [newDriverEmail, setNewDriverEmail] = useState('');
  const [newDriverPhone, setNewDriverPhone] = useState('');
  const [newDriverVehicle, setNewDriverVehicle] = useState('');
  const [newDriverPassword, setNewDriverPassword] = useState('Driver@123');
  const [isProvisioning, setIsProvisioning] = useState(false);

  const currentDrivers = driversList || drivers;

  // Filter drivers
  const filteredDrivers = currentDrivers.filter(d => {
    if (statusFilter !== 'ALL' && d.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = d.name?.toLowerCase().includes(q);
      const matchId = d.id?.toLowerCase().includes(q);
      const matchZone = d.zone?.toLowerCase().includes(q);
      const matchVehicle = d.vehicle?.toLowerCase().includes(q);
      if (!matchName && !matchId && !matchZone && !matchVehicle) return false;
    }
    return true;
  });

  // Consignments currently awaiting driver assignment
  const unassignedShipments = shipments.filter(s => 
    s.currentStatus !== 'DELIVERED' && 
    s.currentStatus !== 'CANCELLED' && 
    !s.assignedDriver
  );

  const handleAssignSubmit = (e) => {
    e.preventDefault();
    if (!selectedAwbToAssign) {
      addToast('Please select a shipment to assign.', 'warning');
      return;
    }

    assignDriverToOrder(selectedAwbToAssign, selectedDriverForAssign);
    setSelectedDriverForAssign(null);
    setSelectedAwbToAssign('');
  };

  const handleProvisionDriverSubmit = async (e) => {
    e.preventDefault();
    if (!newDriverName.trim() || !newDriverEmail.trim() || !newDriverPassword.trim()) {
      addToast('Please fill in driver name, email and password.', 'warning');
      return;
    }

    setIsProvisioning(true);
    const generatedId = `DRV-${Math.floor(100 + Math.random() * 900)}`;
    const vehicle = newDriverVehicle.trim() || `KA-03-EV-${Math.floor(1000 + Math.random() * 9000)}`;

    try {
      await apiRegister(
        newDriverName.trim(),
        newDriverEmail.trim(),
        newDriverPassword.trim(),
        'driver',
        newDriverPhone.trim(),
        generatedId,
        vehicle
      );

      const newDriverRecord = {
        id: generatedId,
        name: newDriverName.trim(),
        email: newDriverEmail.trim(),
        phone: newDriverPhone.trim() || '+91 9888877777',
        vehicle: vehicle,
        zone: 'Central Hub Metro',
        status: 'AVAILABLE',
        currentAwb: null,
        rating: 5.0,
        tripsCompleted: 0
      };

      if (setDriversList) {
        setDriversList(prev => [newDriverRecord, ...prev]);
      }

      addToast(`Captain ${newDriverName} (${generatedId}) successfully provisioned in AWS Cognito!`, 'success');
      setIsAddDriverModalOpen(false);
      setNewDriverName('');
      setNewDriverEmail('');
      setNewDriverPhone('');
      setNewDriverVehicle('');
      setNewDriverPassword('Driver@123');
    } catch (err) {
      addToast(err.message || 'Failed to provision captain.', 'error');
    } finally {
      setIsProvisioning(false);
    }
  };

  return (
    <div className="dashboard-content" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* 1. Header & Summary Stats */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
            Captain &amp; Fleet Management
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.2rem' }}>
            Monitor delivery captains, vehicle status, route capacity, and captain assignments.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ padding: '0.4rem 0.85rem', background: 'rgba(0, 240, 255, 0.08)', border: '1px solid rgba(0, 240, 255, 0.25)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981', animation: 'aeroBeaconPing 1.8s infinite' }} />
            <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{currentDrivers.filter(d => d.status === 'AVAILABLE').length} Captains Available for Dispatch</span>
          </div>

          <button 
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => setIsAddDriverModalOpen(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', fontWeight: 800, padding: '0.5rem 0.95rem' }}
          >
            <UserPlus size={15} />
            <span>+ Provision New Captain</span>
          </button>
        </div>
      </div>

      {/* 2. Search & Filter Bar */}
      <div className="card" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Search Box */}
          <div style={{ position: 'relative', flex: 1, minWidth: '260px' }}>
            <Search size={16} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)', pointerEvents: 'none', zIndex: 2 }} />
            <input 
              type="text"
              placeholder="Search captain by name, captain ID, vehicle, operational zone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field google-search-input search-input-with-icon"
              style={{ paddingLeft: '3.25rem' }}
            />
          </div>

          {/* Filter Status Pills */}
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            {[
              { val: 'ALL', label: 'All Fleet' },
              { val: 'AVAILABLE', label: 'Available' },
              { val: 'ON_ROUTE', label: 'On Route' },
              { val: 'OFF_DUTY', label: 'Off Duty' }
            ].map(f => (
              <button
                key={f.val}
                className={`btn btn-sm ${statusFilter === f.val ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
                onClick={() => setStatusFilter(f.val)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Driver Profile Cards Grid */}
      {isDriverMgmtLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 460px), 1fr))', gap: '1.25rem', maxWidth: filteredDrivers.length === 1 ? '540px' : '100%' }}>
          {Array.from({ length: Math.min(4, Math.max(1, filteredDrivers.length)) }).map((_, idx) => (
            <div key={idx} className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'center' }}>
                <SkeletonBlock width="44px" height="44px" borderRadius="50%" />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', flex: 1 }}>
                  <SkeletonBlock width="60%" height="18px" />
                  <SkeletonBlock width="40%" height="12px" />
                </div>
              </div>
              <SkeletonBlock width="80%" height="14px" />
              <SkeletonBlock width="50%" height="14px" />
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <SkeletonBlock width="70%" height="32px" borderRadius="9999px" />
                <SkeletonBlock width="30%" height="32px" borderRadius="9999px" />
              </div>
            </div>
          ))}
        </div>
      ) : (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 460px), 1fr))', gap: '1.25rem', maxWidth: filteredDrivers.length === 1 ? '540px' : '100%' }}>
        {filteredDrivers.map(driver => (
          <DriverFleetCard
            key={driver.id}
            driver={driver}
            shipments={shipments}
            onAssign={setSelectedDriverForAssign}
            updateDriverStatus={updateDriverStatus}
          />
        ))}
      </div>
      )}

      {/* 4. Assign Consignment Modal */}
      {selectedDriverForAssign && (
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
          onClick={() => setSelectedDriverForAssign(null)}
        >
          <div 
            className="card"
            style={{
              width: '100%',
              maxWidth: '540px',
              padding: '2rem',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              className="btn btn-sm btn-secondary"
              onClick={() => setSelectedDriverForAssign(null)}
              style={{ position: 'absolute', right: '1.25rem', top: '1.25rem', padding: '0.4rem' }}
            >
              <X size={16} />
            </button>

            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.4rem' }}>
              Assign Consignment to Captain
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              Allocating consignment to Captain <strong>{selectedDriverForAssign.name}</strong> ({selectedDriverForAssign.id} • {selectedDriverForAssign.vehicle}).
            </p>

            <form onSubmit={handleAssignSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label className="form-label">Select Shipment (AWB)</label>
                {unassignedShipments.length === 0 ? (
                  <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    All current shipments have drivers assigned. You can still assign or re-assign any active order.
                  </div>
                ) : null}

                <select 
                  className="form-select input-field"
                  value={selectedAwbToAssign}
                  onChange={(e) => setSelectedAwbToAssign(e.target.value)}
                  style={{ width: '100%', marginTop: '0.35rem', backgroundColor: '#0D1527', color: '#F8FAFC' }}
                  required
                >
                  <option value="" style={{ backgroundColor: '#0D1527', color: '#F8FAFC' }}>-- Choose an active shipment --</option>
                  {(unassignedShipments.length > 0 ? unassignedShipments : shipments.slice(0, 8)).map(s => (
                    <option key={s.awbNumber} value={s.awbNumber} style={{ backgroundColor: '#0D1527', color: '#F8FAFC' }}>
                      {s.awbNumber} — {s.recipient?.city} ({s.currentStatus}) • {s.weightKg}kg
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary btn-sm"
                  onClick={() => setSelectedDriverForAssign(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary btn-sm">
                  Confirm Dispatch Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* 5. Admin Provision New Driver Modal */}
      {isAddDriverModalOpen && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setIsAddDriverModalOpen(false); }}
        >
          <div 
            className="card" 
            style={{ 
              maxWidth: '480px', 
              width: '100%', 
              padding: '1.75rem',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-medium)',
              boxShadow: 'var(--shadow-lg)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F59E0B' }}>
                  <Truck size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                    Provision Delivery Captain
                  </h3>
                  <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                    Admin-only authorized captain creation in AWS Cognito
                  </span>
                </div>
              </div>

              <button 
                type="button" 
                onClick={() => setIsAddDriverModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: '4px' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleProvisionDriverSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label className="form-label" style={{ fontSize: '0.78rem', marginBottom: '0.25rem' }}>Captain Full Name *</label>
                <input 
                  type="text"
                  placeholder="e.g. Vikram Singh"
                  value={newDriverName}
                  onChange={(e) => setNewDriverName(e.target.value)}
                  className="input-field"
                  style={{ width: '100%', height: '36px', fontSize: '0.85rem' }}
                  required
                />
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '0.78rem', marginBottom: '0.25rem' }}>Captain Email Address *</label>
                <input 
                  type="email"
                  placeholder="vikram.singh@aerodispatch.internal"
                  value={newDriverEmail}
                  onChange={(e) => setNewDriverEmail(e.target.value)}
                  className="input-field"
                  style={{ width: '100%', height: '36px', fontSize: '0.85rem' }}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label className="form-label" style={{ fontSize: '0.78rem', marginBottom: '0.25rem' }}>Phone Number</label>
                  <input 
                    type="tel"
                    placeholder="+91 9876543210"
                    value={newDriverPhone}
                    onChange={(e) => setNewDriverPhone(e.target.value)}
                    className="input-field"
                    style={{ width: '100%', height: '36px', fontSize: '0.85rem' }}
                  />
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: '0.78rem', marginBottom: '0.25rem' }}>Assigned Vehicle</label>
                  <input 
                    type="text"
                    placeholder="DL-01-EV-2026"
                    value={newDriverVehicle}
                    onChange={(e) => setNewDriverVehicle(e.target.value)}
                    className="input-field"
                    style={{ width: '100%', height: '36px', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '0.78rem', marginBottom: '0.25rem' }}>Temporary Captain Password *</label>
                <input 
                  type="text"
                  placeholder="Driver@123"
                  value={newDriverPassword}
                  onChange={(e) => setNewDriverPassword(e.target.value)}
                  className="input-field"
                  style={{ width: '100%', height: '36px', fontSize: '0.85rem' }}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.75rem' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary btn-sm"
                  onClick={() => setIsAddDriverModalOpen(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isProvisioning}
                  className="btn btn-primary btn-sm"
                  style={{ background: '#F59E0B', borderColor: '#F59E0B', color: '#000000', fontWeight: 800 }}
                >
                  {isProvisioning ? 'Provisioning in AWS...' : 'Create Captain Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function DriverFleetCard({ driver, shipments, onAssign, updateDriverStatus }) {
  const isAvail = driver.status === 'AVAILABLE';
  const isOnRoute = driver.status === 'ON_ROUTE';
  const [activeTab, setActiveTab] = useState('accepted'); // 'accepted' | 'declined'
  const driverAvatar = driver.avatarUrl || getPersistentAvatar(driver.email, 'driver');

  const acceptedOrders = useMemo(() => {
    return (shipments || []).filter(s => 
      (s.assignedDriver && (s.assignedDriver.driverId === driver.id || s.assignedDriver.name?.toLowerCase() === driver.name?.toLowerCase()))
    );
  }, [shipments, driver]);

  const declinedOrders = useMemo(() => {
    return (shipments || []).filter(s => 
      (s.declinedByDrivers && s.declinedByDrivers.includes(driver.id)) ||
      (s.declinedDriverDetails && s.declinedDriverDetails.some(d => d.driverId === driver.id || d.driverName?.toLowerCase() === driver.name?.toLowerCase()))
    );
  }, [shipments, driver]);

  return (
    <div 
      className="card driver-fleet-card"
      style={{
        padding: '1.25rem 1.5rem',
        display: 'flex',
        flexDirection: 'column',
        height: '470px',
        maxHeight: '470px',
        position: 'relative',
        border: isAvail ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid var(--border-medium)',
        transition: 'all 0.2s ease',
        overflow: 'hidden'
      }}
    >
      {/* 1. Fixed Card Header */}
      <div style={{ flexShrink: 0, paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-subtle)', marginBottom: '0.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div 
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '50%',
                background: isAvail ? 'linear-gradient(135deg, #10B981, #059669)' : 
                            isOnRoute ? 'linear-gradient(135deg, #F59E0B, #D97706)' : 
                            'linear-gradient(135deg, #64748B, #475569)',
                color: 'var(--text-main)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '1.1rem',
                overflow: 'hidden',
                flexShrink: 0,
                border: isAvail ? '2px solid rgba(16, 185, 129, 0.6)' : '2px solid var(--border-medium)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
              }}
            >
              {driverAvatar ? (
                <img 
                  src={driverAvatar} 
                  alt={driver.name} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                />
              ) : (
                driver.name?.charAt(0)
              )}
            </div>
            <div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span>Captain {driver.name?.replace(/^captain\s+/i, '')}</span>
                <span className="mono" style={{ fontSize: '0.72rem', color: '#F43F5E', background: 'rgba(244, 63, 94, 0.12)', border: '1px solid rgba(244, 63, 94, 0.35)', padding: '2px 8px', borderRadius: '4px', fontWeight: 800 }}>
                  ID: {driver.id || driver.driverId || 'DRV-8469'}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginTop: '0.25rem' }}>
                <span style={{ fontSize: '0.72rem', color: '#00F0FF', background: 'rgba(0, 240, 255, 0.08)', border: '1px solid rgba(0, 240, 255, 0.25)', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>
                  📍 {driver.hub || 'Mumbai Cargo Gateway (BOM-01)'}
                </span>
              </div>
            </div>
          </div>

          {/* Status Tag */}
          <span 
            style={{
              fontSize: '0.7rem',
              fontWeight: 800,
              padding: '3px 10px',
              borderRadius: '9999px',
              background: isAvail ? 'rgba(16, 185, 129, 0.15)' : 
                          isOnRoute ? 'rgba(245, 158, 11, 0.15)' : 'rgba(244, 63, 94, 0.15)',
              color: isAvail ? '#10B981' : isOnRoute ? '#FBBF24' : '#F43F5E'
            }}
          >
            ● {driver.status?.replace('_', ' ')}
          </span>
        </div>
      </div>

      {/* 2. Scrollable Card Info Section (Details, Metrics, Orders) with overscroll-behavior: contain */}
      <div 
        className="driver-card-info-scroll"
        style={{
          flex: 1,
          overflowY: 'auto',
          overscrollBehavior: 'contain',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.85rem',
          paddingRight: '6px',
          minHeight: 0
        }}
      >
        {/* Captain Details List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Truck size={14} color="var(--primary)" />
            <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{driver.vehicle || driver.vehicleNumber}</span>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>({driver.vehicleType || 'Courier Fleet'})</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <MapPin size={14} color="#00F0FF" />
            <span>Operational Zone: <strong style={{ color: 'var(--text-main)' }}>{driver.operationalZone || driver.zone || driver.hub || 'Central Logistics Hub'}</strong></span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Phone size={14} color="var(--text-dim)" />
            <span>{driver.phone || '+91 90042 78469'}</span>
          </div>
        </div>

        {/* Metrics Pill Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', background: 'var(--bg-secondary)', padding: '0.65rem', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
          <div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Rating</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#FBBF24', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px' }}>
              <Star size={12} fill="#FBBF24" />
              <span>{driver.rating || '4.9'}</span>
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Accepted</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#10B981' }}>
              {acceptedOrders.length}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Declined</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 800, color: declinedOrders.length > 0 ? '#EF4444' : 'var(--text-dim)' }}>
              {declinedOrders.length}
            </div>
          </div>
        </div>

        {/* Real-Time Order Activity: Accepted vs Declined Orders */}
        <div style={{ 
          background: 'rgba(255, 255, 255, 0.02)', 
          border: '1px solid var(--border-medium)', 
          borderRadius: 'var(--radius-md)', 
          padding: '0.65rem'
        }}>
          <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.55rem' }}>
            <button
              type="button"
              onClick={() => setActiveTab('accepted')}
              style={{
                flex: 1,
                padding: '4px 6px',
                borderRadius: 'var(--radius-sm)',
                border: activeTab === 'accepted' ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid transparent',
                background: activeTab === 'accepted' ? 'rgba(16, 185, 129, 0.12)' : 'transparent',
                color: activeTab === 'accepted' ? '#10B981' : 'var(--text-muted)',
                fontSize: '0.72rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px'
              }}
            >
              <CheckCircle2 size={12} />
              <span>Accepted ({acceptedOrders.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('declined')}
              style={{
                flex: 1,
                padding: '4px 6px',
                borderRadius: 'var(--radius-sm)',
                border: activeTab === 'declined' ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid transparent',
                background: activeTab === 'declined' ? 'rgba(239, 68, 68, 0.12)' : 'transparent',
                color: activeTab === 'declined' ? '#EF4444' : 'var(--text-muted)',
                fontSize: '0.72rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px'
              }}
            >
              <X size={12} />
              <span>Declined ({declinedOrders.length})</span>
            </button>
          </div>

          {activeTab === 'accepted' ? (
            acceptedOrders.length === 0 ? (
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textAlign: 'center', padding: '0.5rem 0' }}>
                No active accepted consignments
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                {acceptedOrders.map(ord => (
                  <div 
                    key={ord.awbNumber}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '4px 8px',
                      background: 'rgba(16, 185, 129, 0.05)',
                      border: '1px solid rgba(16, 185, 129, 0.2)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.74rem'
                    }}
                  >
                    <div>
                      <span className="mono" style={{ fontWeight: 700, color: '#00F0FF' }}>{ord.awbNumber}</span>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>
                        {ord.sender?.city || 'Origin'} ➔ {ord.recipient?.city || 'Dest'}
                      </div>
                    </div>
                    <span style={{ 
                      fontSize: '0.65rem', 
                      padding: '1px 6px', 
                      borderRadius: '4px', 
                      background: 'rgba(16, 185, 129, 0.2)', 
                      color: '#10B981', 
                      fontWeight: 700 
                    }}>
                      {ord.currentStatus?.replace(/_/g, ' ') || 'ACTIVE'}
                    </span>
                  </div>
                ))}
              </div>
            )
          ) : (
            declinedOrders.length === 0 ? (
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textAlign: 'center', padding: '0.5rem 0' }}>
                0 consignments declined by this driver
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                {declinedOrders.map(ord => (
                  <div 
                    key={ord.awbNumber}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '4px 8px',
                      background: 'rgba(239, 68, 68, 0.05)',
                      border: '1px solid rgba(239, 68, 68, 0.2)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.74rem'
                    }}
                  >
                    <div>
                      <span className="mono" style={{ fontWeight: 700, color: '#EF4444' }}>{ord.awbNumber}</span>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>
                        {ord.sender?.city || 'Origin'} ➔ {ord.recipient?.city || 'Dest'}
                      </div>
                    </div>
                    <span style={{ 
                      fontSize: '0.65rem', 
                      padding: '1px 6px', 
                      borderRadius: '4px', 
                      background: 'rgba(239, 68, 68, 0.2)', 
                      color: '#EF4444', 
                      fontWeight: 700 
                    }}>
                      Declined • In Pool
                    </span>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>

      {/* 3. Fixed Card Footer (Actions) */}
      <div style={{ flexShrink: 0, display: 'flex', gap: '0.65rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem', marginTop: '0.75rem', alignItems: 'center' }}>
        <button
          className="btn btn-primary btn-sm"
          style={{ flex: 1, padding: '0.55rem 0.85rem', fontSize: '0.82rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem' }}
          onClick={() => onAssign(driver)}
        >
          <Package size={15} />
          <span>Assign Shipment</span>
        </button>

        <select 
          value={driver.status}
          onChange={(e) => updateDriverStatus(driver.id, e.target.value)}
          className="form-select input-field"
          style={{ width: 'auto', minWidth: '125px', padding: '0.45rem 0.75rem', fontSize: '0.78rem', fontWeight: 700, borderRadius: '8px' }}
        >
          <option value="AVAILABLE">Available</option>
          <option value="ON_ROUTE">On Route</option>
          <option value="OFF_DUTY">Off Duty</option>
        </select>
      </div>
    </div>
  );
}

