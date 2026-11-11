import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

export default function MetricCard({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  trendDirection = 'up', 
  subtitle,
  color,
  badge,
  onClick
}) {
  const iconBoxStyle = color ? {
    background: `${color}18`,
    color: color,
    border: `1px solid ${color}35`
  } : {};

  return (
    <div 
      className={`metric-card ${onClick ? 'clickable' : ''}`}
      onClick={onClick}
      style={{
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.2rem' }}>
          <div className="metric-label" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {title}
          </div>
          {badge && (
            <span 
              style={{
                fontSize: '0.68rem',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '9999px',
                background: color ? `${color}16` : 'rgba(0, 240, 255, 0.1)',
                color: color || 'var(--primary)',
                border: `1px solid ${color ? `${color}35` : 'rgba(0, 240, 255, 0.25)'}`,
                whiteSpace: 'nowrap',
                letterSpacing: '0.02em'
              }}
            >
              {badge}
            </span>
          )}
        </div>

        <div className="metric-value">
          {value}
        </div>

        {trend && (
          <div className={`metric-trend ${trendDirection}`}>
            {trendDirection === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            <span>{trend}</span>
          </div>
        )}

        {subtitle && !trend && (
          <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', marginTop: '0.35rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {subtitle}
          </div>
        )}
      </div>

      {Icon && (
        <div className="metric-icon-box" style={{ ...iconBoxStyle, marginLeft: '0.75rem', flexShrink: 0 }}>
          <Icon size={24} />
        </div>
      )}
    </div>
  );
}
