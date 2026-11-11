import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { compressAvatarImage } from '../utils/avatarUtils';
import { getCleanDisplayName } from '../utils/userUtils';
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
  ShieldCheck,
  Clock,
  CheckCircle2
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
    addToast,
    setActiveTab 
  } = useApp();

  const fileInputRef = useRef(null);
  const [isEditing, setIsEditing] = useState(showEditMode);
  const [avatarPreview, setAvatarPreview] = useState(currentUser?.avatarUrl || null);

  // Sync avatarPreview when currentUser changes
  useEffect(() => {
    if (currentUser?.avatarUrl) {
      setAvatarPreview(currentUser.avatarUrl);
    }
  }, [currentUser?.avatarUrl]);

  // Clean formatted name guaranteed free of email addresses
  const userDisplayName = getCleanDisplayName(currentUser, currentRole);

  // Editable Form State
  const [editForm, setEditForm] = useState({
    name: userDisplayName,
    email: currentUser?.email || 'user@aerodispatch.internal',
    phone: currentUser?.phone || (currentRole === 'driver' ? '+91 98451 90214' : '+91 99001 88241'),
    company: currentUser?.company || (currentRole === 'admin' ? 'AeroDispatch National Operations' : currentRole === 'driver' ? 'AeroDispatch Express Fleet' : 'Enterprise Merchant Shipper'),
    timezone: currentUser?.timezone || 'Asia/Kolkata (IST +5:30)'
  });

  useEffect(() => {
    if (currentUser) {
      setEditForm({
        name: getCleanDisplayName(currentUser, currentRole),
        email: currentUser.email || 'user@aerodispatch.internal',
        phone: currentUser.phone || (currentRole === 'driver' ? '+91 98451 90214' : '+91 99001 88241'),
        company: currentUser.company || (currentRole === 'admin' ? 'AeroDispatch National Operations' : currentRole === 'driver' ? 'AeroDispatch Express Fleet' : 'Enterprise Merchant Shipper'),
        timezone: currentUser.timezone || 'Asia/Kolkata (IST +5:30)'
      });
    }
  }, [currentUser, currentRole]);

  // Calculate live stats based on role if customStats not provided
  const calculateDefaultStats = () => {
    if (customStats && Array.isArray(customStats) && customStats.length === 5) {
      return customStats;
    }

    if (currentRole === 'driver') {
      const driverShipments = shipments.filter(s => 
        (s.assignedDriver && s.assignedDriver.name?.toLowerCase() === currentUser?.name?.toLowerCase()) ||
        (currentUser?.driverId && s.driverId === currentUser.driverId)
      );
      const done = driverShipments.filter(s => s.status === 'delivered').length;
      return [
        { label: "Today's Stops", value: `${driverShipments.length} Stops` },
        { label: "Delivered", value: `${done} Completed` },
        { label: "Captain Rating", value: "—" },
        { label: "Assigned Van", value: currentUser?.vehicleNumber || "Not Assigned" },
        { label: "Base Hub", value: currentUser?.hub || "Not Assigned" }
      ];
    }

    if (currentRole === 'admin') {
      const totalAwbs = shipments.length;
      const inTransit = shipments.filter(s => s.status === 'in_transit' || s.currentStatus === 'IN_TRANSIT' || s.currentStatus === 'OUT_FOR_DELIVERY').length;
      return [
        { label: "National AWBs", value: `${totalAwbs} Total` },
        { label: "Active Linehaul", value: `${inTransit} In-Transit` },
        { label: "Fleet Captains", value: "—" },
        { label: "Network SLA", value: "—" },
        { label: "Ops Clearance", value: "Level 1 Admin" }
      ];
    }

    // Customer Persona
    const myOrders = shipments.filter(s => (s.customerEmail || '').toLowerCase().trim() === (currentUser?.email || '').toLowerCase().trim());
    const orderCount = myOrders.length;
    const inTransit = myOrders.filter(s => s.status === 'in_transit' || s.status === 'dispatched' || s.currentStatus === 'IN_TRANSIT').length;
    return [
      { label: "Total Bookings", value: `${orderCount} Orders` },
      { label: "In-Transit", value: `${inTransit} Active` },
      { label: "On-Time SLA", value: "—" },
      { label: "Service Tier", value: "Standard" },
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
        addToast('Profile photograph updated successfully!', 'success');
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
        company: editForm.company.trim(),
        timezone: editForm.timezone
      });
    }

    setIsEditing(false);
    addToast('Profile updated successfully!', 'success');
  };

  const roleTitle = currentRole === 'admin' 
    ? 'Central Operations Admin' 
    : currentRole === 'driver' 
      ? 'Fleet Delivery Captain' 
      : 'Customer Merchant';

  const userSubtitle = `Member since 2026 · ${currentUser?.company || currentUser?.hub || 'Mumbai Central Hub'} · ${roleTitle}`;

  return (
    <div 
      className="card google-profile-card"
      style={{
        borderRadius: '28px',
        padding: '2rem',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        boxShadow: '0 4px 24px rgba(0, 0, 0, 0.06)',
        transition: 'all 0.3s cubic-bezier(0.2, 0, 0, 1)',
        position: 'relative',
        width: '100%'
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

      {/* Top Row: Avatar + User Identity + Edit Profile Pill Button */}
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
              width: '72px', 
              height: '72px', 
              borderRadius: '50%', 
              cursor: 'pointer',
              flexShrink: 0
            }}
            onClick={() => fileInputRef.current?.click()}
            title="Click to upload profile photo"
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
                  boxShadow: '0 4px 14px rgba(0, 0, 0, 0.16)'
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
                  fontSize: '1.75rem',
                  boxShadow: '0 4px 14px rgba(0, 0, 0, 0.16)'
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
                width: '26px',
                height: '26px',
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
              <Camera size={13} />
            </div>
          </div>

          {/* Name & Subtitle */}
          <div>
            <h2 
              style={{ 
                fontSize: '1.65rem', 
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

        {/* Right: Pill Button "Edit profile" (Exact Google rounded pill from Image 1) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          {isEditing ? (
            <button
              type="button"
              className="google-pill-btn"
              onClick={() => setIsEditing(false)}
              style={{
                borderRadius: '9999px',
                padding: '0.55rem 1.35rem',
                fontSize: '0.86rem',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-medium)',
                color: 'var(--text-muted)',
                cursor: 'pointer'
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
                  setIsEditing(true);
                } else if (onEditClick) {
                  onEditClick();
                } else {
                  setActiveTab('settings');
                }
              }}
              style={{
                borderRadius: '9999px',
                padding: '0.6rem 1.6rem',
                fontSize: '0.88rem',
                fontWeight: 700,
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-medium)',
                color: 'var(--text-main)',
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.2, 0, 0, 1)',
                boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
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
            marginTop: '1.75rem', 
            padding: '1.5rem', 
            borderRadius: '24px', 
            background: 'var(--bg-secondary)', 
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
            animation: 'fadeIn 0.25s ease-out'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-main)' }}>
              Edit Account Profile Information
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Changes take effect immediately across all operational dashboards
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.15rem' }}>
            {/* Full Name */}
            <div>
              <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-main)' }}>Full Name</label>
              <input 
                type="text"
                className="input-field"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                placeholder="Enter your real full name"
                required
                style={{ borderRadius: '9999px', padding: '0.65rem 1.25rem', fontSize: '0.88rem' }}
              />
            </div>

            {/* Email Address (Cognito Verified Read-Only) */}
            <div>
              <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span>Email Address</span>
                <span style={{ fontSize: '0.68rem', color: 'var(--accent-emerald)', fontWeight: 700 }}>✓ Verified</span>
              </label>
              <input 
                type="email"
                className="input-field"
                value={editForm.email}
                disabled
                title="Cognito Primary Identity Email (Protected)"
                style={{ borderRadius: '9999px', padding: '0.65rem 1.25rem', fontSize: '0.88rem', opacity: 0.75, cursor: 'not-allowed' }}
              />
            </div>

            {/* Phone Number */}
            <div>
              <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-main)' }}>Phone Number</label>
              <input 
                type="text"
                className="input-field"
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                placeholder="+91 XXXXX XXXXX"
                style={{ borderRadius: '9999px', padding: '0.65rem 1.25rem', fontSize: '0.88rem' }}
              />
            </div>

            {/* Company / Hub */}
            <div>
              <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-main)' }}>Company / Operating Hub</label>
              <input 
                type="text"
                className="input-field"
                value={editForm.company}
                onChange={(e) => setEditForm({ ...editForm, company: e.target.value })}
                placeholder="e.g. Mumbai Gateway Hub"
                style={{ borderRadius: '9999px', padding: '0.65rem 1.25rem', fontSize: '0.88rem' }}
              />
            </div>

            {/* Operating Timezone */}
            <div>
              <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-main)' }}>Default Timezone</label>
              <select 
                className="input-field"
                value={editForm.timezone}
                onChange={(e) => setEditForm({ ...editForm, timezone: e.target.value })}
                style={{ borderRadius: '9999px', padding: '0.65rem 1.25rem', fontSize: '0.88rem' }}
              >
                <option value="Asia/Kolkata (IST +5:30)">Asia/Kolkata (IST +5:30)</option>
                <option value="UTC (GMT +0:00)">UTC (GMT +0:00)</option>
                <option value="America/New_York (EST -5:00)">America/New_York (EST -5:00)</option>
                <option value="Europe/London (GMT +1:00)">Europe/London (GMT +1:00)</option>
                <option value="Asia/Singapore (SGT +8:00)">Asia/Singapore (SGT +8:00)</option>
              </select>
            </div>
          </div>

          {/* Form Actions */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', paddingTop: '0.5rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                className="btn btn-sm btn-secondary google-pill-btn"
                onClick={() => fileInputRef.current?.click()}
                style={{ borderRadius: '9999px', fontSize: '0.8rem', padding: '0.5rem 1rem' }}
              >
                <UploadCloud size={14} />
                <span>Upload Photograph</span>
              </button>
              {avatarPreview && (
                <button
                  type="button"
                  className="btn btn-sm btn-secondary google-pill-btn"
                  onClick={handleRemovePhoto}
                  style={{ borderRadius: '9999px', fontSize: '0.8rem', color: '#EF4444', borderColor: 'rgba(239, 68, 68, 0.35)', padding: '0.5rem 1rem' }}
                >
                  <Trash2 size={14} />
                  <span>Remove Photo</span>
                </button>
              )}
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button 
                type="button"
                className="btn btn-sm btn-secondary google-pill-btn"
                onClick={() => setIsEditing(false)}
                style={{ borderRadius: '9999px', padding: '0.6rem 1.35rem', fontWeight: 600 }}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn btn-sm btn-primary google-pill-btn"
                style={{ 
                  borderRadius: '9999px', 
                  padding: '0.6rem 1.6rem', 
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #BE123C 0%, #E11D48 100%)',
                  color: '#FFFFFF',
                  border: 'none',
                  boxShadow: '0 4px 14px rgba(225, 29, 72, 0.35)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <Check size={15} style={{ background: 'transparent' }} />
                <span style={{ background: 'transparent', color: '#FFFFFF' }}>Save Profile Changes</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Subtle Hairline Divider (Matching Image 1) */}
      <div 
        style={{ 
          height: '1px', 
          background: 'var(--border-subtle)', 
          margin: '1.75rem 0 1.5rem 0' 
        }} 
      />

      {/* Bottom Row: Exactly 5 Pill-Shaped Statistic Tiles (Matching Image 1) */}
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
              padding: '1.15rem 0.85rem',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-subtle)',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              minWidth: 0,
              transition: 'all 0.25s cubic-bezier(0.2, 0, 0, 1)',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.02)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--primary)';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.08)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-subtle)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.02)';
            }}
          >
            <span 
              style={{ 
                fontSize: '0.8rem', 
                color: 'var(--text-muted)', 
                fontWeight: 600,
                marginBottom: '0.4rem',
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
                fontSize: '1.2rem', 
                fontWeight: 800, 
                color: 'var(--text-main)',
                letterSpacing: '-0.02em',
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
