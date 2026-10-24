import React from 'react';
import { useApp } from '../context/AppContext';
import { CheckCircle, AlertTriangle, Info, X } from 'lucide-react';

export default function ToastContainer() {
  const { toasts, removeToast } = useApp();

  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map(toast => {
        let Icon = Info;
        if (toast.type === 'success') Icon = CheckCircle;
        if (toast.type === 'warning') Icon = AlertTriangle;

        return (
          <div key={toast.id} className={`toast ${toast.type}`}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Icon size={18} />
              <span>{toast.message}</span>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
