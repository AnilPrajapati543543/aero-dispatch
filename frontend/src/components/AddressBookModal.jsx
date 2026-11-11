import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Plus, 
  MapPin, 
  Phone, 
  User, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  Building2, 
  Star 
} from 'lucide-react';

const DEFAULT_ADDRESS_PRESETS = [
  {
    id: 'addr-default-1',
    label: 'Mumbai Headquarters',
    name: 'Anil Prajapati',
    phone: '+91 84338 26567',
    city: 'Mumbai',
    state: 'Maharashtra',
    pin: '400001',
    address: 'AeroDispatch Logistics Node, Nariman Point Financial District, Marine Drive',
    isDefault: true
  },
  {
    id: 'addr-default-2',
    label: 'Bengaluru Technology Hub',
    name: 'Consignee Recipient',
    phone: '+91 98451 90214',
    city: 'Bengaluru',
    state: 'Karnataka',
    pin: '560001',
    address: 'Flat 402, Sea View Heights, 100 Feet Road, Indiranagar',
    isDefault: false
  }
];

export default function AddressBookModal({ isOpen, onClose, onSelectAddress, mode = 'manage' }) {
  if (!isOpen) return null;

  const [addresses, setAddresses] = useState(() => {
    try {
      const saved = localStorage.getItem('aerodispatch_address_book');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return DEFAULT_ADDRESS_PRESETS;
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    label: 'Office',
    name: '',
    phone: '',
    city: '',
    state: '',
    pin: '',
    address: '',
    isDefault: false
  });

  // Save changes to localStorage whenever addresses update
  const saveAddresses = (newAddresses) => {
    setAddresses(newAddresses);
    try {
      localStorage.setItem('aerodispatch_address_book', JSON.stringify(newAddresses));
    } catch (e) {}
  };

  const handleOpenAdd = () => {
    setFormData({
      label: 'Branch Office',
      name: '',
      phone: '',
      city: '',
      state: '',
      pin: '',
      address: '',
      isDefault: false
    });
    setEditingId(null);
    setIsEditing(true);
  };

  const handleOpenEdit = (addr) => {
    setFormData({
      label: addr.label || 'Location',
      name: addr.name || '',
      phone: addr.phone || '',
      city: addr.city || '',
      state: addr.state || '',
      pin: addr.pin || '',
      address: addr.address || '',
      isDefault: !!addr.isDefault
    });
    setEditingId(addr.id);
    setIsEditing(true);
  };

  const handleDelete = (id) => {
    const next = addresses.filter(a => a.id !== id);
    saveAddresses(next);
  };

  const handleSetDefault = (id) => {
    const next = addresses.map(a => ({
      ...a,
      isDefault: a.id === id
    }));
    saveAddresses(next);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.city.trim() || !formData.address.trim()) {
      alert('Please fill in the contact name, city, and street address.');
      return;
    }

    if (editingId) {
      const next = addresses.map(a => {
        if (a.id === editingId) {
          return {
            ...a,
            ...formData,
            id: editingId
          };
        }
        return formData.isDefault ? { ...a, isDefault: false } : a;
      });
      saveAddresses(next);
    } else {
      const newAddr = {
        id: `addr-${Date.now()}`,
        ...formData
      };
      const next = formData.isDefault 
        ? [newAddr, ...addresses.map(a => ({ ...a, isDefault: false }))]
        : [newAddr, ...addresses];
      saveAddresses(next);
    }

    setIsEditing(false);
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
          maxWidth: '750px',
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
        {/* Modal Header */}
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
              background: 'rgba(0, 240, 255, 0.12)',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <BookOpen size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>
                {mode === 'select' ? 'Select from Address Book' : 'Customer Address Book'}
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {mode === 'select' ? 'Pick a saved merchant address to auto-populate the booking form' : 'Manage your recurring pickup locations & consignee destinations'}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {!isEditing && (
              <button
                type="button"
                className="btn btn-sm btn-primary"
                onClick={handleOpenAdd}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', padding: '0.45rem 0.85rem' }}
              >
                <Plus size={15} />
                <span>Add Address</span>
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

        {/* Modal Body */}
        <div style={{ padding: '1.5rem 1.75rem', overflowY: 'auto', flex: 1 }}>
          {isEditing ? (
            /* Add / Edit Form */
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  {editingId ? 'Edit Address Record' : 'Save New Address'}
                </h4>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="form-label" style={{ fontSize: '0.8rem' }}>Address Label *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Mumbai Warehouse, Head Office"
                    value={formData.label}
                    onChange={(e) => setFormData(prev => ({ ...prev, label: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '0.8rem' }}>Contact Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Full recipient / sender name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="form-label" style={{ fontSize: '0.8rem' }}>Phone Number *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="+91 98XXX XXXXX"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '0.8rem' }}>PIN Code *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. 400001"
                    value={formData.pin}
                    onChange={(e) => setFormData(prev => ({ ...prev, pin: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="form-label" style={{ fontSize: '0.8rem' }}>City *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Mumbai, Bengaluru"
                    value={formData.city}
                    onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '0.8rem' }}>State</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Maharashtra, Karnataka"
                    value={formData.state}
                    onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '0.8rem' }}>Complete Street Address *</label>
                <textarea
                  className="form-control"
                  rows={2}
                  placeholder="Building, street, landmark, floor, unit number"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  required
                />
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                <input
                  type="checkbox"
                  checked={formData.isDefault}
                  onChange={(e) => setFormData(prev => ({ ...prev, isDefault: e.target.checked }))}
                />
                <span>Set as default primary address</span>
              </label>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                >
                  Save to Address Book
                </button>
              </div>
            </form>
          ) : (
            /* Address List */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {addresses.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                  <MapPin size={36} color="var(--text-dim)" style={{ marginBottom: '0.75rem', opacity: 0.5 }} />
                  <p>Your address book is empty. Add your recurring business locations for 1-click booking.</p>
                </div>
              ) : (
                addresses.map((addr) => (
                  <div
                    key={addr.id}
                    style={{
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: addr.isDefault ? '1px solid rgba(0, 240, 255, 0.4)' : '1px solid var(--border-subtle)',
                      borderRadius: '16px',
                      padding: '1.25rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      gap: '1rem',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                        <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-main)' }}>
                          {addr.label}
                        </span>
                        {addr.isDefault && (
                          <span style={{
                            fontSize: '0.68rem',
                            fontWeight: 800,
                            padding: '2px 8px',
                            borderRadius: '9999px',
                            background: 'rgba(0, 240, 255, 0.12)',
                            color: 'var(--primary)',
                            border: '1px solid rgba(0, 240, 255, 0.3)'
                          }}>
                            ★ DEFAULT
                          </span>
                        )}
                      </div>

                      <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)' }}>
                        {addr.name} &bull; <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>{addr.phone}</span>
                      </div>

                      <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                        {addr.address}
                      </div>

                      <div style={{ fontSize: '0.82rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                        {addr.city}, {addr.state} - <strong>{addr.pin}</strong>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {mode === 'select' && onSelectAddress && (
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          onClick={() => {
                            onSelectAddress(addr);
                            onClose();
                          }}
                          style={{ padding: '0.4rem 0.9rem', fontSize: '0.78rem' }}
                        >
                          Use Address
                        </button>
                      )}

                      {!addr.isDefault && (
                        <button
                          type="button"
                          onClick={() => handleSetDefault(addr.id)}
                          title="Set as Default"
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-dim)',
                            cursor: 'pointer',
                            padding: '6px'
                          }}
                        >
                          <Star size={16} />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleOpenEdit(addr)}
                        title="Edit Address"
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--text-muted)',
                          cursor: 'pointer',
                          padding: '6px'
                        }}
                      >
                        <Edit3 size={16} />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(addr.id)}
                        title="Delete Address"
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#F43F5E',
                          cursor: 'pointer',
                          padding: '6px'
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div style={{
          padding: '1rem 1.75rem',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          background: 'rgba(255, 255, 255, 0.02)'
        }}>
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
