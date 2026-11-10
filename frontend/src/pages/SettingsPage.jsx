import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { compressAvatarImage } from '../utils/avatarUtils';
import ProfileOverviewCard from '../components/ProfileOverviewCard';
import { 
  User, 
  Shield, 
  Bell, 
  Sliders, 
  Lock, 
  Key, 
  Smartphone, 
  CheckCircle2, 
  Moon, 
  Sun, 
  Globe, 
  Save, 
  RefreshCw,
  LogOut,
  Building2,
  Mail,
  Phone,
  Truck,
  Camera,
  UploadCloud,
  Trash2,
  ZoomIn
} from 'lucide-react';

export default function SettingsPage() {
  const { 
    currentUser, 
    currentRole, 
    theme, 
    toggleTheme, 
    addToast, 
    switchRole,
    resetToDefaultMock,
    updateUserAvatar,
    updateUserProfile,
    openProfileZoom
  } = useApp();

  const fileInputRef = useRef(null);
  const [avatarPreview, setAvatarPreview] = useState(currentUser?.avatarUrl || null);

  useEffect(() => {
    if (currentUser?.avatarUrl) {
      setAvatarPreview(currentUser.avatarUrl);
    }
  }, [currentUser]);

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

  const handleRemovePhoto = () => {
    setAvatarPreview(null);
    if (updateUserAvatar) {
      updateUserAvatar(null);
    }
    addToast('Profile photograph removed', 'info');
  };

  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'security' | 'notifications' | 'preferences'

  // Profile Form state initialized dynamically based on authenticated user
  const [profileForm, setProfileForm] = useState({
    name: currentUser?.name || 'Operator',
    email: currentUser?.email || 'user@aerodispatch.internal',
    phone: currentUser?.phone || (currentUser?.role === 'driver' ? '+91 98451 90214' : '+91 99001 88241'),
    company: currentUser?.company || (currentUser?.role === 'admin' ? 'AeroDispatch National Operations' : currentUser?.role === 'driver' ? 'AeroDispatch Express Fleet' : 'Enterprise Merchant Shipper'),
    timezone: 'Asia/Kolkata (IST +5:30)',
    department: currentUser?.role === 'admin' ? 'Central Logistics & Air Dispatch' : currentUser?.role === 'driver' ? 'Field Delivery Operations' : 'Enterprise Merchant Shipper'
  });

  // Sync profile form when currentUser changes
  useEffect(() => {
    if (currentUser) {
      setProfileForm({
        name: currentUser.name || '',
        email: currentUser.email || '',
        phone: currentUser.phone || (currentUser.role === 'driver' ? '+91 98451 90214' : '+91 99001 88241'),
        company: currentUser.company || (currentUser.role === 'admin' ? 'AeroDispatch National Operations' : currentUser.role === 'driver' ? 'AeroDispatch Express Fleet' : 'Enterprise Merchant Shipper'),
        timezone: 'Asia/Kolkata (IST +5:30)',
        department: currentUser.role === 'admin' ? 'Central Logistics & Air Dispatch' : currentUser.role === 'driver' ? 'Field Delivery Operations' : 'Enterprise Merchant Shipper'
      });
    }
  }, [currentUser]);

  // Security Form state
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);
  const [sessionTimeout, setSessionTimeout] = useState('24h');

  // Notification Preferences
  const [notifPrefs, setNotifPrefs] = useState({
    emailMilestones: true,
    smsExceptions: true,
    webhookDispatches: true,
    dailyDigest: false
  });

  // App Preferences
  const [units, setUnits] = useState('metric'); // 'metric' (kg/cm) | 'imperial' (lbs/in)
  const [defaultTier, setDefaultTier] = useState('Express Air');

  const handleProfileSave = (e) => {
    e.preventDefault();
    if (updateUserProfile) {
      updateUserProfile({
        name: profileForm.name,
        phone: profileForm.phone,
        company: profileForm.company
      });
    }
    addToast('Profile and organizational settings saved successfully.', 'success');
  };

  const handleSecuritySave = (e) => {
    e.preventDefault();
    addToast('Security settings and 2FA credentials updated.', 'success');
  };

  const handlePreferencesSave = (e) => {
    e.preventDefault();
    addToast('Application preferences saved.', 'success');
  };

  return (
    <div className="dashboard-content" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '920px', margin: '0 auto' }}>
      {/* 1. Page Header */}
      <div>
        <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
          Settings &amp; Account Preferences
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.2rem' }}>
          Manage your operator profile, security controls, notification dispatch rules, and system options.
        </p>
      </div>

      {/* 2. Google Rounded Profile Card (Exact Image Layout with 5 Capsule Metric Pills) */}
      <ProfileOverviewCard allowInlineEdit={true} />

      {/* 3. Settings Nav Tabs */}
      <div className="card" style={{ padding: '0.5rem', display: 'flex', gap: '0.35rem', overflowX: 'auto' }}>
        {[
          { id: 'profile', label: 'User Profile', icon: User },
          { id: 'security', label: 'Security & 2FA', icon: Shield },
          { id: 'notifications', label: 'Notification Rules', icon: Bell },
          { id: 'preferences', label: 'App Preferences', icon: Sliders }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              className={`btn btn-sm ${isActive ? 'btn-primary' : 'btn-secondary'}`}
              style={{ flex: 1, minWidth: '160px', padding: '0.6rem 1rem', fontSize: '0.85rem' }}
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. Tab Contents */}

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <form onSubmit={handleProfileSave} className="card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1.25rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border-subtle)', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              {/* Avatar with Camera & Zoom Click */}
              <div 
                style={{ position: 'relative', cursor: 'zoom-in' }}
                onClick={openProfileZoom}
                title="Click to view & zoom profile picture"
              >
                {avatarPreview ? (
                  <img 
                    src={avatarPreview} 
                    alt="Profile Avatar" 
                    style={{
                      width: '72px',
                      height: '72px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '3px solid var(--primary)',
                      boxShadow: '0 4px 15px rgba(0, 0, 0, 0.4)'
                    }}
                  />
                ) : (
                  <div 
                    style={{
                      width: '72px',
                      height: '72px',
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
                      boxShadow: '0 4px 15px rgba(0, 0, 0, 0.4)'
                    }}
                  >
                    {profileForm.name?.charAt(0) || 'U'}
                  </div>
                )}
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
                    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                    cursor: 'pointer'
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  title="Upload new photo"
                >
                  <Camera size={13} />
                </div>
              </div>

              <div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  {profileForm.name}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {profileForm.company} • Role: <strong style={{ color: 'var(--primary)', textTransform: 'capitalize' }}>{currentRole}</strong>
                </div>
              </div>
            </div>

            {/* Photo Upload & Zoom Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
              <input 
                ref={fileInputRef}
                type="file" 
                accept="image/*" 
                style={{ display: 'none' }} 
                onChange={handlePhotoFileChange} 
              />
              <button
                type="button"
                className="btn btn-sm btn-primary"
                onClick={() => fileInputRef.current?.click()}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem' }}
              >
                <UploadCloud size={14} />
                <span>Upload Photo</span>
              </button>

              <button
                type="button"
                className="btn btn-sm btn-secondary"
                onClick={openProfileZoom}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem' }}
                title="View & zoom profile photo"
              >
                <ZoomIn size={14} />
                <span>View &amp; Zoom</span>
              </button>

              {avatarPreview && (
                <button
                  type="button"
                  className="btn btn-sm btn-secondary"
                  onClick={handleRemovePhoto}
                  style={{ color: '#EF4444', borderColor: 'rgba(239, 68, 68, 0.35)', padding: '0.45rem', fontSize: '0.78rem' }}
                  title="Remove photo"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
            <div>
              <label className="form-label">Full Name</label>
              <input 
                type="text"
                className="input-field"
                value={profileForm.name}
                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="form-label">Email Address</label>
              <input 
                type="email"
                className="input-field"
                value={profileForm.email}
                onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="form-label">Phone Number</label>
              <input 
                type="text"
                className="input-field"
                value={profileForm.phone}
                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
              />
            </div>

            <div>
              <label className="form-label">Company / Department</label>
              <input 
                type="text"
                className="input-field"
                value={profileForm.company}
                onChange={(e) => setProfileForm({ ...profileForm, company: e.target.value })}
              />
            </div>

            <div>
              <label className="form-label">Default Operating Timezone</label>
              <select 
                className="form-select input-field"
                value={profileForm.timezone}
                onChange={(e) => setProfileForm({ ...profileForm, timezone: e.target.value })}
                style={{ backgroundColor: '#0D1527', color: '#F8FAFC' }}
              >
                <option value="Asia/Kolkata (IST +5:30)" style={{ backgroundColor: '#0D1527', color: '#F8FAFC' }}>Asia/Kolkata (IST +5:30)</option>
                <option value="Asia/Dubai (GST +4:00)" style={{ backgroundColor: '#0D1527', color: '#F8FAFC' }}>Asia/Dubai (GST +4:00)</option>
                <option value="Europe/London (GMT +0:00)" style={{ backgroundColor: '#0D1527', color: '#F8FAFC' }}>Europe/London (GMT +0:00)</option>
                <option value="America/New_York (EST -5:00)" style={{ backgroundColor: '#0D1527', color: '#F8FAFC' }}>America/New_York (EST -5:00)</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
            <button type="submit" className="btn btn-primary">
              <Save size={15} />
              <span>Save Profile Changes</span>
            </button>
          </div>
        </form>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <form onSubmit={handleSecuritySave} className="card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
              Security &amp; Authentication Controls
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Manage password credentials, multi-factor authorization, and active JWT session leases.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* 2FA Toggle */}
            <div style={{ padding: '1.25rem', background: 'rgba(0,0,0,0.25)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Smartphone size={16} color="var(--primary)" />
                  <span>Two-Factor Authentication (2FA)</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  Require TOTP authenticator verification on captain assignment and status overrides.
                </div>
              </div>

              <label style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}>
                <input 
                  type="checkbox"
                  checked={twoFactorEnabled}
                  onChange={(e) => setTwoFactorEnabled(e.target.checked)}
                  style={{ accentColor: 'var(--primary)', width: '18px', height: '18px' }}
                />
              </label>
            </div>

            {/* Change Password fields */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
              <div>
                <label className="form-label">Current Password</label>
                <input type="password" placeholder="••••••••••••" className="input-field" />
              </div>
              <div>
                <label className="form-label">New Password</label>
                <input type="password" placeholder="Minimum 8 characters" className="input-field" />
              </div>
            </div>

            {/* Active Sessions */}
            <div style={{ padding: '1rem', background: 'rgba(16, 185, 129, 0.06)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <CheckCircle2 size={18} color="#10B981" />
              <div style={{ fontSize: '0.8rem', color: 'var(--text-main)' }}>
                Current session authorized via <strong>HS256 Bearer JWT</strong>. Expires in 24 hours.
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
            <button type="submit" className="btn btn-primary">
              <Save size={15} />
              <span>Update Security Credentials</span>
            </button>
          </div>
        </form>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <div className="card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
              Outbound Alerts &amp; Notification Rules
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Configure Amazon EventBridge / SNS emulation rules for automatic customer updates.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[
              { key: 'emailMilestones', label: 'Shipment Updates Email', desc: 'Dispatches automated email notifications on transit and out-for-delivery milestones.' },
              { key: 'smsExceptions', label: 'SMS Delivery Exception Alerts', desc: 'Sends immediate customer SMS if a delivery attempt fails due to address or access issues.' },
              { key: 'webhookDispatches', label: 'Real-Time Webhook Push', desc: 'Broadcasts JSON payloads to enterprise ERP endpoints on proof-of-delivery completion.' },
              { key: 'dailyDigest', label: 'Daily Operations Digest', desc: 'Summary report of total weight, volume trends, and on-time SLA performance.' }
            ].map(item => (
              <div 
                key={item.key}
                style={{
                  padding: '1.1rem 1.25rem',
                  background: 'rgba(0,0,0,0.25)',
                  borderRadius: '20px',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '1rem'
                }}
              >
                <div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-main)' }}>{item.label}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{item.desc}</div>
                </div>

                <div
                  className={`google-m3-switch ${notifPrefs[item.key] ? 'is-active' : ''}`}
                  onClick={() => setNotifPrefs({ ...notifPrefs, [item.key]: !notifPrefs[item.key] })}
                  role="switch"
                  aria-checked={notifPrefs[item.key]}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === ' ' || e.key === 'Enter') {
                      e.preventDefault();
                      setNotifPrefs({ ...notifPrefs, [item.key]: !notifPrefs[item.key] });
                    }
                  }}
                  title={`Toggle ${item.label}`}
                >
                  <div className="google-m3-switch-thumb" />
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
            <button 
              type="button" 
              className="btn btn-primary"
              onClick={() => addToast('Notification dispatch rules updated.', 'success')}
            >
              <Save size={15} />
              <span>Save Notification Rules</span>
            </button>
          </div>
        </div>
      )}

      {/* App Preferences Tab */}
      {activeTab === 'preferences' && (
        <form onSubmit={handlePreferencesSave} className="card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
              Application Display &amp; Operational Preferences
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Customize visual theme, volumetric units, and default shipping service tiers.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
            {/* Visual Theme Selection */}
            <div>
              <label className="form-label">Visual Interface Theme</label>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.4rem' }}>
                <button
                  type="button"
                  className={`btn btn-sm ${theme === 'dark' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ flex: 1, padding: '0.65rem' }}
                  onClick={() => { if (theme !== 'dark') toggleTheme(); }}
                >
                  <Moon size={15} />
                  <span>Dark Aviation</span>
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${theme === 'light' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ flex: 1, padding: '0.65rem' }}
                  onClick={() => { if (theme !== 'light') toggleTheme(); }}
                >
                  <Sun size={15} />
                  <span>Light Clean SaaS</span>
                </button>
              </div>
            </div>

            {/* Measurement Units */}
            <div>
              <label className="form-label">Measurement Standard</label>
              <select 
                className="form-select input-field"
                value={units}
                onChange={(e) => setUnits(e.target.value)}
                style={{ marginTop: '0.4rem', backgroundColor: '#0D1527', color: '#F8FAFC' }}
              >
                <option value="metric" style={{ backgroundColor: '#0D1527', color: '#F8FAFC' }}>Metric (kg, centimeters)</option>
                <option value="imperial" style={{ backgroundColor: '#0D1527', color: '#F8FAFC' }}>Imperial (lbs, inches)</option>
              </select>
            </div>

            {/* Default Service Tier */}
            <div>
              <label className="form-label">Default Booking Service Tier</label>
              <select 
                className="form-select input-field"
                value={defaultTier}
                onChange={(e) => setDefaultTier(e.target.value)}
                style={{ marginTop: '0.4rem', backgroundColor: '#0D1527', color: '#F8FAFC' }}
              >
                <option value="Express Air" style={{ backgroundColor: '#0D1527', color: '#F8FAFC' }}>Express Air (24 to 48 Hours)</option>
                <option value="Standard Surface" style={{ backgroundColor: '#0D1527', color: '#F8FAFC' }}>Standard Surface (3 to 5 Days)</option>
                <option value="Same-Day Priority" style={{ backgroundColor: '#0D1527', color: '#F8FAFC' }}>Same-Day Priority (Direct Same-Day)</option>
              </select>
            </div>
          </div>

          {/* Reset Database (Admin Operations Clearance Only) */}
          {currentUser?.role === 'admin' && (
            <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(244, 63, 94, 0.06)', border: '1px solid rgba(244, 63, 94, 0.25)', borderRadius: 'var(--radius-sm)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#F43F5E' }}>
                  Reset Operations Database
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Restore default logistics sorting hubs and baseline roster.
                </div>
              </div>

              <button 
                type="button" 
                className="btn btn-sm btn-secondary"
                onClick={resetToDefaultMock}
                style={{ color: '#F43F5E' }}
              >
                Reset Data
              </button>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
            <button type="submit" className="btn btn-primary">
              <Save size={15} />
              <span>Apply Preferences</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

