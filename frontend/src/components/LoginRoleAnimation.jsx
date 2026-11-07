import React, { useEffect, useState } from 'react';
import { Package, Truck } from 'lucide-react';

export default function LoginRoleAnimation({ role = 'customer', onComplete }) {
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsClosing(true);
    }, 1100);

    const endTimer = setTimeout(() => {
      if (onComplete) onComplete();
    }, 1400);

    return () => {
      clearTimeout(timer);
      clearTimeout(endTimer);
    };
  }, [onComplete]);

  const configs = {
    customer: {
      color: '#10B981',
      glow: 'rgba(16, 185, 129, 0.55)',
      border: 'rgba(16, 185, 129, 0.6)',
      badgeBg: 'rgba(16, 185, 129, 0.16)',
      icon: Package
    },
    driver: {
      color: '#F59E0B',
      glow: 'rgba(245, 158, 11, 0.55)',
      border: 'rgba(245, 158, 11, 0.6)',
      badgeBg: 'rgba(245, 158, 11, 0.16)',
      icon: Truck
    },
    admin: {
      color: '#EF4444',
      glow: 'rgba(239, 68, 68, 0.55)',
      border: 'rgba(239, 68, 68, 0.6)',
      badgeBg: 'rgba(239, 68, 68, 0.16)',
      icon: null // Shows "!"
    }
  };

  const current = configs[role] || configs.customer;
  const Icon = current.icon;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 999999,
        pointerEvents: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'transparent', // Explicitly NO background as requested
        transition: 'opacity 0.3s ease',
        opacity: isClosing ? 0 : 1
      }}
    >
      <div
        style={{
          background: 'rgba(10, 15, 29, 0.92)',
          backdropFilter: 'blur(20px)',
          border: `2px solid ${current.border}`,
          boxShadow: `0 25px 60px rgba(0, 0, 0, 0.75), 0 0 45px ${current.glow}`,
          borderRadius: '50%',
          padding: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transform: isClosing ? 'scale(0.85) translateY(-10px)' : 'scale(1) translateY(0)',
          transition: 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease',
          animation: 'aeroRoleEntrance 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards'
        }}
      >
        {/* Animated Icon Avatar - Strictly Logos Only, Zero Text */}
        <div
          style={{
            position: 'relative',
            width: '88px',
            height: '88px',
            borderRadius: '50%',
            background: current.badgeBg,
            border: `2.5px solid ${current.color}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: current.color,
            boxShadow: `0 0 35px ${current.glow}`
          }}
        >
          {role === 'admin' ? (
            <span style={{ fontSize: '3rem', fontWeight: 900, color: '#EF4444', lineHeight: 1, userSelect: 'none' }}>!</span>
          ) : (
            <Icon size={46} strokeWidth={2.2} />
          )}

          {/* Radar beacon ring ping */}
          <div
            style={{
              position: 'absolute',
              inset: '-12px',
              borderRadius: '50%',
              border: `2px solid ${current.color}`,
              opacity: 0.6,
              animation: 'aeroBeaconPing 1.4s infinite'
            }}
          />
        </div>
      </div>
    </div>
  );
}
