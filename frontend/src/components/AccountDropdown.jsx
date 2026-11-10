import React, { useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { getCleanDisplayName } from '../utils/userUtils';
import { 
  Check, 
  Plus, 
  UserCog, 
  LogOut 
} from 'lucide-react';

export default function AccountDropdown({ isOpen, onClose, triggerRef }) {
  const { 
    currentUser, 
    currentRole, 
    setActiveTab, 
    logoutUser 
  } = useApp();

  const dropdownRef = useRef(null);

  // Close when clicking outside or pressing Escape
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

  const userDisplayName = getCleanDisplayName(currentUser, currentRole);
  const userEmail = currentUser?.email || (
    currentRole === 'admin' 
      ? 'admin@aerodispatch.io' 
      : currentRole === 'driver' 
        ? 'driver@aerodispatch.io' 
        : 'customer@aerodispatch.io'
  );

  // When clicking "Add another account", directly route to the registration page 
  // with a 1.2s skeleton loading effect based on the active role dashboard
  const handleAddAnotherAccount = () => {
    onClose();
    const targetRole = currentRole === 'driver' ? 'driver' : 'customer';
    localStorage.setItem('aerodispatch_auth_role', targetRole);
    localStorage.setItem('aerodispatch_auth_mode', 'register');
    sessionStorage.setItem('aerodispatch_auth_skeleton', 'true');
    setActiveTab('auth');
  };

  return (
    <div 
      ref={dropdownRef}
      className="google-account-popover"
      style={{
        position: 'absolute',
        top: 'calc(100% + 10px)',
        right: 0,
        width: '320px',
        maxWidth: 'calc(100vw - 24px)',
        background: 'var(--bg-card)',
        borderRadius: '24px',
        border: '1px solid var(--border-medium)',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.22), 0 4px 16px rgba(0, 0, 0, 0.08)',
        padding: '1.25rem 1.25rem 0.85rem 1.25rem',
        zIndex: 1100,
        animation: 'accountPopoverIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        textAlign: 'left'
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <style>{`
        @keyframes accountPopoverIn {
          from {
            opacity: 0;
            transform: translateY(-8px) scale(0.97);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .account-popover-item {
          display: flex;
          align-items: center;
          gap: 0.85rem;
          width: 100%;
          padding: 0.75rem 0.65rem;
          border-radius: 14px;
          background: transparent;
          border: none;
          color: var(--text-main);
          font-size: 0.92rem;
          font-weight: 600;
          cursor: pointer;
          text-align: left;
          transition: background 0.15s ease, transform 0.1s ease;
        }
        .account-popover-item:hover {
          background: var(--bg-secondary);
        }
        .account-popover-item:active {
          transform: scale(0.98);
        }
      `}</style>

      {/* Header: Switch accounts */}
      <div style={{ 
        fontSize: '0.95rem', 
        fontWeight: 800, 
        color: 'var(--text-main)', 
        marginBottom: '0.85rem',
        letterSpacing: '-0.01em'
      }}>
        Switch accounts
      </div>

      {/* Active Account Item (Matching Google/Canva Profile with Avatar, Name, Email and Checkmark) */}
      <div 
        className="account-popover-item"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.65rem',
          borderRadius: '16px',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-subtle)',
          cursor: 'pointer',
          marginBottom: '0.5rem'
        }}
        onClick={() => {
          setActiveTab('settings');
          onClose();
        }}
        title="Active account • Click to manage profile"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', minWidth: 0 }}>
          {currentUser?.avatarUrl ? (
            <img 
              src={currentUser.avatarUrl} 
              alt={userDisplayName} 
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '2px solid var(--primary)',
                flexShrink: 0
              }}
            />
          ) : (
            <div 
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                background: currentRole === 'admin' ? 'linear-gradient(135deg, #EF4444, #991B1B)' : 
                            currentRole === 'driver' ? 'linear-gradient(135deg, #F59E0B, #D97706)' : 
                            'linear-gradient(135deg, #EF4444, #E11D48)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '1.15rem',
                flexShrink: 0,
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
              }}
            >
              {userDisplayName.charAt(0).toUpperCase()}
            </div>
          )}

          <div style={{ minWidth: 0 }}>
            <div style={{ 
              fontWeight: 800, 
              fontSize: '0.95rem', 
              color: 'var(--text-main)', 
              overflow: 'hidden', 
              textOverflow: 'ellipsis', 
              whiteSpace: 'nowrap' 
            }}>
              {userDisplayName}
            </div>
            <div style={{ 
              fontSize: '0.8rem', 
              color: 'var(--text-muted)', 
              overflow: 'hidden', 
              textOverflow: 'ellipsis', 
              whiteSpace: 'nowrap',
              marginTop: '1px'
            }}>
              {userEmail}
            </div>
          </div>
        </div>

        {/* Checkmark icon (✓) indicating active account */}
        <Check 
          size={20} 
          color="var(--text-main)" 
          style={{ flexShrink: 0, strokeWidth: 2.5, marginLeft: '0.5rem' }} 
        />
      </div>

      {/* Subtle Hairline Divider */}
      <div 
        style={{ 
          height: '1px', 
          background: 'var(--border-subtle)', 
          margin: '0.65rem 0' 
        }} 
      />

      {/* Action 1: Add another account (Directly throws to registration for active role) */}
      <button
        type="button"
        className="account-popover-item"
        onClick={handleAddAnotherAccount}
        title={`Register a new ${currentRole === 'driver' ? 'Delivery Captain' : 'Customer'} account`}
      >
        <Plus size={20} color="var(--text-main)" style={{ flexShrink: 0 }} />
        <span>Add another account</span>
      </button>

      {/* Action 2: Manage accounts */}
      <button
        type="button"
        className="account-popover-item"
        onClick={() => {
          onClose();
          setActiveTab('settings');
        }}
        title="Open profile & settings"
      >
        <UserCog size={20} color="var(--text-main)" style={{ flexShrink: 0 }} />
        <span>Manage accounts</span>
      </button>

      {/* Action 3: Sign Out */}
      <button
        type="button"
        className="account-popover-item"
        onClick={() => {
          onClose();
          logoutUser();
        }}
        style={{ color: '#EF4444' }}
        title="Sign out of active account"
      >
        <LogOut size={20} color="#EF4444" style={{ flexShrink: 0 }} />
        <span>Sign out</span>
      </button>
    </div>
  );
}
