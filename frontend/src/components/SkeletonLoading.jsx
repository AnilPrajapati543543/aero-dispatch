import React from 'react';

// Reusable Skeleton Box with Shimmer (Skull loading)
export function SkeletonBlock({ width = '100%', height = '16px', borderRadius = 'var(--radius-sm)', style = {} }) {
  return (
    <div 
      className="skeleton" 
      style={{ 
        width, 
        height, 
        borderRadius,
        ...style 
      }} 
    />
  );
}

// Metric Skeleton Grid (Cards Shimmer)
export function SkeletonMetricsGrid({ count = 4, className = '' }) {
  const gridClass = className || (count === 5 ? 'grid grid-cols-5' : 'grid-cols-4');
  return (
    <div className={gridClass} style={{ gap: '1rem', marginBottom: '1.75rem' }}>
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="metric-card" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
            <SkeletonBlock width="45%" height="13px" />
            <SkeletonBlock width="32px" height="32px" borderRadius="var(--radius-md)" />
          </div>
          <SkeletonBlock width="60%" height="28px" />
          <SkeletonBlock width="75%" height="12px" />
        </div>
      ))}
    </div>
  );
}

// Table Rows Skeleton
export function SkeletonTableRows({ rows = 5, cols = 5 }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rIdx) => (
        <tr key={rIdx}>
          {Array.from({ length: cols }).map((_, cIdx) => (
            <td key={cIdx} style={{ padding: '1rem 0.75rem' }}>
              <SkeletonBlock 
                width={cIdx === 0 ? '70%' : cIdx === 1 ? '55%' : '80%'} 
                height="15px" 
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

// Run-Sheet Stops Skeleton (Driver Cockpit)
export function SkeletonRunSheet({ count = 3 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="card" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', gap: '1.5rem', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 320px', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <SkeletonBlock width="26px" height="26px" borderRadius="50%" />
              <SkeletonBlock width="130px" height="20px" />
              <SkeletonBlock width="80px" height="18px" />
            </div>
            <SkeletonBlock width="40%" height="18px" />
            <SkeletonBlock width="65%" height="14px" />
            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.25rem' }}>
              <SkeletonBlock width="80px" height="12px" />
              <SkeletonBlock width="90px" height="12px" />
              <SkeletonBlock width="100px" height="12px" />
            </div>
          </div>
          <div style={{ minWidth: '180px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <SkeletonBlock width="100%" height="38px" borderRadius="var(--radius-sm)" />
            <SkeletonBlock width="100%" height="32px" borderRadius="var(--radius-sm)" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Map Telemetry Skeleton
export function SkeletonMap() {
  return (
    <div 
      className="card skeleton" 
      style={{ 
        width: '100%', 
        height: '320px', 
        borderRadius: 'var(--radius-lg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', opacity: 0.5 }}>
        <SkeletonBlock width="160px" height="16px" />
        <SkeletonBlock width="240px" height="12px" />
      </div>
    </div>
  );
}

export default {
  SkeletonBlock,
  SkeletonMetricsGrid,
  SkeletonTableRows,
  SkeletonRunSheet,
  SkeletonMap
};

