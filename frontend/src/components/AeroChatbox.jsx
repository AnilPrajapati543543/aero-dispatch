import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import AeroLogo from './AeroLogo';
import { 
  X, 
  Send, 
  Search, 
  User, 
  Truck, 
  Clock, 
  RotateCcw,
  CheckCircle2, 
  AlertCircle,
  Package,
  MessageSquare,
  Headphones,
  MapPin,
  ArrowRight,
  ShieldCheck,
  Check
} from 'lucide-react';

const INITIAL_MESSAGES = [
  {
    id: 'welcome-1',
    sender: 'bot',
    text: 'Hello! 👋 Welcome to AeroDispatch Customer Support.',
    time: 'Just now'
  },
  {
    id: 'welcome-2',
    sender: 'bot',
    text: 'I am AeroBot, your 24/7 intelligent logistics & dispatch assistant. How can I help you today? Please choose an option below or type your question:',
    quickChips: [
      { label: '📦 Track my Parcel / AWB', query: 'track' },
      { label: '⏱️ Delivery Status & Delay', query: 'delay' },
      { label: '🚚 Delivery Captain Run Sheets', query: 'driver' },
      { label: '👤 Account & Login Help', query: 'account' },
      { label: '💰 Shipping Rates & Booking', query: 'rates' },
      { label: '💬 Talk to Dispatch Agent', query: 'agent' }
    ],
    time: 'Just now'
  }
];

