import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Bell, 
  CheckCircle2, 
  AlertTriangle, 
  Truck, 
  Package, 
  Radio, 
  ShieldCheck, 
  Trash2, 
  CheckCheck, 
  ExternalLink,
  ChevronRight,
  Filter
} from 'lucide-react';

export default function NotificationsPage() {
  const { 
    notifications, 
    markNotificationRead, 
    markAllNotificationsRead, 
    clearNotifications,
    setSelectedAwb,
    setActiveTab,
    unreadNotificationsCount 
  } = useApp();

  const [activeCategory, setActiveCategory] = useState('ALL');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  // Filter notifications
  const filteredNotifications = notifications.filter(n => {
    if (showUnreadOnly && n.read) return false;
    if (activeCategory !== 'ALL' && n.category !== activeCategory) return false;
    return true;
  });

  const getCategoryIcon = (category, severity) => {
    switch (category) {
      case 'alert':
        return <AlertTriangle size={18} color={severity === 'warning' ? '#F59E0B' : '#F43F5E'} />;
      case 'assignment':
        return <Truck size={18} color="var(--primary)" />;
      case 'shipment':
        return <Package size={18} color="var(--secondary)" />;
      case 'system':
      default:
        return <Radio size={18} color="#10B981" />;
    }
  };

  return (
    <div className="dashboard-content" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '860px', margin: '0 auto' }}>
      {/* 1. Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <Bell size={24} color="var(--primary)" />
            <span>Notifications Center</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.2rem' }}>
            Shipment updates, dispatch assignments, exception alerts, and system notices.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          {unreadNotificationsCount > 0 && (
            <button 
              className="btn btn-secondary btn-sm"
              onClick={markAllNotificationsRead}
              title="Mark all notifications as read"
            >
              <CheckCheck size={14} />
              <span>Mark All Read</span>
            </button>
          )}

          {notifications.length > 0 && (
            <button 
              className="btn btn-secondary btn-sm"
              onClick={clearNotifications}
              title="Clear all notification history"
            >
              <Trash2 size={14} />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Category Filters & Unread Toggle */}
      <div className="card" style={{ padding: '0.85rem 1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', gap: '0.35rem', overflowX: 'auto' }}>
            {[
              { id: 'ALL', label: 'All Alerts' },
              { id: 'alert', label: 'Delivery Alerts' },
              { id: 'assignment', label: 'Driver Routes' },
              { id: 'shipment', label: 'Shipment Updates' },
              { id: 'system', label: 'System & Security' }
            ].map(tab => (
              <button
                key={tab.id}
                className={`btn btn-sm ${activeCategory === tab.id ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
                onClick={() => setActiveCategory(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-main)', cursor: 'pointer', userSelect: 'none' }}>
            <input 
              type="checkbox"
              checked={showUnreadOnly}
              onChange={(e) => setShowUnreadOnly(e.target.checked)}
              style={{ accentColor: 'var(--primary)' }}
            />
            <span>Unread Only ({unreadNotificationsCount})</span>
          </label>
        </div>
      </div>

      {/* 3. Notifications List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {filteredNotifications.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
            <Bell size={40} color="var(--text-dim)" style={{ margin: '0 auto 1rem', opacity: 0.4 }} />
            <h3 style={{ fontSize: '1.1rem', color: 'var(--text-main)', marginBottom: '0.25rem' }}>All Caught Up!</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              No notifications matching your active filter.
            </p>
          </div>
        ) : (
          filteredNotifications.map((notif) => (
            <div 
              key={notif.id}
              className="card"
              style={{
                padding: '1.25rem',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '1rem',
                borderLeft: notif.read ? '3px solid transparent' : '3px solid var(--primary)',
                background: notif.read ? 'var(--bg-card)' : 'rgba(0, 240, 255, 0.04)',
                transition: 'all 0.15s ease'
              }}
              onClick={() => markNotificationRead(notif.id)}
            >
              {/* Category Icon */}
              <div 
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                {getCategoryIcon(notif.category, notif.severity)}
              </div>

              {/* Body */}
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: notif.read ? 600 : 800, color: 'var(--text-main)', lineHeight: 1.3 }}>
                    {notif.title}
                  </h4>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>
                    {notif.time}
                  </span>
                </div>

                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem', lineHeight: 1.4 }}>
                  {notif.message}
                </p>

                {/* Optional AWB Action Link */}
                {notif.awbNumber && (
                  <div style={{ marginTop: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <button
                      className="btn btn-sm btn-outline-cyan"
                      style={{ fontSize: '0.72rem', padding: '0.2rem 0.55rem' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedAwb(notif.awbNumber);
                        setActiveTab('track');
                      }}
                    >
                      <span>Track {notif.awbNumber}</span>
                      <ChevronRight size={12} />
                    </button>
                  </div>
                )}
              </div>

              {/* Unread Blue Dot */}
              {!notif.read && (
                <div 
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: 'var(--primary)',
                    flexShrink: 0,
                    marginTop: '0.35rem',
                    boxShadow: '0 0 8px rgba(0, 240, 255, 0.8)'
                  }}
                  title="Unread notification"
                />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

