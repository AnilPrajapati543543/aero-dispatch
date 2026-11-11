import React, { useState } from 'react';
import { 
  HelpCircle, 
  Plus, 
  X, 
  MessageSquare, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  ShieldAlert, 
  Send,
  Ticket
} from 'lucide-react';

const DEFAULT_SAMPLE_TICKETS = [
  {
    id: 'TKT-AD-2041-8849',
    category: 'Billing, Invoices & GST',
    priority: 'Normal',
    subject: 'Monthly Consolidated GST Invoicing Schedule',
    awbNumber: '',
    message: 'Could you please confirm the dispatch date for the consolidated monthly B2B GST tax invoice statement?',
    status: 'RESOLVED',
    createdAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    agentResponse: 'Hello! Consolidated GST tax invoices are automatically compiled on the 1st of every calendar month and available under Settings > Billing.'
  }
];

export default function SupportTicketModal({ isOpen, onClose, shipments = [], currentUser }) {
  if (!isOpen) return null;

  const [tickets, setTickets] = useState(() => {
    try {
      const saved = localStorage.getItem('aerodispatch_support_tickets');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return DEFAULT_SAMPLE_TICKETS;
  });

  const [activeTab, setActiveTab] = useState('list'); // 'list' | 'new' | 'view'
  const [selectedTicket, setSelectedTicket] = useState(null);

  const [formData, setFormData] = useState({
    category: 'Shipment Delay & Linehaul SLA',
    priority: 'Normal',
    awbNumber: '',
    subject: '',
    message: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const saveTickets = (next) => {
    setTickets(next);
    try {
      localStorage.setItem('aerodispatch_support_tickets', JSON.stringify(next));
    } catch (e) {}
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.subject.trim() || !formData.message.trim()) {
      alert('Please fill out the ticket subject and description.');
      return;
    }

    setIsSubmitting(true);
    const newTicket = {
      id: `TKT-AD-${Date.now().toString().slice(-4)}-${Math.floor(1000 + Math.random() * 9000)}`,
      category: formData.category,
      priority: formData.priority,
      awbNumber: formData.awbNumber.trim(),
      subject: formData.subject.trim(),
      message: formData.message.trim(),
      status: 'OPEN',
      createdAt: new Date().toISOString(),
      agentResponse: 'Thank you for contacting AeroDispatch Operations. An executive has been assigned to your ticket. Average response SLA: under 15 minutes.'
    };

    const next = [newTicket, ...tickets];
    saveTickets(next);
    setIsSubmitting(false);
    setSelectedTicket(newTicket);
    setActiveTab('view');
    setFormData({
      category: 'Shipment Delay & Linehaul SLA',
      priority: 'Normal',
      awbNumber: '',
      subject: '',
      message: ''
    });
  };

  return (
    <div 
      className="modal-overlay" 
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        padding: '1rem'
      }}
    >
      <div 
        className="card"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '780px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          borderRadius: '24px',
          overflow: 'hidden',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.5)',
          border: '1px solid var(--border-medium)',
          background: 'var(--bg-card)'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '1.25rem 1.75rem',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(255, 255, 255, 0.02)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: 'rgba(244, 63, 94, 0.12)',
              color: '#F43F5E',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <HelpCircle size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>
                Customer Support &amp; Help Desk
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Track active requests or file a high-priority logistics support ticket
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {activeTab !== 'new' && (
              <button
                type="button"
                className="btn btn-sm btn-primary"
                onClick={() => setActiveTab('new')}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', padding: '0.45rem 0.85rem' }}
              >
                <Plus size={15} />
                <span>New Ticket</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '6px',
                borderRadius: '8px'
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Tab Pill Navigation */}
        <div style={{
          padding: '0.75rem 1.75rem',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          gap: '0.5rem',
          background: 'rgba(0, 0, 0, 0.15)'
        }}>
          <button
            type="button"
            onClick={() => setActiveTab('list')}
            className={`btn btn-sm ${activeTab === 'list' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.8rem', padding: '0.4rem 0.9rem' }}
          >
            My Tickets ({tickets.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('new')}
            className={`btn btn-sm ${activeTab === 'new' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.8rem', padding: '0.4rem 0.9rem' }}
          >
            + Create New Ticket
          </button>
          {selectedTicket && (
            <button
              type="button"
              onClick={() => setActiveTab('view')}
              className={`btn btn-sm ${activeTab === 'view' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.8rem', padding: '0.4rem 0.9rem' }}
            >
              Ticket {selectedTicket.id}
            </button>
          )}
        </div>

        {/* Body Content */}
        <div style={{ padding: '1.5rem 1.75rem', overflowY: 'auto', flex: 1 }}>
          {activeTab === 'new' ? (
            /* New Ticket Form */
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="form-label" style={{ fontSize: '0.8rem' }}>Ticket Category *</label>
                  <select
                    className="form-control"
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  >
                    <option value="Shipment Delay & Linehaul SLA">Shipment Delay &amp; Linehaul SLA</option>
                    <option value="Delivery Proof & Photo Verification">Delivery Proof &amp; Photo Verification</option>
                    <option value="Damaged or Lost Consignment">Damaged or Lost Consignment</option>
                    <option value="Billing, Invoices & GST">Billing, Invoices &amp; GST</option>
                    <option value="Courier Conduct & Contact">Courier Conduct &amp; Contact</option>
                    <option value="Technical Support">Technical &amp; Account Support</option>
                  </select>
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: '0.8rem' }}>Priority Level</label>
                  <select
                    className="form-control"
                    value={formData.priority}
                    onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                  >
                    <option value="Normal">Normal (Standard SLA)</option>
                    <option value="High">High (Express Consignments)</option>
                    <option value="Urgent">Urgent (Immediate Linehaul Lead)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '0.8rem' }}>Related AWB Consignment (Optional)</label>
                <input
                  type="text"
                  className="form-control mono"
                  placeholder="e.g. AD-8849-2041"
                  value={formData.awbNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, awbNumber: e.target.value }))}
                />
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '0.8rem' }}>Subject *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Brief summary of your inquiry"
                  value={formData.subject}
                  onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                  required
                />
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '0.8rem' }}>Detailed Description *</label>
                <textarea
                  className="form-control"
                  rows={4}
                  placeholder="Provide complete details including shipment dates, addresses, or required adjustments..."
                  value={formData.message}
                  onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setActiveTab('list')}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={isSubmitting}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <Send size={15} />
                  <span>Submit Ticket</span>
                </button>
              </div>
            </form>
          ) : activeTab === 'view' && selectedTicket ? (
            /* Ticket Detail Thread View */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <span className="mono" style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--primary)' }}>
                      {selectedTicket.id}
                    </span>
                    <span style={{
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: '9999px',
                      background: selectedTicket.status === 'RESOLVED' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(0, 240, 255, 0.15)',
                      color: selectedTicket.status === 'RESOLVED' ? '#10B981' : '#00F0FF',
                      border: selectedTicket.status === 'RESOLVED' ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(0, 240, 255, 0.3)'
                    }}>
                      ● {selectedTicket.status}
                    </span>
                  </div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)' }}>
                    {selectedTicket.subject}
                  </h3>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Category: <strong>{selectedTicket.category}</strong> &bull; Priority: {selectedTicket.priority} &bull; Created: {new Date(selectedTicket.createdAt).toLocaleString()}
                  </div>
                </div>

                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setActiveTab('list')}
                >
                  Back to All Tickets
                </button>
              </div>

              {/* User Message */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '16px',
                padding: '1.25rem'
              }}>
                <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 800, marginBottom: '6px' }}>
                  Your Inquiry Description
                </div>
                <p style={{ color: 'var(--text-main)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                  {selectedTicket.message}
                </p>
                {selectedTicket.awbNumber && (
                  <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Linked AWB: <strong className="mono" style={{ color: 'var(--primary)' }}>{selectedTicket.awbNumber}</strong>
                  </div>
                )}
              </div>

              {/* Operations Lead Response */}
              <div style={{
                background: 'rgba(0, 240, 255, 0.05)',
                border: '1px solid rgba(0, 240, 255, 0.25)',
                borderRadius: '16px',
                padding: '1.25rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '6px' }}>
                  <CheckCircle2 size={16} color="var(--primary)" />
                  <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', color: 'var(--primary)', fontWeight: 800 }}>
                    AeroDispatch Operations Lead Response
                  </span>
                </div>
                <p style={{ color: 'var(--text-main)', fontSize: '0.88rem', lineHeight: 1.6 }}>
                  {selectedTicket.agentResponse}
                </p>
              </div>
            </div>
          ) : (
            /* Ticket List */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {tickets.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                  <Ticket size={36} color="var(--text-dim)" style={{ marginBottom: '0.75rem', opacity: 0.5 }} />
                  <p>You have no active support tickets.</p>
                </div>
              ) : (
                tickets.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => {
                      setSelectedTicket(t);
                      setActiveTab('view');
                    }}
                    style={{
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '16px',
                      padding: '1.1rem 1.25rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                        <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 800 }}>
                          {t.id}
                        </span>
                        <span style={{
                          fontSize: '0.68rem',
                          fontWeight: 800,
                          padding: '2px 8px',
                          borderRadius: '9999px',
                          background: t.status === 'RESOLVED' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(0, 240, 255, 0.15)',
                          color: t.status === 'RESOLVED' ? '#10B981' : '#00F0FF'
                        }}>
                          ● {t.status}
                        </span>
                      </div>
                      <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-main)' }}>
                        {t.subject}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {t.category} &bull; {new Date(t.createdAt).toLocaleDateString()}
                      </div>
                    </div>

                    <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 700 }}>
                      View Thread ➔
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '1rem 1.75rem',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(255, 255, 255, 0.02)'
        }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Operations Emergency Desk: <strong style={{ color: 'var(--text-main)' }}>+91 84338 26567</strong>
          </span>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

