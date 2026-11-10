import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { compressAvatarImage } from '../utils/avatarUtils';
import { 
  Camera, 
  UploadCloud, 
  Trash2, 
  ZoomIn, 
  Check, 
  X, 
  User, 
  Building2, 
  Phone, 
  Mail, 
  ShieldCheck 
} from 'lucide-react';

export default function ProfileOverviewCard({ 
  onEditClick, 
  showEditMode = false, 
  allowInlineEdit = true,
  customStats = null 
}) {
  const { 
    currentUser, 
    currentRole, 
    shipments, 
    updateUserProfile, 
    updateUserAvatar, 
    openProfileZoom, 
    addToast,
    setActiveTab 
  } = useApp();

  const fileInputRef = useRef(null);
  const [isEditing, setIsEditing] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(currentUser?.avatarUrl || null);

  // Editable Form State
  const [editForm, setEditForm] = useState({
    name: currentUser?.name || '',
    phone: currentUser?.phone || (currentUser?.role === 'driver' ? '+91 98451 90214' : '+91 99001 88241'),
    company: currentUser?.company || (currentUser?.role === 'admin' ? 'AeroDispatch National Operations' : currentUser?.role === 'driver' ? 'AeroDispatch Express Fleet' : 'Enterprise Merchant Shipper')
  });

  // Calculate live stats based on role if customStats not provided
  const calculateDefaultStats = () => {
    if (customStats && Array.isArray(customStats) && customStats.length === 5) {
      return customStats;
    }

    if (currentRole === 'driver') {
      const driverShipments = shipments.filter(s => 
        (s.assignedDriver && s.assignedDriver.name?.toLowerCase() === currentUser?.name?.toLowerCase()) ||
        s.driverId === (currentUser?.driverId || 'DRV-8469')
      );
      const done = driverShipments.filter(s => s.status === 'delivered').length;
      return [
        { label: "Today's Stops", value: `${driverShipments.length || 8} Stops` },
        { label: "Delivered", value: `${done || 6} Completed` },
        { label: "Captain Rating", value: "4.98 ★" },
        { label: "Assigned Van", value: currentUser?.vehicleNumber || "MH-02-EV-8469" },
        { label: "Base Hub", value: currentUser?.hub || "BOM-01 Air Hub" }
      ];
    }

    if (currentRole === 'admin') {
      const totalAwbs = shipments.length || 154;
      const inTransit = shipments.filter(s => s.status === 'in_transit' || s.currentStatus === 'IN_TRANSIT').length || 18;
      return [
        { label: "National AWBs", value: `${totalAwbs} Total` },
        { label: "Active Linehaul", value: `${inTransit} Flights` },
        { label: "Fleet Captains", value: "28 On-Duty" },
        { label: "Network SLA", value: "99.4%" },
        { label: "Ops Clearance", value: "Level 1 Admin" }
      ];
    }

    // Customer Persona
    const myOrders = shipments.filter(s => s.customerEmail === currentUser?.email);
    const orderCount = myOrders.length > 0 ? myOrders.length : 12;
    const inTransit = myOrders.filter(s => s.status === 'in_transit' || s.status === 'dispatched').length || 3;
    return [
      { label: "Total Bookings", value: `${orderCount} Orders` },
      { label: "In-Transit", value: `${inTransit} Active` },
      { label: "On-Time SLA", value: "99.8%" },
      { label: "Service Tier", value: "Priority Air" },
      { label: "Cognito Auth", value: "Verified 2FA" }
    ];
  };

  const stats = calculateDefaultStats();

  const handlePhotoFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      addToast('Profile image must be less than 10MB', 'error');
      return;
    }

    try {
      const compressed = await compressAvatarImage(file, 320, 320, 0.85);
      if (compressed) {
        setAvatarPreview(compressed);
        if (updateUserAvatar) {
          updateUserAvatar(compressed);
        }
      }
    } catch (err) {
      console.warn("Avatar compression failed:", err);
    }
  };

  const handleRemovePhoto = (e) => {
    e.stopPropagation();
    setAvatarPreview(null);
    if (updateUserAvatar) {
      updateUserAvatar(null);
    }
    addToast('Profile photograph removed', 'info');
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    if (!editForm.name.trim()) {
      addToast('Please enter your full name', 'error');
      return;
    }

    if (updateUserProfile) {
      updateUserProfile({
        name: editForm.name.trim(),
        phone: editForm.phone.trim(),
        company: editForm.company.trim()
      });
    }

    setIsEditing(false);
  };

  const roleTitle = currentRole === 'admin' 
    ? 'Central Operations Admin' 
    : currentRole === 'driver' 
      ? 'Fleet Delivery Captain' 
      : 'Customer Merchant';

  const rawName = currentUser?.name || 'Operator';
  const userDisplayName = currentRole === 'driver' && !rawName.toLowerCase().startsWith('captain')
    ? `Captain ${rawName}`
    : rawName;
  const userSubtitle = `Member since 2026 · ${currentUser?.company || currentUser?.hub || 'Mumbai Central Hub'} · ${roleTitle}`;

  return (
    <div 
      className="card google-profile-card"
      style={{
        borderRadius: '28px',
        padding: '2rem',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
        transition: 'all 0.3s ease',
        position: 'relative'
      }}
    >
      {/* Hidden File Input for Avatar Upload */}
      <input 
        ref={fileInputRef}
        type="file" 
        accept="image/*" 
        style={{ display: 'none' }} 
        onChange={handlePhotoFileChange} 
      />

      {/* Top Row: Avatar + Name & Subtitle + Edit profile Pill Button */}
      <div 
        style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          gap: '1.25rem',
          flexWrap: 'wrap'
        }}
      >
        {/* Left: Avatar & User Identity */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          {/* Avatar with Camera Badge & Zoom Click */}
          <div 
            style={{ 
              position: 'relative', 
              width: '68px', 
              height: '68px', 
              borderRadius: '50%', 
              cursor: 'pointer',
              flexShrink: 0
            }}
            onClick={openProfileZoom}
            title="Click to view & zoom profile picture"
          >
            {avatarPreview || currentUser?.avatarUrl ? (
              <img 
                src={avatarPreview || currentUser?.avatarUrl} 
                alt={userDisplayName} 
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '3px solid var(--primary)',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                }}
              />
            ) : (
              <div 
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  background: currentRole === 'admin' ? 'linear-gradient(135deg, #EF4444, #991B1B)' : 
                              currentRole === 'driver' ? 'linear-gradient(135deg, #F59E0B, #D97706)' : 
                              'linear-gradient(135deg, #EF4444, #E11D48)',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '1.65rem',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                }}
              >
                {userDisplayName.charAt(0).toUpperCase()}
              </div>
            )}

            {/* Camera badge to change photo */}
            <div 
              style={{
                position: 'absolute',
                bottom: '-2px',
                right: '-2px',
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: 'var(--primary)',
                color: '#070B14',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid var(--bg-card)',
                boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
                cursor: 'pointer'
              }}
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
              title="Upload new profile photo"
            >
              <Camera size={12} />
            </div>
          </div>

          {/* Name & Subtitle */}
          <div>
            <h2 
              style={{ 
                fontSize: '1.6rem', 
                fontWeight: 800, 
                color: 'var(--text-main)', 
                margin: 0,
                letterSpacing: '-0.02em',
                lineHeight: 1.2
              }}
            >
              {userDisplayName}
            </h2>
            <div 
              style={{ 
                fontSize: '0.88rem', 
                color: 'var(--text-muted)', 
                marginTop: '0.35rem',
                fontWeight: 500
              }}
            >
              {userSubtitle}
            </div>
          </div>
        </div>

        {/* Right: Pill Button "Edit profile" */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          {isEditing ? (
            <button
              type="button"
              className="btn btn-sm btn-secondary google-pill-btn"
              onClick={() => setIsEditing(false)}
              style={{
                borderRadius: '9999px',
                padding: '0.55rem 1.25rem',
                fontSize: '0.85rem',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              <X size={15} />
              <span>Cancel</span>
            </button>
          ) : (
            <button
              type="button"
              className="google-pill-btn"
              onClick={() => {
                if (allowInlineEdit) {
                  setEditForm({
                    name: currentUser?.name || '',
                    phone: currentUser?.phone || (currentUser?.role === 'driver' ? '+91 98451 90214' : '+91 99001 88241'),
                    company: currentUser?.company || (currentUser?.role === 'admin' ? 'AeroDispatch National Operations' : currentUser?.role === 'driver' ? 'AeroDispatch Express Fleet' : 'Enterprise Merchant Shipper')
                  });
                  setIsEditing(true);
                } else if (onEditClick) {
                  onEditClick();
                } else {
                  setActiveTab('settings');
                }
              }}
              style={{
                borderRadius: '9999px',
                padding: '0.55rem 1.45rem',
                fontSize: '0.88rem',
                fontWeight: 700,
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-medium)',
                color: 'var(--text-main)',
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.2, 0, 0, 1)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--primary)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-medium)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              Edit profile
            </button>
          )}
        </div>
      </div>

      {/* Inline Profile Editing Drawer when active */}
      {isEditing && (
        <form 
          onSubmit={handleSaveProfile} 
          style={{ 
            marginTop: '1.5rem', 
            padding: '1.25rem', 
            borderRadius: '20px', 
            background: 'var(--bg-secondary)', 
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <div>
              <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 700 }}>Full Name</label>
              <input 
                type="text"
                className="input-field"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                placeholder="Enter your real full name"
                required
                style={{ borderRadius: '9999px', padding: '0.55rem 1.15rem' }}
              />
            </div>

            <div>
              <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 700 }}>Phone Number</label>
              <input 
                type="text"
                className="input-field"
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                placeholder="+91 XXXXX XXXXX"
                style={{ borderRadius: '9999px', padding: '0.55rem 1.15rem' }}
              />
            </div>

            <div>
              <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 700 }}>Company / Hub</label>
              <input 
                type="text"
                className="input-field"
                value={editForm.company}
                onChange={(e) => setEditForm({ ...editForm, company: e.target.value })}
                placeholder="e.g. Mumbai Gateway Hub"
                style={{ borderRadius: '9999px', padding: '0.55rem 1.15rem' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', paddingTop: '0.5rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                className="btn btn-sm btn-secondary"
                onClick={() => fileInputRef.current?.click()}
                style={{ borderRadius: '9999px', fontSize: '0.78rem' }}
              >
                <UploadCloud size={14} />
                <span>Change Photo</span>
              </button>
              {avatarPreview && (
                <button
                  type="button"
                  className="btn btn-sm btn-secondary"
                  onClick={handleRemovePhoto}
                  style={{ borderRadius: '9999px', fontSize: '0.78rem', color: '#EF4444' }}
                >
                  <Trash2 size={14} />
                  <span>Remove Photo</span>
                </button>
              )}
            </div>

            <button 
              type="submit" 
              className="btn btn-sm btn-primary"
              style={{ borderRadius: '9999px', padding: '0.55rem 1.5rem', fontWeight: 700 }}
            >
              <Check size={15} />
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      )}

      {/* Subtle Hairline Divider (Matching the image) */}
      <div 
        style={{ 
          height: '1px', 
          background: 'var(--border-subtle)', 
          margin: '1.75rem 0 1.5rem 0' 
        }} 
      />

      {/* Bottom Row: Exactly 5 Pill-Shaped Statistic Tiles */}
      <div 
        className="google-profile-stats-row"
        style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(5, 1fr)', 
          gap: '0.85rem' 
        }}
      >
        {stats.map((item, idx) => (
          <div 
            key={idx}
            className="google-profile-stat-pill"
            style={{
              borderRadius: '9999px',
              padding: '1rem 0.75rem',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-subtle)',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              minWidth: 0,
              transition: 'transform 0.2s ease, border-color 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--primary)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-subtle)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <span 
              style={{ 
                fontSize: '0.78rem', 
                color: 'var(--text-muted)', 
                fontWeight: 600,
                marginBottom: '0.35rem',
                textTransform: 'none',
                letterSpacing: '0.01em',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                width: '100%'
              }}
            >
              {item.label}
            </span>
            <span 
              style={{ 
                fontSize: '1.15rem', 
                fontWeight: 800, 
                color: 'var(--text-main)',
                letterSpacing: '-0.01em',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                width: '100%'
              }}
            >
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