export default function AeroChatbox() {
  const { 
    isChatboxOpen, 
    closeChatbox, 
    shipments, 
    setSelectedAwb, 
    setTrackingQuery, 
    setActiveTab 
  } = useApp();

  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isChatboxOpen) {
      scrollToBottom();
    }
  }, [messages, isTyping, isChatboxOpen]);

  if (!isChatboxOpen) return null;

  const handleResetChat = () => {
    setMessages(INITIAL_MESSAGES);
    setInputMessage('');
    setIsTyping(false);
  };

  const addBotResponseWithTyping = (responseObj, delay = 500) => {
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setMessages(prev => [...prev, responseObj]);
    }, delay);
  };

  const handleQuickChipClick = (queryType) => {
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (queryType === 'track') {
      const userMsg = { id: String(Date.now()), sender: 'user', text: 'Where is my parcel? Track AWB', time: timeNow };
      setMessages(prev => [...prev, userMsg]);

      addBotResponseWithTyping({
        id: String(Date.now() + 1),
        sender: 'bot',
        text: 'Sure thing! 📦 Please type your 10-character Air Waybill number (e.g. AD-8849-2041 or AD-1029-3391) or your order ID. You can also tap the quick sample below:',
        quickChips: [
          { label: '🔍 Test Sample: AD-8849-2041', query: 'sample_awb' },
          { label: '🔍 Test Sample: AD-9021-4412', query: 'sample_awb_2' }
        ],
        time: timeNow
      }, 400);

    } else if (queryType === 'sample_awb' || queryType === 'sample_awb_2') {
      const sampleCode = queryType === 'sample_awb' ? 'AD-8849-2041' : 'AD-9021-4412';
      const userMsg = { id: String(Date.now()), sender: 'user', text: `Track ${sampleCode}`, time: timeNow };
      setMessages(prev => [...prev, userMsg]);

      const match = shipments?.find(s => s.awb === sampleCode) || {
        awb: sampleCode,
        status: 'IN TRANSIT',
        senderCity: 'Gurugram Central Hub',
        recipientCity: 'Bengaluru Air Cargo Hub',
        estimatedDelivery: 'Tomorrow by 4:00 PM',
        carrier: 'AeroDispatch National Linehaul #104'
      };

      addBotResponseWithTyping({
        id: String(Date.now() + 1),
        sender: 'bot',
        text: `Found active consignment ${match.awb}! Here are your live dispatch milestones:`,
        shipmentCard: match,
        quickChips: [
          { label: '⏱️ Estimated Delivery Details', query: 'delay' },
          { label: '💬 Speak with Agent', query: 'agent' }
        ],
        time: timeNow
      }, 500);

    } else if (queryType === 'delay') {
      const userMsg = { id: String(Date.now()), sender: 'user', text: 'Check delivery transit & delay status', time: timeNow };
      setMessages(prev => [...prev, userMsg]);

      addBotResponseWithTyping({
        id: String(Date.now() + 1),
        sender: 'bot',
        text: '⚡ AeroDispatch operates 24/7 dedicated linehauls with an overall 99.8% on-time SLA.\n\n• Tier 1 Metro Routes (DEL ➔ BLR, BOM ➔ DEL): Guaranteed 24-48 Hours Express.\n• Regional Surface Ground: 3-5 Business Days.\n\nIf your package is delayed, enter your AWB number and I will inspect current sorting progress for you!',
        time: timeNow
      }, 450);

    } else if (queryType === 'driver') {
      const userMsg = { id: String(Date.now()), sender: 'user', text: 'I am a Delivery Captain', time: timeNow };
      setMessages(prev => [...prev, userMsg]);

      addBotResponseWithTyping({
        id: String(Date.now() + 1),
        sender: 'bot',
        text: 'Welcome Captain! 🚚 Delivery Captains have full self-serve access to daily delivery run sheets, navigation routes, and recipient OTP verification.',
        actionButtons: [
          { label: 'Sign In to Captain Cockpit ➔', action: () => { localStorage.setItem('aerodispatch_auth_role', 'driver'); setActiveTab('auth'); closeChatbox(); } },
          { label: 'Register as Delivery Captain ➔', action: () => { localStorage.setItem('aerodispatch_auth_role', 'driver'); localStorage.setItem('aerodispatch_auth_mode', 'register'); setActiveTab('auth'); closeChatbox(); } }
        ],
        time: timeNow
      }, 400);

    } else if (queryType === 'account') {
      const userMsg = { id: String(Date.now()), sender: 'user', text: 'Account, Login & OTP help', time: timeNow };
      setMessages(prev => [...prev, userMsg]);

      addBotResponseWithTyping({
        id: String(Date.now() + 1),
        sender: 'bot',
        text: 'Which portal do you need help accessing?',
        actionButtons: [
          { label: 'Customer Merchant Desk (Sign In / Register) ➔', action: () => { localStorage.setItem('aerodispatch_auth_role', 'customer'); setActiveTab('auth'); closeChatbox(); } },
          { label: 'Delivery Captain Dispatch (Sign In / Register) ➔', action: () => { localStorage.setItem('aerodispatch_auth_role', 'driver'); setActiveTab('auth'); closeChatbox(); } }
        ],
        time: timeNow
      }, 350);

    } else if (queryType === 'rates') {
      const userMsg = { id: String(Date.now()), sender: 'user', text: 'Consignment booking & rates', time: timeNow };
      setMessages(prev => [...prev, userMsg]);

      addBotResponseWithTyping({
        id: String(Date.now() + 1),
        sender: 'bot',
        text: 'Doorstep pickup starts at ₹45 across 19,000+ pincodes in India with automated thermal barcode generation and volumetric calculations.',
        actionButtons: [
          { label: 'Open Instant Booking Wizard ➔', action: () => { setActiveTab('create-order'); closeChatbox(); } }
        ],
        time: timeNow
      }, 400);

    } else if (queryType === 'agent') {
      const userMsg = { id: String(Date.now()), sender: 'user', text: 'Connect with a human dispatch agent', time: timeNow };
      setMessages(prev => [...prev, userMsg]);

      addBotResponseWithTyping({
        id: String(Date.now() + 1),
        sender: 'bot',
        text: 'Routing you to the National Operations Control Center...\n\n🟢 Connected to Dispatch Officer Priya (North Region Hub).\n\n"Hello! I am reviewing your active session. Please provide your AWB number or describe your inquiry, and I will assist you immediately."',
        time: timeNow
      }, 700);
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    const query = inputMessage.trim();
    if (!query) return;

    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg = { id: String(Date.now()), sender: 'user', text: query, time: timeNow };
    setInputMessage('');
    setMessages(prev => [...prev, userMsg]);

    const upperQuery = query.toUpperCase();
    const matchedShipment = shipments?.find(s => 
      s.awb?.toUpperCase() === upperQuery || 
      s.id?.toUpperCase() === upperQuery ||
      s.awb?.toUpperCase().includes(upperQuery)
    );

    let botResponse = null;

    if (matchedShipment) {
      botResponse = {
        id: String(Date.now() + 1),
        sender: 'bot',
        text: `Found live record for AWB ${matchedShipment.awb}!`,
        shipmentCard: matchedShipment,
        time: timeNow
      };
    } else if (upperQuery.includes('TRACK') || upperQuery.includes('AWB') || upperQuery.includes('WHERE') || upperQuery.includes('ORDER')) {
      botResponse = {
        id: String(Date.now() + 1),
        sender: 'bot',
        text: 'To track your consignment, please enter your Air Waybill number (e.g. AD-8849-2041):',
        quickChips: [
          { label: '🔍 Test Sample: AD-8849-2041', query: 'sample_awb' }
        ],
        time: timeNow
      };
    } else if (upperQuery.includes('DRIVER') || upperQuery.includes('COURIER') || upperQuery.includes('DELIVERY BOY')) {
      botResponse = {
        id: String(Date.now() + 1),
        sender: 'bot',
        text: 'AeroDispatch empowers delivery captains with instant self-registration and daily route manifests.',
        actionButtons: [
          { label: 'Sign In to Captain Cockpit ➔', action: () => { localStorage.setItem('aerodispatch_auth_role', 'driver'); setActiveTab('auth'); closeChatbox(); } },
          { label: 'Register Captain Account ➔', action: () => { localStorage.setItem('aerodispatch_auth_role', 'driver'); localStorage.setItem('aerodispatch_auth_mode', 'register'); setActiveTab('auth'); closeChatbox(); } }
        ],
        time: timeNow
      };
    } else if (upperQuery.includes('AGENT') || upperQuery.includes('HUMAN') || upperQuery.includes('SUPPORT') || upperQuery.includes('HELP')) {
      botResponse = {
        id: String(Date.now() + 1),
        sender: 'bot',
        text: '🟢 Connected with Senior Operations Specialist Rahul.\n\n"Thank you for reaching AeroDispatch Priority Support. Please leave your contact number or consignment AWB and our team will resolve it for you right away."',
        time: timeNow
      };
    } else {
      botResponse = {
        id: String(Date.now() + 1),
        sender: 'bot',
        text: `Thank you for reaching out! Our dispatch network is operating 24/7. How can we best assist your inquiry?`,
        quickChips: [
          { label: '📦 Track an Order', query: 'track' },
          { label: '⏱️ Delivery Status', query: 'delay' },
          { label: '👤 Account Sign-In / Register', query: 'account' },
          { label: '💬 Talk to Human Agent', query: 'agent' }
        ],
        time: timeNow
      };
    }

    addBotResponseWithTyping(botResponse, 450);
  };

  const handleTrackDirect = (awb) => {
    setSelectedAwb(awb);
    setTrackingQuery(awb);
    setActiveTab('track');
    closeChatbox();
  };

  return (
    <div 
      className="aero-chatbox-wrapper"
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        width: 'min(410px, calc(100vw - 32px))',
        height: 'min(580px, calc(100vh - 90px))',
        background: 'var(--bg-primary)',
        borderRadius: '20px',
        boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.5), 0 0 0 1px var(--border-medium)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 99999,
        overflow: 'hidden',
        border: '1px solid var(--border-medium)',
        animation: 'chatboxSlideUp 0.28s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
    >
      {/* Modern Real-World Header */}
      <div 
        style={{
          padding: '0.85rem 1.15rem',
          background: 'linear-gradient(135deg, #070B14 0%, #111827 100%)',
          color: '#FFFFFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div style={{ position: 'relative' }}>
            <AeroLogo size="sm" animated={false} showText={false} showSubtitle={false} />
            <span style={{ 
              position: 'absolute', 
              bottom: '1px', 
              right: '1px', 
              width: '8px', 
              height: '8px', 
              borderRadius: '50%', 
              background: '#10B981', 
              border: '2px solid #070B14',
              boxShadow: '0 0 6px #10B981' 
            }} />
          </div>
          <div>
            <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span>AeroDispatch Support</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.7rem', color: '#10B981', fontWeight: 600 }}>
              <span>AeroBot • Live AI &amp; Dispatch</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <button
            type="button"
            onClick={handleResetChat}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: 'none',
              borderRadius: '50%',
              width: '28px',
              height: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#94A3B8',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            title="Restart Conversation"
          >
            <RotateCcw size={14} />
          </button>

          <button
            type="button"
            onClick={closeChatbox}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: 'none',
              borderRadius: '50%',
              width: '28px',
              height: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#94A3B8',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            title="Close Support Assistant"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div 
        style={{
          flex: 1,
          padding: '1rem',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.85rem',
          background: 'var(--bg-secondary)'
        }}
      >
        {messages.map((m) => {
          const isUser = m.sender === 'user';
          return (
            <div 
              key={m.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: isUser ? 'flex-end' : 'flex-start'
              }}
            >
              <div 
                style={{
                  maxWidth: '86%',
                  padding: '0.75rem 0.95rem',
                  borderRadius: isUser ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                  background: isUser ? 'var(--primary)' : 'var(--bg-card)',
                  color: isUser ? '#FFFFFF' : 'var(--text-main)',
                  fontSize: '0.82rem',
                  lineHeight: 1.45,
                  boxShadow: isUser ? '0 4px 12px rgba(239, 68, 68, 0.25)' : '0 2px 6px rgba(0, 0, 0, 0.08)',
                  border: isUser ? 'none' : '1px solid var(--border-subtle)',
                  whiteSpace: 'pre-line'
                }}
              >
                {m.text}

                {/* Optional Shipment Match Card */}
                {m.shipmentCard && (
                  <div 
                    style={{
                      marginTop: '0.65rem',
                      padding: '0.75rem',
                      background: 'rgba(0, 0, 0, 0.05)',
                      borderRadius: '8px',
                      border: '1px solid var(--border-medium)',
                      fontSize: '0.78rem'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                      <span style={{ fontWeight: 800, color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>
                        {m.shipmentCard.awb}
                      </span>
                      <span style={{ 
                        padding: '2px 8px', 
                        borderRadius: '9999px', 
                        background: 'rgba(16, 185, 129, 0.15)', 
                        color: '#10B981', 
                        fontWeight: 800,
                        fontSize: '0.7rem' 
                      }}>
                        {m.shipmentCard.status}
                      </span>
                    </div>

                    <div style={{ color: 'var(--text-muted)', marginBottom: '0.4rem', fontSize: '0.74rem' }}>
                      {m.shipmentCard.originHub || m.shipmentCard.senderCity} ➔ {m.shipmentCard.destinationHub || m.shipmentCard.recipientCity}
                    </div>

                    {m.shipmentCard.estimatedDelivery && (
                      <div style={{ color: 'var(--text-dim)', fontSize: '0.72rem', marginBottom: '0.6rem' }}>
                        ETA: <strong>{m.shipmentCard.estimatedDelivery}</strong>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => handleTrackDirect(m.shipmentCard.awb)}
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        background: 'var(--text-main)',
                        color: 'var(--bg-primary)',
                        border: 'none',
                        borderRadius: '6px',
                        fontWeight: 700,
                        fontSize: '0.76rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.35rem'
                      }}
                    >
                      <Search size={13} />
                      <span>Track on Live Radar ➔</span>
                    </button>
                  </div>
                )}

                {/* Optional Action Buttons */}
                {m.actionButtons && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', marginTop: '0.65rem' }}>
                    {m.actionButtons.map((btn, bIdx) => (
                      <button
                        key={bIdx}
                        type="button"
                        onClick={btn.action}
                        style={{
                          background: 'rgba(239, 68, 68, 0.08)',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          color: '#EF4444',
                          borderRadius: '8px',
                          padding: '0.5rem 0.75rem',
                          fontSize: '0.76rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Quick suggestion chips */}
              {m.quickChips && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.45rem' }}>
                  {m.quickChips.map((chip, cIdx) => (
                    <button
                      key={cIdx}
                      type="button"
                      onClick={() => handleQuickChipClick(chip.query)}
                      style={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-medium)',
                        color: 'var(--text-main)',
                        borderRadius: '9999px',
                        padding: '4px 10px',
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              )}

              <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)', marginTop: '2px', padding: '0 4px' }}>
                {m.time}
              </span>
            </div>
          );
        })}

        {/* Real-World Typing Animation Indicator */}
        {isTyping && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '0.5rem 0.85rem', background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border-subtle)', width: 'fit-content' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary)', animation: 'pulseGlow 1s infinite' }} />
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary)', animation: 'pulseGlow 1s infinite 0.2s' }} />
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary)', animation: 'pulseGlow 1s infinite 0.4s' }} />
            <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginLeft: '4px' }}>AeroBot is typing...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <form 
        onSubmit={handleSendMessage}
        style={{
          padding: '0.65rem 0.85rem',
          background: 'var(--bg-primary)',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}
      >
        <input 
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Ask a question or enter AWB..."
          style={{
            flex: 1,
            padding: '0.55rem 0.85rem',
            borderRadius: '9999px',
            border: '1px solid var(--border-medium)',
            background: 'var(--bg-secondary)',
            color: 'var(--text-main)',
            fontSize: '0.82rem',
            outline: 'none'
          }}
        />

        <button
          type="submit"
          disabled={!inputMessage.trim()}
          style={{
            width: '34px',
            height: '34px',
            borderRadius: '50%',
            background: inputMessage.trim() ? 'var(--primary)' : 'var(--bg-secondary)',
            color: inputMessage.trim() ? '#FFFFFF' : 'var(--text-dim)',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: inputMessage.trim() ? 'pointer' : 'default',
            transition: 'all 0.15s ease'
          }}
          title="Send message"
        >
          <Send size={14} />
        </button>
      </form>
    </div>
  );
}
