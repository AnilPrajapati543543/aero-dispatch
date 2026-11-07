import React from 'react';
import { SkeletonBlock, SkeletonMetricsGrid, SkeletonTableRows } from './SkeletonLoading';

export default function FullPageSkeleton({ isDashboardView = true }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-main, #070B14)' }}>
      {/* 1. Header Navbar Skeleton */}
      <header
        style={{
          height: '72px',
          borderBottom: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))',
          background: 'var(--bg-secondary, rgba(13, 21, 39, 0.95))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 1.5rem',
          position: 'sticky',
          top: 0,
          zIndex: 99
        }}
      >
        {/* Brand Logo & Platform Pill Skeleton */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <SkeletonBlock width="40px" height="40px" borderRadius="10px" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <SkeletonBlock width="120px" height="18px" />
            <SkeletonBlock width="80px" height="10px" />
          </div>
          <SkeletonBlock width="130px" height="22px" borderRadius="9999px" style={{ marginLeft: '0.5rem' }} />
        </div>

        {/* Search Bar Skeleton */}
        <div style={{ flex: '0 1 420px', display: 'flex' }}>
          <SkeletonBlock width="100%" height="40px" borderRadius="9999px" />
        </div>

        {/* Right Action Icons & Avatar Pill Skeleton */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <SkeletonBlock width="36px" height="36px" borderRadius="50%" />
          <SkeletonBlock width="36px" height="36px" borderRadius="50%" />
          <SkeletonBlock width="36px" height="36px" borderRadius="50%" />
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '4px 10px', borderRadius: '9999px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <SkeletonBlock width="28px" height="28px" borderRadius="50%" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <SkeletonBlock width="70px" height="12px" />
              <SkeletonBlock width="45px" height="8px" />
            </div>
          </div>
        </div>
      </header>

      {/* 2. Main Content Layout (Sidebar + Body) */}
      <div style={{ display: 'flex', flex: 1 }}>
        {/* Sidebar Skeleton (if authenticated/dashboard view) */}
        {isDashboardView && (
          <aside
            style={{
              width: '240px',
              borderRight: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))',
              background: 'var(--bg-secondary, rgba(13, 21, 39, 0.6))',
              padding: '1.5rem 1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem',
              flexShrink: 0
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <SkeletonBlock width="40%" height="11px" />
              <SkeletonBlock width="100%" height="38px" borderRadius="8px" />
              <SkeletonBlock width="100%" height="38px" borderRadius="8px" />
              <SkeletonBlock width="100%" height="38px" borderRadius="8px" />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <SkeletonBlock width="40%" height="11px" />
              <SkeletonBlock width="100%" height="38px" borderRadius="8px" />
              <SkeletonBlock width="100%" height="38px" borderRadius="8px" />
              <SkeletonBlock width="100%" height="38px" borderRadius="8px" />
            </div>

            <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
              <SkeletonBlock width="32px" height="32px" borderRadius="50%" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                <SkeletonBlock width="80%" height="12px" />
                <SkeletonBlock width="50%" height="10px" />
              </div>
            </div>
          </aside>
        )}

        {/* Main Body Skeleton */}
        <main style={{ flex: 1, padding: '2rem 1.75rem', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          {/* Top Page Header Skeleton */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <SkeletonBlock width="260px" height="28px" borderRadius="6px" />
              <SkeletonBlock width="380px" height="14px" />
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <SkeletonBlock width="110px" height="38px" borderRadius="8px" />
              <SkeletonBlock width="130px" height="38px" borderRadius="8px" />
            </div>
          </div>

          {/* 4 Metric Cards Shimmer Grid */}
          <SkeletonMetricsGrid count={4} />

          {/* Content Card with Table Skeleton */}
          <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <SkeletonBlock width="180px" height="18px" />
                <SkeletonBlock width="220px" height="12px" />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <SkeletonBlock width="90px" height="32px" borderRadius="6px" />
                <SkeletonBlock width="120px" height="32px" borderRadius="6px" />
              </div>
            </div>

            {/* Shimmer Table */}
            <div className="table-container" style={{ overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                    <th style={{ padding: '0.85rem' }}><SkeletonBlock width="70%" height="14px" /></th>
                    <th style={{ padding: '0.85rem' }}><SkeletonBlock width="60%" height="14px" /></th>
                    <th style={{ padding: '0.85rem' }}><SkeletonBlock width="60%" height="14px" /></th>
                    <th style={{ padding: '0.85rem' }}><SkeletonBlock width="50%" height="14px" /></th>
                    <th style={{ padding: '0.85rem' }}><SkeletonBlock width="55%" height="14px" /></th>
                    <th style={{ padding: '0.85rem' }}><SkeletonBlock width="45%" height="14px" /></th>
                  </tr>
                </thead>
                <tbody>
                  <SkeletonTableRows rows={6} cols={6} />
                </tbody>
              </table>
            </div>
          </div>

          {/* Bottom Telemetry Loading Indicator Badge */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.65rem', marginTop: '1rem', color: '#94A3B8', fontSize: '0.82rem' }}>
            <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#EF4444', animation: 'aeroBeaconPing 1.2s infinite' }} />
            <span>Initializing AeroDispatch Telemetry Engine... Full Page Reload (2.0s)</span>
          </div>
        </main>
      </div>
    </div>
  );
}

