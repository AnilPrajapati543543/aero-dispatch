import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Check, X, ShieldCheck } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function CookieConsentBanner() {
  const { activeTab, currentUser, addToast } = useApp();
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Toggle switch states in Customize Modal (matching Image 2)
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false);
  const [advertisingEnabled, setAdvertisingEnabled] = useState(false);

  // Accordion expansion states
  const [expandedSection, setExpandedSection] = useState(null); // 'necessary' | 'analytics' | 'advertising' | null

  useEffect(() => {
    // Check if user has already consented (Accept, Reject, or Custom)
    const savedConsent = localStorage.getItem('aerodispatch_cookie_consent');
    if (savedConsent) {
      return; // Never show again once agreed or declined
    }

    // Only show on public landing page or when not in logged-in dashboard view
    const isPublic = !currentUser && (activeTab === 'landing' || activeTab === 'track' || !activeTab);
    if (!isPublic && activeTab !== 'landing') {
      return;
    }

    // Smooth entrance immediately upon mount
    setIsVisible(true);
  }, [activeTab, currentUser]);

  const handleAcceptAll = () => {
    setIsClosing(true);
    setIsModalOpen(false);
    setTimeout(() => {
      localStorage.setItem('aerodispatch_cookie_consent', 'accepted');
      localStorage.setItem('aerodispatch_cookie_preferences', JSON.stringify({
        necessary: true,
        analytics: true,
        advertising: true,
        updatedAt: new Date().toISOString()
      }));
      setIsVisible(false);
      if (addToast) addToast('All cookies accepted. Telemetry & navigation active.', 'success');
    }, 200);
  };

  const handleRejectAll = () => {
    setIsClosing(true);
    setIsModalOpen(false);
    setTimeout(() => {
      localStorage.setItem('aerodispatch_cookie_consent', 'rejected');
      localStorage.setItem('aerodispatch_cookie_preferences', JSON.stringify({
        necessary: true,
        analytics: false,
        advertising: false,
        updatedAt: new Date().toISOString()
      }));
      setIsVisible(false);
      if (addToast) addToast('Non-essential cookies declined.', 'info');
    }, 200);
  };

  const handleAcceptSelection = () => {
    setIsClosing(true);
    setIsModalOpen(false);
    setTimeout(() => {
      localStorage.setItem('aerodispatch_cookie_consent', 'customized');
      localStorage.setItem('aerodispatch_cookie_preferences', JSON.stringify({
        necessary: true,
        analytics: analyticsEnabled,
        advertising: advertisingEnabled,
        updatedAt: new Date().toISOString()
      }));
      setIsVisible(false);
      if (addToast) addToast('Your cookie preferences have been saved.', 'success');
    }, 200);
  };

  const toggleAccordion = (section) => {
    setExpandedSection(prev => prev === section ? null : section);
  };

  if (!isVisible) return null;

  return (
    <>
      {/* =========================================================================
          1. HORIZONTAL BOTTOM COOKIE BANNER (ROUNDED TOP CORNERS, DOCKED, NO FLOATING)
          ========================================================================= */}
      {!isModalOpen && (
        <div
          role="region"
          aria-label="Cookie Consent Banner"
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            width: '100%',
            transform: isClosing ? 'translateY(100%)' : 'translateY(0)',
            opacity: isClosing ? 0 : 1,
            transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.25s ease',
            zIndex: 99998,
            background: 'rgba(255, 255, 255, 0.99)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            borderTopLeftRadius: '16px',
            borderTopRightRadius: '16px',
            borderBottomLeftRadius: 0,
            borderBottomRightRadius: 0,
            borderTop: '1px solid rgba(226, 232, 240, 0.9)',
            boxShadow: '0 -10px 36px rgba(0, 0, 0, 0.16), 0 -2px 8px rgba(0, 0, 0, 0.08)',
            animation: 'none',
            fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
          }}
        >
          <div
            style={{
              maxWidth: '1380px',
              margin: '0 auto',
              padding: '1.25rem 2.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1.5rem',
              width: '100%'
            }}
          >
            {/* Left Text */}
            <div style={{ flex: '1 1 540px', maxWidth: '880px' }}>
              <h3
                style={{
                  fontSize: '1.18rem',
                  fontWeight: 800,
                  color: '#1E293B',
                  margin: '0 0 0.35rem 0',
                  letterSpacing: '-0.01em'
                }}
              >
                We value your privacy
              </h3>
              <p
                style={{
                  fontSize: '0.9rem',
                  color: '#475569',
                  lineHeight: 1.55,
                  margin: 0
                }}
              >
                We use cookies to enhance your browsing experience, serve personalized ads or content, and analyze our traffic. By clicking &quot;Accept All&quot;, you consent to our use of cookies. Please review our{' '}
                <strong
                  style={{ color: '#1967D2', textDecoration: 'underline', cursor: 'pointer' }}
                  onClick={() => setIsModalOpen(true)}
                >
                  cookie list
                </strong>{' '}
                and{' '}
                <strong
                  style={{ color: '#1967D2', textDecoration: 'underline', cursor: 'pointer' }}
                  onClick={() => setIsModalOpen(true)}
                >
                  privacy policy
                </strong>{' '}
                for details.
              </p>
            </div>

            {/* Right Horizontal Buttons Row (Customize ▾ | Reject All | Accept All) */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                gap: '0.75rem',
                flexWrap: 'wrap',
                flexShrink: 0
              }}
            >
              {/* Button 1: Customize ▾ */}
              <button
                type="button"
                id="cookie-customize-btn"
                onClick={() => setIsModalOpen(true)}
                style={{
                  background: '#FFFFFF',
                  border: '1.5px solid #1967D2',
                  color: '#1967D2',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  padding: '0.6rem 1.25rem',
                  borderRadius: '9999px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(25, 103, 210, 0.06)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#FFFFFF')}
              >
                <span>Customize</span>
                <span style={{ fontSize: '10px', marginTop: '1px' }}>▼</span>
              </button>

              {/* Button 2: Reject All */}
              <button
                type="button"
                id="cookie-reject-all-btn"
                onClick={handleRejectAll}
                style={{
                  background: '#FFFFFF',
                  border: '1.5px solid #1967D2',
                  color: '#1967D2',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  padding: '0.6rem 1.35rem',
                  borderRadius: '9999px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(25, 103, 210, 0.06)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#FFFFFF')}
              >
                Reject All
              </button>

              {/* Button 3: Accept All */}
              <button
                type="button"
                id="cookie-accept-all-btn"
                onClick={handleAcceptAll}
                style={{
                  background: '#1967D2',
                  border: '1.5px solid #1967D2',
                  color: '#FFFFFF',
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  padding: '0.6rem 1.45rem',
                  borderRadius: '9999px',
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(25, 103, 210, 0.28)',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#1557B0')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#1967D2')}
              >
                Accept All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          2. MANAGE COOKIE PREFERENCES MODAL (OPENED VIA CUSTOMIZE ▾)
          ========================================================================= */}
      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="manage-cookie-preferences-title"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.72)',
            backdropFilter: 'blur(5px)',
            WebkitBackdropFilter: 'blur(5px)',
            zIndex: 999999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.25rem'
          }}
          onClick={() => setIsModalOpen(false)}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '28px',
              maxWidth: '720px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.4)',
              border: '1px solid #E2E8F0',
              padding: '1.75rem 2rem',
              position: 'relative',
              fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.25rem'
              }}
            >
              <h2
                id="manage-cookie-preferences-title"
                style={{
                  fontSize: '1.25rem',
                  fontWeight: 800,
                  color: '#1E293B',
                  margin: 0,
                  letterSpacing: '-0.01em'
                }}
              >
                Manage Cookie Preferences
              </h2>

              {/* Close Button (Light Rounded Box with X) */}
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{
                  background: '#E9ECEF',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#475569',
                  cursor: 'pointer',
                  transition: 'background 0.15s ease'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#DEE2E6')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#E9ECEF')}
                aria-label="Close dialog"
              >
                <X size={18} />
              </button>
            </div>

            {/* Description Subheader */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h3
                style={{
                  fontSize: '1rem',
                  fontWeight: 800,
                  color: '#1E293B',
                  margin: '0 0 0.35rem 0'
                }}
              >
                Our website uses cookies
              </h3>
              <p
                style={{
                  fontSize: '0.9rem',
                  color: '#475569',
                  lineHeight: 1.55,
                  margin: 0
                }}
              >
                We use essential and non-essential cookies that improve the functionality and experience of the website.
              </p>
            </div>

            {/* Cookie Categories Accordion List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
              
              {/* Category 1: Strictly Necessary cookies (Always Active) */}
              <div style={{ border: '1px solid #E2E8F0', borderRadius: '20px', overflow: 'hidden' }}>
                <div
                  style={{
                    background: '#F1F5F9',
                    padding: '0.85rem 1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer'
                  }}
                  onClick={() => toggleAccordion('necessary')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <div
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: '#CBD5E1',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#475569'
                      }}
                    >
                      {expandedSection === 'necessary' ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                    </div>
                    <span style={{ fontWeight: 700, fontSize: '0.94rem', color: '#1E293B' }}>
                      Strictly Necessary cookies
                    </span>
                  </div>

                  {/* Toggle switch: Locked Active with Checkmark */}
                  <div
                    style={{
                      width: '46px',
                      height: '26px',
                      borderRadius: '9999px',
                      background: '#CBD5E1',
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      padding: '2px',
                      cursor: 'not-allowed'
                    }}
                    title="Required for website function. Cannot be switched off."
                  >
                    <div
                      style={{
                        width: '22px',
                        height: '22px',
                        borderRadius: '50%',
                        background: '#FFFFFF',
                        marginLeft: 'auto',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                      }}
                    >
                      <Check size={13} color="#64748B" strokeWidth={3} />
                    </div>
                  </div>
                </div>

                {expandedSection === 'necessary' && (
                  <div style={{ padding: '0.85rem 1rem', background: '#FFFFFF', fontSize: '0.85rem', color: '#64748B', lineHeight: 1.5, borderTop: '1px solid #E2E8F0' }}>
                    These cookies are necessary for the website to function securely and cannot be switched off. They handle user authentication, air waybill telemetry tracking, and dispatch session tokens.
                  </div>
                )}
              </div>

              {/* Category 2: Performance and Analytics (Interactive Toggle) */}
              <div style={{ border: '1px solid #E2E8F0', borderRadius: '20px', overflow: 'hidden' }}>
                <div
                  style={{
                    background: '#F1F5F9',
                    padding: '0.85rem 1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer'
                  }}
                  onClick={() => toggleAccordion('analytics')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <div
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: '#CBD5E1',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#475569'
                      }}
                    >
                      {expandedSection === 'analytics' ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                    </div>
                    <span style={{ fontWeight: 700, fontSize: '0.94rem', color: '#1E293B' }}>
                      Performance and Analytics
                    </span>
                  </div>

                  {/* Toggle switch */}
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      setAnalyticsEnabled(prev => !prev);
                    }}
                    style={{
                      width: '46px',
                      height: '26px',
                      borderRadius: '9999px',
                      background: analyticsEnabled ? '#252D3D' : '#64748B',
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      padding: '2px',
                      cursor: 'pointer',
                      transition: 'background 0.2s ease'
                    }}
                  >
                    <div
                      style={{
                        width: '22px',
                        height: '22px',
                        borderRadius: '50%',
                        background: '#FFFFFF',
                        transform: analyticsEnabled ? 'translateX(20px)' : 'translateX(0px)',
                        transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                      }}
                    >
                      {analyticsEnabled ? (
                        <Check size={13} color="#252D3D" strokeWidth={3} />
                      ) : (
                        <X size={13} color="#64748B" strokeWidth={2.5} />
                      )}
                    </div>
                  </div>
                </div>

                {expandedSection === 'analytics' && (
                  <div style={{ padding: '0.85rem 1rem', background: '#FFFFFF', fontSize: '0.85rem', color: '#64748B', lineHeight: 1.5, borderTop: '1px solid #E2E8F0' }}>
                    These cookies allow us to monitor traffic, load speed turnaround across cargo terminals, and improve corridor navigation accuracy. All aggregated data is anonymous.
                  </div>
                )}
              </div>

              {/* Category 3: Advertising (Interactive Toggle) */}
              <div style={{ border: '1px solid #E2E8F0', borderRadius: '20px', overflow: 'hidden' }}>
                <div
                  style={{
                    background: '#F1F5F9',
                    padding: '0.85rem 1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer'
                  }}
                  onClick={() => toggleAccordion('advertising')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <div
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: '#CBD5E1',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#475569'
                      }}
                    >
                      {expandedSection === 'advertising' ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                    </div>
                    <span style={{ fontWeight: 700, fontSize: '0.94rem', color: '#1E293B' }}>
                      Advertising
                    </span>
                  </div>

                  {/* Toggle switch */}
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      setAdvertisingEnabled(prev => !prev);
                    }}
                    style={{
                      width: '46px',
                      height: '26px',
                      borderRadius: '9999px',
                      background: advertisingEnabled ? '#252D3D' : '#64748B',
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      padding: '2px',
                      cursor: 'pointer',
                      transition: 'background 0.2s ease'
                    }}
                  >
                    <div
                      style={{
                        width: '22px',
                        height: '22px',
                        borderRadius: '50%',
                        background: '#FFFFFF',
                        transform: advertisingEnabled ? 'translateX(20px)' : 'translateX(0px)',
                        transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                      }}
                    >
                      {advertisingEnabled ? (
                        <Check size={13} color="#252D3D" strokeWidth={3} />
                      ) : (
                        <X size={13} color="#64748B" strokeWidth={2.5} />
                      )}
                    </div>
                  </div>
                </div>

                {expandedSection === 'advertising' && (
                  <div style={{ padding: '0.85rem 1rem', background: '#FFFFFF', fontSize: '0.85rem', color: '#64748B', lineHeight: 1.5, borderTop: '1px solid #E2E8F0' }}>
                    These cookies may be set through our platform by commercial freight partners to build a profile of your logistics volume needs and show relevant cargo rates.
                  </div>
                )}
              </div>
            </div>

            {/* More Information Box (Bordered card) */}
            <div
              style={{
                border: '1px solid #E2E8F0',
                borderRadius: '20px',
                padding: '1.15rem 1.25rem',
                marginBottom: '1.5rem',
                background: '#FFFFFF'
              }}
            >
              <h4
                style={{
                  fontSize: '0.95rem',
                  fontWeight: 800,
                  color: '#1E293B',
                  margin: '0 0 0.35rem 0'
                }}
              >
                More information
              </h4>
              <p
                style={{
                  fontSize: '0.88rem',
                  color: '#475569',
                  lineHeight: 1.5,
                  margin: 0
                }}
              >
                For more information in relation to our policy on cookies please review our{' '}
                <strong style={{ color: '#0F172A', textDecoration: 'underline', cursor: 'pointer' }}>
                  cookie list
                </strong>{' '}
                and{' '}
                <strong style={{ color: '#0F172A', textDecoration: 'underline', cursor: 'pointer' }}>
                  privacy policy
                </strong>
                .
              </p>
            </div>

            {/* Modal Bottom Action Bar (Accept all | Reject all | Accept current selection) */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.75rem',
                borderTop: '1px solid #E2E8F0',
                paddingTop: '1.25rem'
              }}
            >
              {/* Left Buttons: Accept all + Reject all (Exact match of User Image 3) */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <button
                  type="button"
                  id="modal-accept-all-btn"
                  onClick={handleAcceptAll}
                  style={{
                    background: '#252D3D',
                    color: '#FFFFFF',
                    fontSize: '0.88rem',
                    fontWeight: 700,
                    padding: '0.65rem 1.4rem',
                    borderRadius: '9999px',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'background 0.15s ease'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#1A202C')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = '#252D3D')}
                >
                  Accept all
                </button>

                <button
                  type="button"
                  id="modal-reject-all-btn"
                  onClick={handleRejectAll}
                  style={{
                    background: '#EEF2F6',
                    border: 'none',
                    color: '#1E293B',
                    fontSize: '0.88rem',
                    fontWeight: 700,
                    padding: '0.65rem 1.4rem',
                    borderRadius: '9999px',
                    cursor: 'pointer',
                    transition: 'background 0.15s ease'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#E2E8F0')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = '#EEF2F6')}
                >
                  Reject all
                </button>
              </div>

              {/* Right Button: Accept current selection */}
              <div>
                <button
                  type="button"
                  id="modal-accept-selection-btn"
                  onClick={handleAcceptSelection}
                  style={{
                    background: '#EEF2F6',
                    border: 'none',
                    color: '#1E293B',
                    fontSize: '0.88rem',
                    fontWeight: 700,
                    padding: '0.65rem 1.4rem',
                    borderRadius: '9999px',
                    cursor: 'pointer',
                    transition: 'background 0.15s ease'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#E2E8F0')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = '#EEF2F6')}
                >
                  Accept current selection
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
