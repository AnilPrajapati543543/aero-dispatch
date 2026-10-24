import React from 'react';
import { Database, ShieldAlert, Cpu } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function MockNoticeBanner() {
  const { resetToDefaultMock } = useApp();

  return (
    <div className="mock-banner">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
        <span className="mock-banner-tag">Phase 1 Demo</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Cpu size={14} color="var(--primary)" />
          <span>
            <strong>Local Client-Side Mock Active:</strong> Orders and tracking events are currently simulated in memory & browser storage.
            <em> No AWS Lambda or DynamoDB connected yet.</em>
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <button 
          onClick={resetToDefaultMock}
          style={{
            background: 'transparent',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            color: 'var(--text-muted)',
            padding: '2px 8px',
            borderRadius: '4px',
            fontSize: '0.7rem',
            cursor: 'pointer'
          }}
          title="Reset to original mock shipments"
        >
          Reset Mock Data
        </button>
      </div>
    </div>
  );
}
