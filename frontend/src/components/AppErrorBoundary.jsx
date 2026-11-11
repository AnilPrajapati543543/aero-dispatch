import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('AeroDispatch View Caught Error:', error, errorInfo);
  }

  componentDidUpdate(prevProps) {
    // Automatically reset error state when user navigates away to another tab
    if (prevProps.activeTab !== this.props.activeTab && this.state.hasError) {
      this.setState({ hasError: false, error: null });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '60vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem'
        }}>
          <div className="card" style={{
            maxWidth: '520px',
            width: '100%',
            textAlign: 'center',
            padding: '2.5rem 2rem',
            border: '1.5px solid rgba(244, 63, 94, 0.35)',
            background: 'linear-gradient(135deg, rgba(244, 63, 94, 0.08) 0%, rgba(15, 23, 42, 0.7) 100%)',
            borderRadius: '24px',
            boxShadow: '0 12px 36px rgba(0, 0, 0, 0.4)'
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'rgba(244, 63, 94, 0.15)',
              color: '#F43F5E',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem'
            }}>
              <AlertTriangle size={28} />
            </div>

            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.45rem' }}>
              Workspace View Recovered
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: '1.5', marginBottom: '1.5rem' }}>
              The current console view encountered an unexpected state. Your authentication session and data remain safe and uninterrupted.
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  if (this.props.setActiveTab) this.props.setActiveTab('dashboard');
                }}
                style={{ borderRadius: '9999px', padding: '0.55rem 1.25rem', fontWeight: 700 }}
              >
                <Home size={15} style={{ marginRight: '6px' }} />
                <span>Return to Dashboard</span>
              </button>

              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => window.location.reload()}
                style={{ borderRadius: '9999px', padding: '0.55rem 1.25rem' }}
              >
                <RefreshCw size={15} style={{ marginRight: '6px' }} />
                <span>Reload Application</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
