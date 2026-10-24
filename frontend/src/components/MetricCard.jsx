import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

export default function MetricCard({ title, value, icon: Icon, trend, trendDirection = 'up', subtitle }) {
  return (
    <div className="metric-card">
      <div>
        <div className="metric-label">{title}</div>
        <div className="metric-value">{value}</div>
        {trend && (
          <div className={`metric-trend ${trendDirection}`}>
            {trendDirection === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            <span>{trend}</span>
          </div>
        )}
        {subtitle && !trend && (
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.35rem' }}>
            {subtitle}
          </div>
        )}
      </div>

      {Icon && (
        <div className="metric-icon-box">
          <Icon size={24} />
        </div>
      )}
    </div>
  );
}
