import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import AeroLogo from '../components/AeroLogo';
import AdminPasscodeBoy from '../components/AdminPasscodeBoy';
import {
  Search,
  Truck,
  ShieldCheck,
  Zap,
  MapPin,
  Clock,
  Layers,
  ArrowRight,
  Package,
  Phone,
  CheckCircle2,
  Lock,
  Globe2,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Smartphone,
  Plane,
  Building2,
  Check,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  HelpCircle,
  TrendingUp,
  Radio,
  FileText,
  Cloud,
  Eye,
  EyeOff,
  Headphones,
  MessageSquare,
  Mail,
  X
} from 'lucide-react';

export default function LandingPage() {
  const {
    setActiveTab,
    setSelectedAwb,
    setTrackingQuery,
    currentUser,
    shipments,
    hubs,
    metrics,
    addToast,
    loginUser,
    loginWithAdminCode,
    openChatbox
  } = useApp();

  // Priority Operations Console Admin Login Modal State (Requires Code: 8469, No Email)
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [adminCode, setAdminCode] = useState('');
  const [showAdminCode, setShowAdminCode] = useState(false);
  const [adminLoginLoading, setAdminLoginLoading] = useState(false);
  const [adminLoginError, setAdminLoginError] = useState('');
  const [isAdminCodeFocused, setIsAdminCodeFocused] = useState(false);

  // Floating Hero Card State (tracking & shipping selector)
  const [activeTabMode, setActiveTabMode] = useState('track'); // 'track' | 'ship'
  const [trackMethod, setTrackMethod] = useState('mobile'); // 'mobile' | 'awb' | 'order'
  const [trackInput, setTrackInput] = useState('');

  // Ship order quick rate calculator state
  const [calcOrigin, setCalcOrigin] = useState('110037');
  const [calcDest, setCalcDest] = useState('560038');
  const [calcWeight, setCalcWeight] = useState('2.5');

  // Active FAQ Accordion item
  const [openFaq, setOpenFaq] = useState(0);

  // Active Hub Radar Selection
  const [selectedHubIndex, setSelectedHubIndex] = useState(0);

  // 3D Smooth Scroll Reveal on Scroll
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });

    const elements = document.querySelectorAll('.reveal-3d');
    elements.forEach(el => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  // Submit handler for Tracking Search
  const handleTrackSubmit = (e) => {
    e.preventDefault();
    const query = trackInput.trim();

    if (trackMethod === 'mobile') {
      // User clicked "Get OTP ➔" on mobile number tab: Open Register & Login Page
      if (query) {
        localStorage.setItem('aerodispatch_prefill_phone', query);
      }
      addToast('Opening sign in & registration portal...', 'info');
      setActiveTab('auth');
      return;
    }

    if (!query) {
      addToast('Please enter your tracking number.', 'warning');
      return;
    }

    setTrackingQuery(query);
    setSelectedAwb(query);
    setActiveTab('track');
  };

  // Quick ship rate calculator submission
  const handleQuickShipSubmit = (e) => {
    e.preventDefault();
    if (!currentUser) {
      addToast('Sign in or registration required to book consignments.', 'warning');
      setActiveTab('auth');
      return;
    }
    if (currentUser.role === 'driver') {
      addToast('Access Denied: Courier drivers cannot book shipments. Please sign in as a merchant.', 'error');
      return;
    }
    setActiveTab('create-order');
    addToast('Transferring rate parameters to consignment booking wizard...', 'info');
  };

  const handleLaunchMerchant = () => {
    if (!currentUser) {
      addToast('Sign in or register required to access the Merchant Desk.', 'warning');
      setActiveTab('auth');
      return;
    }
    if (currentUser.role === 'driver') {
      addToast('Customer account required to book express shipments.', 'error');
      return;
    }
    setActiveTab('shipments');
  };

  const handleBookingCta = () => {
    if (!currentUser) {
      addToast('Sign in or register to book an express consignment.', 'info');
      setActiveTab('auth');
      return;
    }
    if (currentUser.role === 'driver') {
      addToast('Courier drivers cannot book consignments. Sign in as a customer.', 'warning');
      return;
    }
    setActiveTab('create-order');
  };

  const handleAdminModalLogin = async (e) => {
    e.preventDefault();
    const code = adminCode.trim();
    if (!code) {
      setAdminLoginError('Please enter your 4-digit PIN.');
      return;
    }
    if (code !== '8469') {
      setAdminLoginError('Incorrect PIN. Please try again.');
      return;
    }
    setAdminLoginLoading(true);
    setAdminLoginError('');
    try {
      await loginWithAdminCode(code);
      setIsAdminModalOpen(false);
      setAdminCode('');
      addToast('Logged in as Administrator.', 'success');
    } catch (err) {
      setAdminLoginError(err.message || 'Incorrect PIN.');
    } finally {
      setAdminLoginLoading(false);
    }
  };

  return (
    <div className="landing-3d-scene" style={{ display: 'flex', flexDirection: 'column', gap: '4.5rem', paddingBottom: '5rem' }}>

      {/* =========================================================================
          1. HERO SECTION: CLEAN ENTERPRISE DISPATCH COMMAND (NO CRINGE STOCK PHOTOS)
          ========================================================================= */}
      <section
        id="public-tracking-hero"
        className="reveal-3d"
        style={{
          position: 'relative',
          width: '100%',
          minHeight: '580px',
          borderRadius: 'var(--radius-xl)',
          overflow: 'hidden',
          marginTop: '0.75rem',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(225, 29, 72, 0.2)',
          border: '1px solid rgba(225, 29, 72, 0.25)',
          background: 'linear-gradient(135deg, #07090F 0%, #0C111E 50%, #06080E 100%)',
          display: 'flex',
          alignItems: 'center'
        }}
      >
        {/* Subtle Ambient Radial Gradients (Pure Clean High-Tech Aesthetic) */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `
              radial-gradient(circle at 18% 25%, rgba(225, 29, 72, 0.16) 0%, transparent 45%),
              radial-gradient(circle at 82% 75%, rgba(14, 165, 233, 0.09) 0%, transparent 45%),
              radial-gradient(circle at 50% 100%, rgba(15, 23, 42, 0.6) 0%, transparent 70%)
            `,
            pointerEvents: 'none',
            zIndex: 1
          }}
        />

        {/* Hero Content Container */}
        <div
          style={{
            position: 'relative',
            zIndex: 2,
            width: '100%',
            maxWidth: '1240px',
            margin: '0 auto',
            padding: '3.5rem 2rem',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
            gap: '3rem',
            alignItems: 'center'
          }}
        >
          {/* Left Hero Text Copy */}
          <div style={{ color: '#FFFFFF' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '5px 14px', background: 'rgba(225, 29, 72, 0.12)', border: '1px solid rgba(225, 29, 72, 0.35)', borderRadius: '9999px', color: '#FB7185', fontSize: '0.76rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1.25rem' }}>
              <Zap size={14} color="#FB7185" />
              <span>Precision Logistics • Seamless Dispatch</span>
            </div>

            <h1
className="landing-hero-headline"
              style={{
                fontSize: 'clamp(2.3rem, 4.4vw, 3.6rem)',
                fontWeight: 900,
                lineHeight: 1.15,
                letterSpacing: '-0.03em',
                marginBottom: '1.25rem',
                fontStyle: 'normal',
                color: '#FFFFFF'
              }}
            >
              Miles mean nothing when the{' '}
              <span style={{ color: '#EF4444', fontStyle: 'italic', fontWeight: 900 }}>
                destination
              </span>
              <span style={{ marginLeft: '0.45rem', display: 'inline-block' }}>has purpose</span>
            </h1>

            {/* Service Category Bullets */}
            <div
              className="landing-hero-bullets"
              style={{
                fontSize: 'clamp(0.95rem, 1.8vw, 1.15rem)',
                fontWeight: 600,
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '0.65rem',
                marginBottom: '2rem'
              }}
            >
              <span style={{ color: '#FFFFFF' }}>Express Parcel</span>
              <span style={{ color: '#EF4444', fontSize: '0.8rem' }}>■</span>
              <span style={{ color: '#FFFFFF' }}>Part Truckload (PTL)</span>
              <span style={{ color: '#EF4444', fontSize: '0.8rem' }}>■</span>
              <span style={{ color: '#FFFFFF' }}>Full Truckload (FTL)</span>
              <span style={{ color: '#EF4444', fontSize: '0.8rem' }}>■</span>
              <span style={{ color: '#FFFFFF' }}>International Shipping</span>
              <span style={{ color: '#EF4444', fontSize: '0.8rem' }}>■</span>
              <span style={{ color: '#FFFFFF' }}>Supply Chain</span>
            </div>

            {/* Sign In & Exploration Call-to-Actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
              <button
                type="button"
                className="btn btn-primary btn-3d"
                onClick={() => setActiveTab('auth')}
                style={{
                  fontWeight: 800,
                  fontSize: '1rem',
                  padding: '0.85rem 1.75rem',
                  boxShadow: '0 8px 25px rgba(239, 68, 68, 0.45)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.65rem'
                }}
              >
                <Lock size={18} />
                <span>Click & Get more info..</span>
                <ArrowRight size={16} />
              </button>

              <button
                type="button"
                className="btn btn-secondary btn-3d"
                onClick={() => {
                  const el = document.getElementById('radar-corridors-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                style={{
                  padding: '0.85rem 1.25rem',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  borderColor: 'rgba(255, 255, 255, 0.2)'
                }}
              >
                <span>Explore Services ↓</span>
              </button>
            </div>
          </div>

          {/* Right Hero Tracking & Shipping Card (Stable, Grounded, Non-floating) */}
          <div
            className="hero-tracking-card"
            style={{
              background: '#FFFFFF',
              color: '#0F172A',
              borderRadius: 'var(--radius-lg)',
              padding: '1.85rem 2rem',
              maxWidth: '460px',
              marginLeft: 'auto',
              width: '100%',
              border: '1px solid rgba(226, 232, 240, 0.95)',
              boxShadow: '0 20px 50px -10px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(255, 255, 255, 0.1)',
              position: 'relative'
            }}
          >
            {/* Top Tabs: Track order | Ship order */}
            <div
              style={{
                display: 'flex',
                gap: '2rem',
                borderBottom: '1px solid #E2E8F0',
                paddingBottom: '0.75rem',
                marginBottom: '1.25rem'
              }}
            >
              <button
                type="button"
                onClick={() => setActiveTabMode('track')}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1rem',
                  fontWeight: 700,
                  color: activeTabMode === 'track' ? '#0F172A' : '#94A3B8',
                  position: 'relative',
                  cursor: 'pointer',
                  paddingBottom: '0.5rem'
                }}
              >
                Track order
                {activeTabMode === 'track' && (
                  <span
                    style={{
                      position: 'absolute',
                      bottom: '-0.75rem',
                      left: 0,
                      right: 0,
                      height: '3px',
                      background: '#EF4444',
                      borderRadius: '2px'
                    }}
                  />
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTabMode('ship')}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1rem',
                  fontWeight: 700,
                  color: activeTabMode === 'ship' ? '#0F172A' : '#94A3B8',
                  position: 'relative',
                  cursor: 'pointer',
                  paddingBottom: '0.5rem'
                }}
              >
                Ship order
                {activeTabMode === 'ship' && (
                  <span
                    style={{
                      position: 'absolute',
                      bottom: '-0.75rem',
                      left: 0,
                      right: 0,
                      height: '3px',
                      background: '#EF4444',
                      borderRadius: '2px'
                    }}
                  />
                )}
              </button>
            </div>

            {/* TAB 1: TRACK ORDER CONTENT */}
            {activeTabMode === 'track' ? (
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', marginBottom: '1rem' }}>
                  Track your shipment
                </h3>

                {/* Tracking Method Selector Pills (Mobile, Tracking ID, Order ID) */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    border: '1.5px solid #CBD5E1',
                    borderRadius: '9999px',
                    overflow: 'hidden',
                    marginBottom: '1.25rem',
                    textAlign: 'center',
                    background: '#F1F5F9',
                    padding: '3px'
                  }}
                >
                  {[
                    { id: 'mobile', label: 'Mobile Number' },
                    { id: 'awb', label: 'Tracking ID' },
                    { id: 'order', label: 'Order ID' },
                  ].map(m => {
                    const isActive = trackMethod === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        className={isActive ? "track-tab-btn-active" : "track-tab-btn-inactive"}
                        onClick={() => {
                          setTrackMethod(m.id);
                        }}
                        style={{
                          background: isActive ? '#0F172A' : '#FFFFFF',
                          backgroundColor: isActive ? '#0F172A' : '#FFFFFF',
                          color: isActive ? '#FFFFFF' : '#475569',
                          border: 'none',
                          borderRadius: '9999px',
                          padding: '0.6rem 0',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {m.label}
                      </button>
                    );
                  })}
                </div>

                {/* Form Input & Action */}
                <form onSubmit={handleTrackSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <input
                      type={trackMethod === 'mobile' ? 'tel' : 'text'}
                      value={trackInput}
                      onChange={(e) => setTrackInput(e.target.value)}
                      placeholder={
                        trackMethod === 'mobile' ? 'Enter 10-digit mobile number' :
                          trackMethod === 'awb' ? 'Enter tracking number (e.g. AD-8849-2041)' :
                            'Enter your order ID (e.g. ORD-88210)'
                      }
                      style={{
                        width: '100%',
                        padding: '0.85rem 1.4rem',
                        borderRadius: '9999px',
                        border: '1.5px solid #CBD5E1',
                        fontSize: '0.95rem',
                        background: '#FFFFFF',
                        backgroundColor: '#FFFFFF',
                        color: '#0F172A',
                        fontWeight: 600,
                        outline: 'none',
                        boxShadow: '0 1px 6px rgba(32, 33, 36, 0.12)',
                        fontFamily: trackMethod !== 'mobile' ? 'var(--font-mono)' : 'inherit'
                      }}
                      required={trackMethod !== 'mobile'}
                    />
                  </div>

                  <button
                    type="submit"
                    id="hero-track-submit-btn" className="track-submit-btn"
                    style={{
                      width: '100%',
                      padding: '0.85rem',
                      background: '#0F172A',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '9999px',
                      fontSize: '0.95rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      boxShadow: '0 4px 14px rgba(15, 23, 42, 0.25)',
                      transition: 'all 0.2s cubic-bezier(0.2, 0, 0, 1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <span>{trackMethod === 'mobile' ? 'Get OTP ➔' : 'Track Shipment ➔'}</span>
                  </button>
                </form>
              </div>
            ) : (
              /* TAB 2: SHIP ORDER / QUICK RATE CALCULATOR */
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.5rem' }}>
                  Instant Shipping Rate Calculator
                </h3>
                <p style={{ fontSize: '0.8rem', color: '#64748B', marginBottom: '1.25rem' }}>
                  Calculate estimated delivery charges across India based on weight and PIN code.
                </p>

                <form onSubmit={handleQuickShipSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.25rem' }}>
                        Pickup PIN Code
                      </label>
                      <input
                        type="text"
                        value={calcOrigin}
                        onChange={(e) => setCalcOrigin(e.target.value)}
                        placeholder="e.g. 110037"
                        style={{ width: '100%', padding: '0.75rem 1.25rem', borderRadius: '9999px', border: '1.5px solid #CBD5E1', background: '#FFFFFF', backgroundColor: '#FFFFFF', color: '#0F172A', fontWeight: 600, boxShadow: '0 1px 4px rgba(32, 33, 36, 0.08)' }}
                        required
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.25rem' }}>
                        Delivery PIN Code
                      </label>
                      <input
                        type="text"
                        value={calcDest}
                        onChange={(e) => setCalcDest(e.target.value)}
                        placeholder="e.g. 560038"
                        style={{ width: '100%', padding: '0.75rem 1.25rem', borderRadius: '9999px', border: '1.5px solid #CBD5E1', background: '#FFFFFF', backgroundColor: '#FFFFFF', color: '#0F172A', fontWeight: 600, boxShadow: '0 1px 4px rgba(32, 33, 36, 0.08)' }}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.25rem' }}>
                      Package Weight (kg)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={calcWeight}
                      onChange={(e) => setCalcWeight(e.target.value)}
                      style={{ width: '100%', padding: '0.75rem 1.25rem', borderRadius: '9999px', border: '1.5px solid #CBD5E1', background: '#FFFFFF', backgroundColor: '#FFFFFF', color: '#0F172A', fontWeight: 600, boxShadow: '0 1px 4px rgba(32, 33, 36, 0.08)' }}
                      required
                    />
                  </div>

                  <div style={{ padding: '0.85rem 1.25rem', background: '#F8FAFC', borderRadius: '20px', border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8rem', color: '#64748B' }}>Estimated Express Shipping:</span>
                    <strong style={{ fontSize: '1.15rem', color: '#EF4444' }}>
                      ₹{Math.round(parseFloat(calcWeight || 1) * 190)}
                    </strong>
                  </div>

                  <button
                    type="submit"
                    style={{
                      width: '100%',
                      padding: '0.85rem',
                      background: '#EF4444',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '9999px',
                      fontSize: '0.95rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      boxShadow: '0 4px 14px rgba(239, 68, 68, 0.4)',
                      transition: 'all 0.2s cubic-bezier(0.2, 0, 0, 1)'
                    }}
                  >
                    Book Shipment ➔
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* =========================================================================
          2. NEW EXPANDED SECTION: REAL-TIME AIR CORRIDOR RADAR & ACTIVE FLIGHTS
          ========================================================================= */}
      <section id="radar-corridors-section" className="reveal-3d" style={{ maxWidth: '1240px', margin: '0 auto', width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#EF4444', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.4rem' }}>
              <Plane size={15} />
              <span>National Dedicated Air Freight Grid</span>
            </div>
            <h2 style={{ fontSize: '2.1rem', fontWeight: 900, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
              Active Air Cargo Routes &amp; Scheduled Flights
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', maxWidth: '640px', marginTop: '0.2rem' }}>
              Sub-second tracking of chartered cargo Boeing 737 and Airbus A321 freighters connecting tier-1 mega-gateways.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.78rem', color: '#10B981', display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'rgba(16, 185, 129, 0.12)', padding: '5px 12px', borderRadius: 'var(--radius-sm)', fontWeight: 700 }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10B981' }} />
              All Flights On-Schedule
            </span>
          </div>
        </div>

        {/* 3 Active Freight Corridors */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {[
            {
              flightNo: 'AD-604',
              aircraft: 'Boeing 737-800 BCF',
              route: 'DEL ➔ BLR',
              originCity: 'New Delhi IGI Terminal 3',
              destCity: 'Bengaluru Kempegowda Cargo',
              departure: '04:15 AM',
              arrival: '07:05 AM',
              altitude: '34,000 ft',
              airspeed: '820 km/h',
              pallets: '142 Containers',
              weight: '18.4 Tons',
              status: 'IN_FLIGHT',
              statusLabel: 'Cruising (Nagpur Airspace)'
            },
            {
              flightNo: 'AD-712',
              aircraft: 'Airbus A321-200 P2F',
              route: 'BOM ➔ HYD',
              originCity: 'Mumbai Seaboard Terminal',
              destCity: 'Hyderabad Rajiv Gandhi Cargo',
              departure: '05:30 AM',
              arrival: '06:55 AM',
              altitude: '28,000 ft',
              airspeed: '790 km/h',
              pallets: '98 Containers',
              weight: '12.8 Tons',
              status: 'DESCENDING',
              statusLabel: 'Approach Sector Active'
            },
            {
              flightNo: 'AD-809',
              aircraft: 'ATR 72-600 Freighter',
              route: 'BLR ➔ CCU',
              originCity: 'Bengaluru Cargo Hub',
              destCity: 'Kolkata Netaji Subhash Terminal',
              departure: '06:00 AM',
              arrival: '08:45 AM',
              altitude: '22,000 ft',
              airspeed: '510 km/h',
              pallets: '64 Containers',
              weight: '8.2 Tons',
              status: 'SCHEDULED',
              statusLabel: 'Cargo Hold Manifest Locked'
            }
          ].map(f => (
            <div
              key={f.flightNo}
              className="card card-3d"
              style={{
                padding: '1.75rem',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                background: 'var(--bg-card)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.15)', color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Plane size={18} />
                    </div>
                    <div>
                      <strong style={{ fontSize: '1.1rem', color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>{f.flightNo}</strong>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{f.aircraft}</div>
                    </div>
                  </div>

                  <span style={{ fontSize: '0.72rem', padding: '3px 8px', borderRadius: '9999px', background: 'rgba(16, 185, 129, 0.15)', color: '#10B981', fontWeight: 800 }}>
                    {f.statusLabel}
                  </span>
                </div>

                <div style={{ padding: '0.9rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#EF4444' }}>{f.route.split('➔')[0]}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Dep: {f.departure}</div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, padding: '0 1rem' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginBottom: '2px' }}>{f.weight}</div>
                      <div style={{ width: '100%', height: '2px', background: 'rgba(239, 68, 68, 0.4)', position: 'relative' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#EF4444', position: 'absolute', top: '-3px', left: '50%', transform: 'translateX(-50%)' }} />
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#EF4444' }}>{f.route.split('➔')[1]}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>ETA: {f.arrival}</div>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  <div>Altitude: <strong style={{ color: 'var(--text-main)' }}>{f.altitude}</strong></div>
                  <div>Airspeed: <strong style={{ color: 'var(--text-main)' }}>{f.airspeed}</strong></div>
                  <div>Payload: <strong style={{ color: 'var(--text-main)' }}>{f.pallets}</strong></div>
                  <div>Gate: <strong style={{ color: '#10B981' }}>Terminal 3 Bay 42</strong></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* =========================================================================
          3. DEDICATED SEPARATED ADMIN & OPERATIONS SECTION (STRICT RED & BLACK)
          ========================================================================= */}
      <section
        id="public-services-section"
        className="card card-3d reveal-3d"
        style={{
          borderRadius: 'var(--radius-xl)',
          padding: '3rem 2.25rem',
          border: '1px solid rgba(239, 68, 68, 0.4)',
          boxShadow: 'var(--shadow-lg), 0 0 30px rgba(239, 68, 68, 0.15)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '400px',
            height: '400px',
            background: 'radial-gradient(circle, rgba(239, 68, 68, 0.15) 0%, transparent 70%)',
            pointerEvents: 'none'
          }}
        />

        {/* Section Heading */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '2.5rem' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '3px 10px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: '9999px', color: '#EF4444', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.65rem' }}>
              <ShieldCheck size={14} />
              <span>AeroDispatch Express Logistics</span>
            </div>
            <h2 style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
              Enterprise Logistics &amp; Express Shipping Solutions
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', maxWidth: '640px', marginTop: '0.35rem' }}>
              Nationwide air routes, guaranteed ground linehauls, and transparent merchant consignments.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.78rem', color: '#10B981', display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'rgba(16, 185, 129, 0.1)', padding: '5px 12px', borderRadius: 'var(--radius-sm)', fontWeight: 700 }}>
              <Check size={13} />
              99.8% On-Time SLA Network
            </span>
          </div>
        </div>

        {/* 3 Dedicated Solutions */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))', gap: '1.75rem' }}>

          {/* Card 1: Instant Consignment Booking */}
          <div
            className="card card-3d"
            style={{
              padding: '2rem',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              background: 'var(--bg-card)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <div>
              <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-md)', background: 'rgba(239, 68, 68, 0.15)', color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
                <Package size={26} />
              </div>

              <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#EF4444', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Express Dispatch
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.25rem', marginBottom: '0.5rem' }}>
                Instant Consignment Booking
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '1.25rem' }}>
                Schedule doorstep commercial pickup across 19,000+ Indian postal codes with instant barcode label printing.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Check size={14} color="#EF4444" />
                  <span>Volumetric dimension &amp; dynamic weight calculation</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Check size={14} color="#EF4444" />
                  <span>IATA &amp; Delhivery-compliant thermal barcode labels</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Check size={14} color="#EF4444" />
                  <span>Same-day door-to-hub pickup guarantee</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              className="btn btn-primary btn-3d"
              style={{
                width: '100%',
                fontWeight: 800,
                padding: '0.85rem'
              }}
              onClick={handleBookingCta}
            >
              <span>Instant Book Parcel ➔</span>
            </button>
          </div>

          {/* Card 2: Consignment Live Tracking */}
          <div
            className="card card-3d"
            style={{
              padding: '2rem',
              border: '1px solid rgba(0, 240, 255, 0.25)',
              background: 'var(--bg-card)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <div>
              <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-md)', background: 'rgba(0, 240, 255, 0.12)', color: '#00F0FF', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
                <Search size={26} />
              </div>

              <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#00F0FF', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Full Transparency
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.25rem', marginBottom: '0.5rem' }}>
                Consignment Tracking
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '1.25rem' }}>
                Detailed delivery milestones, sorting hub checkpoints, and secure OTP doorstep handovers.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Check size={14} color="#10B981" />
                  <span>Flight and highway linehaul tracking</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Check size={14} color="#10B981" />
                  <span>Automated recipient SMS and dispatch alerts</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Check size={14} color="#10B981" />
                  <span>Secure 4-digit recipient OTP delivery verification</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              className="btn btn-secondary btn-3d"
              style={{ width: '100%', borderColor: '#00F0FF', color: '#00F0FF', fontWeight: 700, padding: '0.85rem' }}
              onClick={() => {
                const el = document.getElementById('public-tracking-hero');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
                else setActiveTab('track');
              }}
            >
              <span>Track Consignment ➔</span>
            </button>
          </div>

          {/* Card 3: Enterprise Merchant Suite */}
          <div
            className="card card-3d"
            style={{
              padding: '2rem',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              background: 'var(--bg-card)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <div>
              <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-md)', background: 'rgba(239, 68, 68, 0.15)', color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
                <Building2 size={26} />
              </div>

              <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#EF4444', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Merchant Account
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.25rem', marginBottom: '0.5rem' }}>
                Private Shipper Portal
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '1.25rem' }}>
                Manage your business consignments, track outbound orders, and download consolidated monthly GST invoices.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Check size={14} color="#EF4444" />
                  <span>Exclusively view your own bookings &amp; invoices</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Check size={14} color="#EF4444" />
                  <span>Bulk CSV order dispatch &amp; tracking export</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Check size={14} color="#EF4444" />
                  <span>Enterprise volume rates with dedicated support</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              className="btn btn-outline-red btn-3d"
              style={{ width: '100%', fontWeight: 700, padding: '0.85rem' }}
              onClick={handleLaunchMerchant}
            >
              <span>{currentUser ? 'Go to My Shipments ➔' : 'Sign In to My Account ➔'}</span>
            </button>
          </div>
        </div>
      </section>

      {/* =========================================================================
          4. NEW EXPANDED SECTION: 14 NATIONAL MEGA-HUB AUTOMATED SORTING GATEWAYS
          ========================================================================= */}
      <section className="reveal-3d" style={{ maxWidth: '1240px', margin: '0 auto', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#EF4444', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>
            <Layers size={15} />
            <span>National Hub Infrastructure</span>
          </div>
          <h2 style={{ fontSize: '2.1rem', fontWeight: 900, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
            14 Automated Mega-Hub Sorting Gateways
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', maxWidth: '640px', margin: '0.4rem auto 0' }}>
            High-speed cross-belt optical sorters capable of routing 40,000 packages per hour with automated dimensioning.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
          {[
            {
              id: 'HUB-DEL-01',
              name: 'Delhi IGI Terminal 3 Cargo Mega-Hub',
              city: 'New Delhi',
              capacity: 84,
              speed: '38,500/hr',
              activeParcels: '1,420 bags',
              linehauls: '34 Trucks',
              status: 'Optimal'
            },
            {
              id: 'HUB-BLR-02',
              name: 'Bengaluru Kempegowda Central Gateway',
              city: 'Bengaluru',
              capacity: 91,
              speed: '41,200/hr',
              activeParcels: '980 bags',
              linehauls: '28 Trucks',
              status: 'Peak Load'
            },
            {
              id: 'HUB-BOM-03',
              name: 'Mumbai Western Seaboard Sorting Node',
              city: 'Mumbai',
              capacity: 76,
              speed: '35,000/hr',
              activeParcels: '1,150 bags',
              linehauls: '31 Trucks',
              status: 'Optimal'
            },
            {
              id: 'HUB-HYD-04',
              name: 'Hyderabad Rajiv Gandhi Distribution Terminal',
              city: 'Hyderabad',
              capacity: 68,
              speed: '28,400/hr',
              activeParcels: '660 bags',
              linehauls: '19 Trucks',
              status: 'Optimal'
            }
          ].map((h, idx) => (
            <div
              key={h.id}
              className="card card-3d"
              style={{
                padding: '1.5rem',
                border: selectedHubIndex === idx ? '1px solid #EF4444' : '1px solid var(--border-subtle)',
                background: 'var(--bg-card)',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onClick={() => setSelectedHubIndex(idx)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                <span className="mono" style={{ fontSize: '0.72rem', color: '#EF4444', fontWeight: 800 }}>{h.id}</span>
                <span style={{ fontSize: '0.68rem', padding: '2px 7px', borderRadius: '4px', background: h.capacity > 85 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)', color: h.capacity > 85 ? '#EF4444' : '#10B981', fontWeight: 700 }}>
                  {h.status}
                </span>
              </div>

              <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.4rem' }}>{h.name}</h4>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Location: {h.city}</div>

              {/* Capacity meter */}
              <div style={{ marginBottom: '0.9rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-dim)', marginBottom: '3px' }}>
                  <span>Conveyor Load</span>
                  <strong style={{ color: h.capacity > 85 ? '#EF4444' : 'var(--text-main)' }}>{h.capacity}%</strong>
                </div>
                <div style={{ width: '100%', height: '6px', background: 'var(--border-medium)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: `${h.capacity}%`, height: '100%', background: h.capacity > 85 ? '#EF4444' : '#10B981' }} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.65rem' }}>
                <span>Sorter: <strong>{h.speed}</strong></span>
                <span>Active: <strong>{h.activeParcels}</strong></span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* =========================================================================
          5. END-TO-END CONSIGNMENT LIFECYCLE (5 VISUAL STAGES)
          ========================================================================= */}
      <section className="reveal-3d" style={{ maxWidth: '1240px', margin: '0 auto', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#EF4444', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>
            <span>How It Works</span>
          </div>
          <h2 style={{ fontSize: '2.1rem', fontWeight: 900, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
            From Pickup to Your Doorstep in 5 Simple Steps
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          {[
            { step: '01', title: 'Online Booking', desc: 'Instant shipment creation with automated tracking ID and label' },
            { step: '02', title: 'Doorstep Pickup', desc: 'Package collected from sender with digital weight verification' },
            { step: '03', title: 'Automated Sorting', desc: 'High-speed package routing and security scan at regional hub' },
            { step: '04', title: 'Express Transit', desc: 'Direct air freight and road transit to destination city' },
            { step: '05', title: 'Safe Delivery', desc: 'Final delivery handover verified with OTP and photo confirmation' }
          ].map((s, i) => (
            <div
              key={s.step}
              className="card card-3d"
              style={{
                padding: '1.5rem',
                border: '1px solid var(--border-subtle)',
                background: 'var(--bg-card)',
                position: 'relative'
              }}
            >
              <div style={{ fontSize: '2rem', fontWeight: 900, color: 'rgba(239, 68, 68, 0.3)', marginBottom: '0.5rem' }}>{s.step}</div>
              <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.35rem' }}>{s.title}</h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* =========================================================================
          6. NATIONAL FLEET & OPERATIONAL SCALE
          ========================================================================= */}
      <section
        className="card card-3d reveal-3d"
        style={{
          maxWidth: '1240px',
          margin: '0 auto',
          width: '100%',
          padding: '2.5rem',
          border: '1px solid rgba(239, 68, 68, 0.35)'
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '2rem', textAlign: 'center' }}>
          <div>
            <div style={{ fontSize: '2.6rem', fontWeight: 900, color: '#EF4444', letterSpacing: '-0.03em' }}>
              18,450+
            </div>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '0.2rem' }}>
              Daily Consignments Processed
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>
              Across 19,000+ PIN codes
            </div>
          </div>

          <div>
            <div style={{ fontSize: '2.6rem', fontWeight: 900, color: '#10B981', letterSpacing: '-0.03em' }}>
              98.4%
            </div>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '0.2rem' }}>
              On-Time SLA Guarantee
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>
              Scheduled air linehauls
            </div>
          </div>

          <div>
            <div style={{ fontSize: '2.6rem', fontWeight: 900, color: '#EF4444', letterSpacing: '-0.03em' }}>
              14 Hubs
            </div>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '0.2rem' }}>
              Automated Mega-Terminals
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>
              Delhi, Mumbai, BLR, Kolkata
            </div>
          </div>

          <div>
            <div style={{ fontSize: '2.6rem', fontWeight: 900, color: '#F59E0B', letterSpacing: '-0.03em' }}>
              380+ Fleet
            </div>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '0.2rem' }}>
              Electric Delivery Vehicles (EV)
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>
              Zero-carbon last mile
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          7. DEDICATED 24/7 NATIONAL CUSTOMER CARE & GRIEVANCE HELPDESK
          ========================================================================= */}
      <section id="customer-care" className="reveal-3d" style={{ maxWidth: '1240px', margin: '0 auto', width: '100%' }}>
        <div 
          className="card card-3d"
          style={{
            background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(10, 15, 29, 0.98) 100%)',
            border: '1.5px solid rgba(239, 68, 68, 0.35)',
            borderRadius: 'var(--radius-xl)',
            padding: '2.5rem',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5), 0 0 35px rgba(239, 68, 68, 0.12)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '2rem', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '1.5rem' }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '3px 12px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: '9999px', color: '#EF4444', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.65rem' }}>
                <Headphones size={13} />
                <span>24/7 Dedicated Customer Care &amp; Support Desk</span>
              </div>
              <h2 style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--text-main)', margin: '0 0 0.4rem', letterSpacing: '-0.02em' }}>
                National Logistics Support &amp; Grievance Redressal
              </h2>
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.92rem', maxWidth: '680px' }}>
                Instant real-time assistance for consignment tracking, address modifications, delivery rescheduling, proof-of-delivery retrieval, and merchant escalations.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.78rem', color: '#10B981', display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '6px 14px', borderRadius: '9999px', fontWeight: 800 }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />
                Live Dispatch Support Active
              </span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.25rem' }}>
            {/* Card 1: Instant Live Chat */}
            <div 
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-medium)',
                borderRadius: 'var(--radius-lg)',
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'all 0.2s ease'
              }}
            >
              <div>
                <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.15)', color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                  <MessageSquare size={20} />
                </div>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                  Live Dispatch Chat
                </h4>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '1.25rem' }}>
                  Instant interactive assistance with our telemetry bot &amp; station operators. Avg response: &lt;45s.
                </p>
              </div>

              <button
                type="button"
                className="btn btn-primary"
                onClick={openChatbox}
                style={{ width: '100%', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 800, gap: '0.4rem' }}
              >
                <MessageSquare size={14} />
                <span>Start Live Chat Support ➔</span>
              </button>
            </div>

            {/* Card 2: 24/7 Toll-Free Call Helpline */}
            <div 
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-medium)',
                borderRadius: 'var(--radius-lg)',
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'all 0.2s ease'
              }}
            >
              <div>
                <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                  <Phone size={20} />
                </div>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                  24/7 Toll-Free Helpline
                </h4>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '1.25rem' }}>
                  Toll-free voice assistance across India for delivery coordination and queries.
                </p>
              </div>

              <a
                href="tel:18004192376"
                className="btn btn-secondary"
                style={{ width: '100%', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 800, color: '#10B981', borderColor: 'rgba(16, 185, 129, 0.4)', textDecoration: 'none', gap: '0.4rem' }}
              >
                <Phone size={14} />
                <span>1800-419-AERO (2376)</span>
              </a>
            </div>

            {/* Card 3: WhatsApp Dispatch Desk */}
            <div 
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-medium)',
                borderRadius: 'var(--radius-lg)',
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'all 0.2s ease'
              }}
            >
              <div>
                <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(34, 197, 94, 0.15)', color: '#22C55E', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                  <Smartphone size={20} />
                </div>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                  WhatsApp Care Assistant
                </h4>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '1.25rem' }}>
                  Get automated tracking links, delivery OTP verification, and instant notifications.
                </p>
              </div>

              <a
                href="https://wa.me/919004358469"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary"
                style={{ width: '100%', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 800, color: '#22C55E', borderColor: 'rgba(34, 197, 94, 0.4)', textDecoration: 'none', gap: '0.4rem' }}
              >
                <Smartphone size={14} />
                <span>Chat on WhatsApp ➔</span>
              </a>
            </div>

            {/* Card 4: Corporate Escalations & Claims */}
            <div 
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-medium)',
                borderRadius: 'var(--radius-lg)',
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'all 0.2s ease'
              }}
            >
              <div>
                <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(56, 189, 248, 0.15)', color: '#38BDF8', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                  <Mail size={20} />
                </div>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                  Claims &amp; Escalations
                </h4>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '1.25rem' }}>
                  4-hour SLA resolution for merchant accounts, damaged claims, and proof-of-delivery disputes.
                </p>
              </div>

              <a
                href="mailto:care@aerodispatch.io"
                className="btn btn-secondary"
                style={{ width: '100%', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 800, color: '#38BDF8', borderColor: 'rgba(56, 189, 248, 0.4)', textDecoration: 'none', gap: '0.4rem' }}
              >
                <Mail size={14} />
                <span>care@aerodispatch.io</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          8. FREQUENTLY ASKED ENTERPRISE QUESTIONS (FAQ ACCORDION)
          ========================================================================= */}
      <section className="reveal-3d" style={{ maxWidth: '980px', margin: '0 auto', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#EF4444', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.4rem' }}>
            <HelpCircle size={15} />
            <span>Support &amp; Operational Policies</span>
          </div>
          <h2 style={{ fontSize: '2.1rem', fontWeight: 900, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
            Frequently Asked Questions
          </h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {[
            {
              q: 'How does mobile number tracking work?',
              a: 'Enter your registered 10-digit mobile number to receive a 4-digit code. Once verified, you can view the live status and history of all shipments linked to your number without needing a tracking ID.'
            },
            {
              q: 'Why is login or registration required before booking or managing shipments?',
              a: 'AeroDispatch protects package privacy and business data: customers only see their own orders, delivery drivers see only their assigned daily stops, and admin control is restricted to the platform owner.'
            },
            {
              q: 'What delivery speeds and services are available?',
              a: 'We offer Express Air Delivery (guaranteed next-day delivery by air freight), Standard Ground Shipping (cost-effective linehaul transit), and Same-Day Priority (2 to 4 hour delivery within major metro cities).'
            },
            {
              q: 'How is proof of delivery verified when my package arrives?',
              a: 'The delivery associate enters the recipient name, confirms the 4-digit delivery PIN, and takes a photo proof of delivery upon handover.'
            }
          ].map((faq, idx) => (
            <div
              key={idx}
              className="card card-3d"
              style={{
                padding: '1.25rem 1.5rem',
                border: openFaq === idx ? '1px solid rgba(239, 68, 68, 0.45)' : '1px solid var(--border-subtle)',
                background: 'var(--bg-card)',
                cursor: 'pointer'
              }}
              onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--text-main)' }}>{faq.q}</h4>
                {openFaq === idx ? <ChevronUp size={18} color="#EF4444" /> : <ChevronDown size={18} color="var(--text-muted)" />}
              </div>

              {openFaq === idx && (
                <p style={{ marginTop: '0.75rem', fontSize: '0.86rem', color: 'var(--text-muted)', lineHeight: 1.5, borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem' }}>
                  {faq.a}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* =========================================================================
          APPLICATION FOOTER WITH ANIMATED BRAND EMBLEM
          ========================================================================= */}
      <footer
        className="reveal-3d"
        style={{
          borderTop: '1px solid var(--border-subtle)',
          background: 'var(--bg-secondary)',
          padding: '3rem 2rem 2.5rem',
          marginTop: '4rem'
        }}
      >
        <div
          style={{
            maxWidth: '1280px',
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '2rem'
          }}
        >
          <div>
            <AeroLogo
              size="lg"
              animated={true}
              showText={true}
              subtitle="MULTI-MODAL LOGISTICS PLATFORM"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            />
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', maxWidth: '380px', marginTop: '0.75rem', lineHeight: 1.5 }}>
              India's premier high-throughput parcel express, air cargo linehaul, and last-mile delivery automation infrastructure.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '2.5rem', flexWrap: 'wrap', fontSize: '0.85rem' }}>
            <div>
              <div style={{ fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.65rem' }}>Solutions</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', color: 'var(--text-muted)' }}>
                <span>Air Freight Network</span>
                <span>Express First/Last Mile</span>
                <span>Linehaul Sorting Hubs</span>
                <span>Merchant COD Manifests</span>
              </div>
            </div>

            <div>
              <div style={{ fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.65rem' }}>Access Portals</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', color: 'var(--text-muted)' }}>
                <button type="button" onClick={() => setActiveTab('auth')} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', textAlign: 'left', padding: 0, fontWeight: 700 }}>
                  Customer &amp; Delivery Captain Portal ➔
                </button>
                <button
                  id="footer-admin-login-btn"
                  type="button"
                  onClick={() => setIsAdminModalOpen(true)}
                  style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', textAlign: 'left', padding: 0, fontWeight: 700 }}
                >
                  For Admin Access ➔
                </button>
              </div>
            </div>
          </div>
        </div>

        <div style={{ maxWidth: '1280px', margin: '2rem auto 0', paddingTop: '1.5rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', borderBottom: 'none', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', fontSize: '0.78rem', color: 'var(--text-dim)' }}>
          <span>© 2026 AeroDispatch Technologies. All rights reserved.</span>
          <span>Enterprise Multi-Modal Logistics Platform</span>
        </div>
      </footer>

      {/* Cloud-Shaped Admin Login Modal */}
      {isAdminModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(5, 9, 20, 0.82)',
            backdropFilter: 'blur(16px)',
            padding: '1rem'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsAdminModalOpen(false);
          }}
        >
          {/* Sleek Google M3 Rounded Admin Modal Card */}
          <div
            className="admin-modal-card"
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '460px',
              background: 'linear-gradient(145deg, rgba(18, 24, 38, 0.98) 0%, rgba(10, 14, 24, 0.99) 100%)',
              border: '1.5px solid rgba(239, 68, 68, 0.45)',
              borderRadius: '32px',
              padding: '2.5rem 2.25rem 2.25rem',
              boxShadow: '0 30px 80px rgba(0, 0, 0, 0.85), 0 0 50px rgba(239, 68, 68, 0.25), inset 0 1px 2px rgba(255, 255, 255, 0.12)',
              color: '#FFFFFF',
              animation: 'aeroRoleEntrance 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards'
            }}
          >
            {/* Top Lock Emblem */}
            <div
              style={{
                position: 'absolute',
                top: '-24px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'linear-gradient(135deg, #EF4444 0%, #B91C1C 100%)',
                width: '52px',
                height: '52px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 25px rgba(239, 68, 68, 0.55), 0 0 0 5px rgba(10, 14, 24, 0.98)',
                color: '#FFFFFF'
              }}
              title="Admin Login"
            >
              <Lock size={22} color="#FFFFFF" />
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={() => {
                setIsAdminModalOpen(false);
                setAdminLoginError('');
              }}
              style={{
                position: 'absolute',
                top: '18px',
                right: '18px',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '50%',
                width: '34px',
                height: '34px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              title="Close modal"
              aria-label="Close admin modal"
            >
              <X size={16} />
            </button>

            {/* Top Admin Pill Badge */}
            <div style={{ textAlign: 'center', marginTop: '0.85rem', marginBottom: '0.5rem' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', padding: '4px 14px', borderRadius: '9999px', background: 'rgba(239, 68, 68, 0.14)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#F87171', fontSize: '0.74rem', fontWeight: 700, letterSpacing: '0.04em' }}>
                <Lock size={12} color="#F87171" />
                <span>Admin Access</span>
              </div>
            </div>

            {/* Funny Animated Mascot Boy */}
            <AdminPasscodeBoy 
              state={
                adminLoginError 
                  ? 'wrong' 
                  : adminCode === '8469' 
                  ? 'success' 
                  : (showAdminCode && adminCode.length > 0) 
                  ? 'peeking' 
                  : (isAdminCodeFocused || adminCode.length > 0) 
                  ? 'hiding' 
                  : 'idle'
              } 
              codeLength={adminCode.length}
              hasError={!!adminLoginError}
            />

            {/* Simple Clean Header */}
            <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0 0 0.35rem', letterSpacing: '-0.01em', color: '#FFFFFF' }}>
                Admin Login
              </h3>
              <p style={{ margin: 0, fontSize: '0.88rem', color: '#94A3B8', lineHeight: 1.4 }}>
                Enter your 4-digit PIN to continue
              </p>
            </div>

            {/* Error Notification */}
            {adminLoginError && (
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  borderRadius: '16px',
                  padding: '0.75rem 1rem',
                  fontSize: '0.82rem',
                  color: '#FCA5A5',
                  marginBottom: '1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <AlertCircle size={16} color="#EF4444" style={{ flexShrink: 0 }} />
                <span>{adminLoginError}</span>
              </div>
            )}

            {/* Form with Google Rounded Controls */}
            <form onSubmit={handleAdminModalLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#E2E8F0', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Lock size={13} color="#EF4444" />
                    <span>Admin PIN</span>
                  </label>
                  <span style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600 }}>4 digits</span>
                </div>

                <div style={{ position: 'relative' }}>
                  <input
                    id="admin-passkey-input"
                    type={showAdminCode ? 'text' : 'password'}
                    value={adminCode}
                    onChange={(e) => {
                      setAdminCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 4));
                      if (adminLoginError) setAdminLoginError('');
                    }}
                    onFocus={() => setIsAdminCodeFocused(true)}
                    onBlur={() => setIsAdminCodeFocused(false)}
                    placeholder="••••"
                    maxLength={4}
                    inputMode="numeric"
                    autoFocus
                    required
                    style={{
                      width: '100%',
                      padding: '0.9rem 3.2rem 0.9rem 1.5rem',
                      background: 'rgba(15, 23, 42, 0.95)',
                      border: isAdminCodeFocused ? '2px solid #EF4444' : '1.5px solid rgba(239, 68, 68, 0.45)',
                      borderRadius: '9999px',
                      color: '#FFFFFF',
                      fontSize: '1.45rem',
                      fontWeight: 900,
                      fontFamily: 'var(--font-mono, monospace)',
                      letterSpacing: '0.4em',
                      textAlign: 'center',
                      outline: 'none',
                      boxShadow: isAdminCodeFocused ? '0 0 20px rgba(239, 68, 68, 0.35)' : '0 4px 16px rgba(0, 0, 0, 0.4)',
                      transition: 'all 0.25s cubic-bezier(0.2, 0, 0, 1)'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminCode(!showAdminCode)}
                    style={{
                      position: 'absolute',
                      right: '16px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: showAdminCode ? '#EF4444' : '#94A3B8',
                      cursor: 'pointer',
                      padding: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      borderRadius: '50%',
                      transition: 'color 0.2s ease'
                    }}
                    title={showAdminCode ? "Hide PIN" : "Show PIN"}
                    aria-label={showAdminCode ? "Hide PIN" : "Show PIN"}
                  >
                    {showAdminCode ? <EyeOff size={19} /> : <Eye size={19} />}
                  </button>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', fontSize: '0.78rem', color: '#94A3B8' }}>
                  <span>Admin clearance only</span>
                  <span style={{ color: '#64748B' }}>Authorized access</span>
                </div>
              </div>

              {/* Submit Google Rounded Button */}
              <button
                id="admin-submit-btn"
                type="submit"
                disabled={adminLoginLoading}
                className="btn btn-primary"
                style={{
                  width: '100%',
                  marginTop: '0.5rem',
                  padding: '0.9rem',
                  fontWeight: 800,
                  fontSize: '0.96rem',
                  borderRadius: '9999px',
                  background: 'linear-gradient(135deg, #EF4444 0%, #B91C1C 100%)',
                  boxShadow: '0 6px 20px rgba(239, 68, 68, 0.45)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.55rem',
                  cursor: 'pointer'
                }}
              >
                {adminLoginLoading ? (
                  <span>Logging in...</span>
                ) : (
                  <>
                    <Lock size={16} />
                    <span>Log In ➔</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
