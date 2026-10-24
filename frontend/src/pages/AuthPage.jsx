import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ShieldCheck, Truck, User, Key, Mail, Lock, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function AuthPage() {
  const { switchRole, setActiveTab, addToast } = useApp();
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState('customer');
  const [name, setName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !password) {
      addToast('Please enter both email and password', 'warning');
      return;
    }

    switchRole(selectedRole);
    addToast(`Successfully authenticated as ${selectedRole.toUpperCase()} (Phase 1 Mock)`, 'success');
    if (selectedRole === 'customer') setActiveTab('customer');
    else if (selectedRole === 'driver') setActiveTab('driver');
    else if (selectedRole === 'admin') setActiveTab('admin');
  };

  const quickLoginAs = (role) => {
    switchRole(role);
    addToast(`Logged in as Demo ${role.toUpperCase()}`, 'success');
    if (role === 'customer') setActiveTab('customer');
    else if (role === 'driver') setActiveTab('driver');
    else if (role === 'admin') setActiveTab('admin');
  };

  return (
    <div style={{ maxWidth: '900px', margin: '3rem auto', padding: '0 1.5rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>AeroDispatch Portal Access</h1>
        <p style={{ color: 'var(--text-muted)' }}>
          Secure authentication gateway for customers, fleet drivers, and operations controllers.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        {/* Form Box */}
        <div className="card">
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
            <button
              className={`btn btn-sm ${authMode === 'login' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ flex: 1 }}
              onClick={() => setAuthMode('login')}
            >
              Sign In
            </button>
            <button
              className={`btn btn-sm ${authMode === 'register' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ flex: 1 }}
              onClick={() => setAuthMode('register')}
            >
              Create Account
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            {authMode === 'register' && (
              <div className="form-group">
                <label className="form-label">Full Name / Merchant Organization</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Ramesh Enterprises"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  className="form-input"
                  placeholder="name@aerodispatch.internal"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Select Workspace Role</label>
              <select
                className="form-select"
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
              >
                <option value="customer">Consignor / Customer (Order Booking &amp; Tracking)</option>
                <option value="driver">Delivery Associate / Driver (Run-Sheets &amp; Proof)</option>
                <option value="admin">Logistics Dispatcher / Admin (Control Tower)</option>
              </select>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.75rem' }}>
              <span>{authMode === 'login' ? 'Authenticate Session' : 'Register Profile'}</span>
              <ArrowRight size={16} />
            </button>

            <div style={{ marginTop: '1rem', fontSize: '0.75rem', color: 'var(--text-dim)', textAlign: 'center' }}>
              ⚡ <em>AWS Cognito User Pool JWT integration scheduled for Phase 4.</em>
            </div>
          </form>
        </div>

        {/* Instant Demo Role Switcher */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="card" style={{ borderColor: 'var(--border-accent)', background: 'rgba(0, 240, 255, 0.03)' }}>
            <h3 style={{ fontSize: '1.05rem', color: 'var(--primary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Key size={16} />
              <span>Instant 1-Click Demo Profiles</span>
            </h3>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Quickly test each role's distinct UI views without needing to register or enter passwords:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button
                className="btn btn-secondary"
                style={{ justifyContent: 'space-between', padding: '0.85rem 1rem' }}
                onClick={() => quickLoginAs('customer')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textAlign: 'left' }}>
                  <User size={18} color="var(--primary)" />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>Customer: Aditya Sharma</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Enterprise Merchant Tier • Bengaluru</div>
                  </div>
                </div>
                <ArrowRight size={14} />
              </button>

              <button
                className="btn btn-secondary"
                style={{ justifyContent: 'space-between', padding: '0.85rem 1rem' }}
                onClick={() => quickLoginAs('driver')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textAlign: 'left' }}>
                  <Truck size={18} color="var(--accent-amber)" />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>Driver: Ramesh Kumar</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Vehicle KA-03-EV-4412 • Indiranagar Hub</div>
                  </div>
                </div>
                <ArrowRight size={14} />
              </button>

              <button
                className="btn btn-secondary"
                style={{ justifyContent: 'space-between', padding: '0.85rem 1rem' }}
                onClick={() => quickLoginAs('admin')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textAlign: 'left' }}>
                  <ShieldCheck size={18} color="var(--secondary)" />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>Dispatcher: Priya Nair</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>National Operations Director • All Hubs</div>
                  </div>
                </div>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>

          <div className="card">
            <h4 style={{ fontSize: '0.9rem', marginBottom: '0.4rem', color: '#FFFFFF' }}>Security &amp; Architecture Roadmap</h4>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              In subsequent phases, AeroDispatch will implement <strong>Amazon Cognito</strong> user pools with MFA, 
              role-based claims (`custom:role`), and API Gateway HTTP API JWT authorizers to safeguard all endpoints.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
