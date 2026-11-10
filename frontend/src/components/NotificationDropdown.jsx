import React, { useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Bell, 
  CheckCheck, 
  AlertTriangle, 
  Truck, 
  Package, 
  Radio, 
  ChevronRight,
  ExternalLink
} from 'lucide-react';

export default function NotificationDropdown({ isOpen, onClose, triggerRef }) {
  const { 
    notifications, 
    markNotificationRead, 
    markAllNotificationsRead, 
    setSelectedAwb, 
    setActiveTab, 
    unreadNotificationsCount 
  } = useApp();

  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (!isOpen) return;
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target) &&
        triggerRef?.current && 
        !triggerRef.current.contains(event.target)
      ) {
        onClose();
      }
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, triggerRef]);

  if (!isOpen) return null;

  const getCategoryIcon = (category, severity) => {
    switch (category) {
      case 'alert':
        return <AlertTriangle size={15} color={severity === 'warning' ? '#F59E0B' : '#F43F5E'} />;
      case 'assignment':
        return <Truck size={15} color="var(--primary)" />;
      case 'shipment':
        return <Package size={15} color="var(--secondary)" />;
      case 'system':
      default:
        return <Radio size={15} color="#10B981" />;
    }
  };

  return (
    <div
      ref={dropdownRef}
      className="google-notification-popover"
      style={{
        position: 'absolute',
        top: 'calc(100% + 10px)',
        right: 0,
        width: '360px',
        maxWidth: 'calc(100vw - 24px)',
        background: 'var(--bg-card)',
        borderRadius: '24px',
        border: '1px solid var(--border-medium)',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.22), 0 4px 16px rgba(0, 0, 0, 0.08)',
        padding: '1.25rem 1.25rem 0.85rem 1.25rem',
        zIndex: 1100,
        animation: 'notifPopoverIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        textAlign: 'left'
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <style>{`
        @keyframes notifPopoverIn {
          from {
            opacity: 0;
            transform: translateY(-8px) scale(0.97);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>

      {/* Header: Title, Badge, and Mark All Read */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.01em' }}>
            Notifications
          </span>
          {unreadNotificationsCount > 0 && (
            <span style={{
              background: 'rgba(244, 63, 94, 0.15)',
              color: '#F43F5E',
              fontSize: '0.7rem',
              fontWeight: 800,
              padding: '2px 7px',
              borderRadius: '9999px',
              border: '1px solid rgba(244, 63, 94, 0.3)'
            }}>
              {unreadNotificationsCount} unread
            </span>
          )}
        </div>

        {unreadNotificationsCount > 0 && (
          <button
            type="button"
            onClick={markAllNotificationsRead}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--primary)',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem',
              padding: '0.2rem 0.4rem',
              borderRadius: '6px'
            }}
            title="Mark all as read"
          >
            <CheckCheck size={14} />
            <span>Mark all read</span>
          </button>
        )}
      </div>

      {/* Adjusted Scrollable Notification List */}
      <div className="notification-dropdown-scroll">
        {notifications.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)' }}>
            <Bell size={32} color="var(--text-dim)" style={{ margin: '0 auto 0.5rem', opacity: 0.4 }} />
            <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)' }}>All caught up!</div>
            <div style={{ fontSize: '0.78rem', marginTop: '0.2rem' }}>No new operational alerts.</div>
          </div>
        ) : (
          notifications.slice(0, 10).map((notif) => (
            <div
              key={notif.id}
              onClick={() => markNotificationRead(notif.id)}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem',
                padding: '0.75rem',
                borderRadius: '16px',
                background: notif.read ? 'transparent' : 'rgba(0, 240, 255, 0.05)',
                border: notif.read ? '1px solid transparent' : '1px solid rgba(0, 240, 255, 0.18)',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--bg-secondary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = notif.read ? 'transparent' : 'rgba(0, 240, 255, 0.05)';
              }}
            >
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '10px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                {getCategoryIcon(notif.category, notif.severity)}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.35rem' }}>
                  <div style={{
                    fontSize: '0.84rem',
                    fontWeight: notif.read ? 600 : 800,
                    color: 'var(--text-main)',
                    lineHeight: 1.25,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {notif.title}
                  </div>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                    {notif.time}
                  </span>
                </div>

                <div style={{
                  fontSize: '0.76rem',
                  color: 'var(--text-muted)',
                  marginTop: '0.2rem',
                  lineHeight: 1.35,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}>
                  {notif.message}
                </div>

                {notif.awbNumber && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onClose();
                      setSelectedAwb(notif.awbNumber);
                      setActiveTab('track');
                    }}
                    style={{
                      marginTop: '0.4rem',
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--primary)',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.2rem',
                      padding: 0
                    }}
                  >
                    <span>Track {notif.awbNumber}</span>
                    <ChevronRight size={12} />
                  </button>
                )}
              </div>

              {!notif.read && (
                <div style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  background: 'var(--primary)',
                  flexShrink: 0,
                  marginTop: '0.3rem',
                  boxShadow: '0 0 8px rgba(0, 240, 255, 0.9)'
                }} />
              )}
            </div>
          ))
        )}
      </div>

      {/* Footer: View all in Notifications Center */}
      <div style={{ 
        borderTop: '1px solid var(--border-subtle)', 
        marginTop: '0.65rem', 
        paddingTop: '0.65rem',
        textAlign: 'center'
      }}>
        <button
          type="button"
          onClick={() => {
            onClose();
            setActiveTab('notifications');
          }}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--primary)',
            fontSize: '0.82rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '0.35rem 0.75rem',
            borderRadius: '9999px',
            transition: 'background 0.15s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-secondary)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
        >
          <span>View all in Notifications Center</span>
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}

