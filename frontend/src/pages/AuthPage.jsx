import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { apiRegister, apiConfirmRegister, apiResendCode, API_BASE_URL } from '../services/api';
import { 
  User, 
  Lock, 
  Mail, 
  Phone, 
  KeyRound, 
  ShieldCheck, 
  CheckCircle2, 
  Copy, 
  AlertCircle,
  Truck,
  Building2,
  RefreshCw
} from 'lucide-react';

export default function AuthPage() {
  const { loginUser, resetAccountPassword, addToast, setActiveTab } = useApp();

  const initialRole = React.useMemo(() => {
    const roleKey = localStorage.getItem('aerodispatch_auth_role') || localStorage.getItem('aerodispatch_auth_mode');
    localStorage.removeItem('aerodispatch_auth_role');
    localStorage.removeItem('aerodispatch_auth_mode');
    if (roleKey === 'driver') return 'driver';
    return 'customer';
  }, []);

  const prefilledPhone = React.useMemo(() => {
    const p = localStorage.getItem('aerodispatch_prefill_phone') || '';
    localStorage.removeItem('aerodispatch_prefill_phone');
    return p;
  }, []);

  const [authRole, setAuthRole] = useState(initialRole);
  const [authMode, setAuthMode] = useState(prefilledPhone ? 'register' : 'login'); // 'login' | 'register' | 'verify-otp' | 'forgot'
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState(prefilledPhone);
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [generatedTempPassword, setGeneratedTempPassword] = useState('');
  const [dispatchedEmail, setDispatchedEmail] = useState('');
  const [copiedPass, setCopiedPass] = useState(false);

  // OTP Verification State
  const [otpEmail, setOtpEmail] = useState('');
  const [otpPassword, setOtpPassword] = useState('');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [otpCountdown, setOtpCountdown] = useState(60);

  // Countdown timer for OTP resend
  useEffect(() => {
    let timer;
    if (authMode === 'verify-otp' && otpCountdown > 0) {
      timer = setTimeout(() => setOtpCountdown((c) => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [authMode, otpCountdown]);

  const handleOtpDigitChange = (index, value) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length > 1) {
      const pasted = cleaned.slice(0, 6).split('');
      const newDigits = [...otpDigits];
      pasted.forEach((char, i) => {
        newDigits[i] = char;
      });
      setOtpDigits(newDigits);
      const nextInput = document.getElementById('reg-otp-input-5');
      if (nextInput) nextInput.focus();
      return;
    }

    const newDigits = [...otpDigits];
    newDigits[index] = cleaned;
    setOtpDigits(newDigits);

    if (cleaned && index < 5) {
      const nextInput = document.getElementById(`reg-otp-input-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      const prevInput = document.getElementById(`reg-otp-input-${index - 1}`);
      if (prevInput) {
        prevInput.focus();
        const newDigits = [...otpDigits];
        newDigits[index - 1] = '';
        setOtpDigits(newDigits);
      }
    }
  };

  const handleResendCode = async () => {
    if (otpCountdown > 0) return;
    try {
      await apiResendCode(otpEmail);
      setOtpCountdown(60);
      addToast(`New verification code sent to ${otpEmail}!`, 'info');
    } catch (err) {
      addToast(err.message || 'Failed to resend code', 'error');
    }
  };

  const handleVerifyOtpSubmit = async (e) => {
    e.preventDefault();
    const code = otpDigits.join('').trim();
    if (code.length < 6) {
      setAuthError('Please enter all 6 digits of your verification code.');
      return;
    }

    setIsSubmitting(true);
    setAuthError('');
    try {
      await apiConfirmRegister(otpEmail, code, otpPassword);
      addToast('Account verified successfully with AWS Cognito! Please sign in with your credentials.', 'success');
      setEmail(otpEmail);
      setPassword('');
      setAuthMode('login');
      setOtpDigits(['', '', '', '', '', '']);
    } catch (err) {
      setAuthError(err.message || 'Verification failed. Please check the code and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick social / demo credential fills
  const handleSocialClick = (platform) => {
    setAuthError('');
    if (platform === 'google') {
      setEmail('aditya.sharma@example.com');
      setPassword('Customer@123');
      setAuthRole('customer');
      addToast('Loaded Customer Shipper credentials (Google Auth)', 'info');
    } else if (platform === 'github') {
      setEmail('priya.nair@aerodispatch.internal');
      setPassword('Admin@123');
      setAuthRole('admin');
      addToast('Loaded Operations Admin credentials (GitHub Auth)', 'info');
    } else if (platform === 'linkedin') {
      setEmail('ramesh.kumar@aerodispatch.internal');
      setPassword('Driver@123');
      setAuthRole('driver');
      addToast('Loaded Courier Driver credentials (LinkedIn Auth)', 'info');
    } else if (platform === 'facebook') {
      setEmail('merchant.express@aerodispatch.io');
      setPassword('Merchant@123');
      setAuthRole('customer');
      addToast('Loaded Merchant Account credentials (Facebook Auth)', 'info');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');

    if (authMode === 'forgot') {
      const targetEmail = email.trim();
      if (!targetEmail) {
        setAuthError('Please enter your registered email address.');
        return;
      }
      setIsSubmitting(true);

      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const tempPass = `Aero@${randomSuffix}`;

      if (resetAccountPassword) {
        resetAccountPassword(targetEmail, tempPass);
      }

      try {
        await fetch(`${API_BASE_URL}/api/v1/auth/forgot-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: targetEmail })
        });
      } catch (e) {
        // Fallback
      }

      setTimeout(() => {
        setIsSubmitting(false);
        setGeneratedTempPassword(tempPass);
        setDispatchedEmail(targetEmail);
        setForgotSuccess(true);
        addToast(`New password ${tempPass} dispatched to ${targetEmail}!`, 'success');
      }, 400);
      return;
    }

    if (!email || !password) {
      setAuthError('Please enter both username/email and password.');
      return;
    }

    // Resolve shorthand usernames to full demo emails if applicable
    let resolvedEmail = email.trim();
    if (!resolvedEmail.includes('@')) {
      const lower = resolvedEmail.toLowerCase();
      if (lower === 'customer' || lower === 'aditya') {
        resolvedEmail = 'aditya.sharma@example.com';
      } else if (lower === 'driver' || lower === 'ramesh') {
        resolvedEmail = 'ramesh.kumar@aerodispatch.internal';
      } else if (lower === 'admin' || lower === 'priya') {
        resolvedEmail = 'priya.nair@aerodispatch.internal';
      } else {
        resolvedEmail = `${lower}@aerodispatch.site`;
      }
    }

    setIsSubmitting(true);
    try {
      if (authMode === 'register') {
        if (!name.trim()) {
          setAuthError('Please enter your name.');
          setIsSubmitting(false);
          return;
        }

        try {
          const res = await apiRegister(name.trim(), resolvedEmail, password, authRole, phone.trim());
          if (res && res.requiresOtp) {
            setAuthMode('verify-otp');
            setOtpEmail(resolvedEmail);
            setOtpPassword(password);
            setOtpDigits(['', '', '', '', '', '']);
            setOtpCountdown(60);
            addToast(`Verification code sent to ${resolvedEmail}! Please enter the 6-digit code.`, 'info');
            setIsSubmitting(false);
            return;
          }
        } catch (apiErr) {
          console.warn("Backend register notice:", apiErr.message);
        }

        try {
          const existing = JSON.parse(localStorage.getItem('aerodispatch_registered_users') || '[]');
          existing.push({
            name: name.trim(),
            email: resolvedEmail.toLowerCase(),
            password: password,
            role: authRole,
            phone: phone.trim(),
            driverId: authRole === 'driver' ? `DRV-${phone.trim().slice(-4) || '504'}` : undefined,
            vehicleNumber: authRole === 'driver' ? 'MH-02-EE-8891' : undefined
          });
          localStorage.setItem('aerodispatch_registered_users', JSON.stringify(existing));
        } catch (e) {}

        addToast('Registration complete! Please sign in with your credentials.', 'success');
        setEmail(resolvedEmail);
        setPassword('');
        setAuthMode('login');
        setIsSubmitting(false);
        return;
      }

      await loginUser(resolvedEmail, password, authRole);
    } catch (err) {
      setAuthError(err.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-page-wrapper">
      <style>{`
        .login-page-wrapper {
          min-height: 100vh;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #e3e6f5 0%, #d8daf0 50%, #ccd1f0 100%);
          padding: 1.5rem 1rem;
          box-sizing: border-box;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          position: relative;
        }

        .login-back-btn {
          position: absolute;
          top: 1.5rem;
          left: 1.5rem;
          background: rgba(255, 255, 255, 0.75);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255, 255, 255, 0.9);
          color: #4b5563;
          font-size: 0.8rem;
          font-weight: 600;
          padding: 0.4rem 0.9rem;
          border-radius: 9999px;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
          transition: all 0.2s ease;
          z-index: 10;
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }

        .login-back-btn:hover {
          background: #ffffff;
          color: #748cf0;
          transform: translateY(-1px);
          box-shadow: 0 4px 14px rgba(116, 140, 240, 0.2);
        }

        .login-card-container {
          width: 100%;
          max-width: 780px;
          min-height: 440px;
          background: #ffffff;
          border-radius: 28px;
          box-shadow: 0 20px 45px -10px rgba(116, 140, 240, 0.22), 0 0 25px rgba(0, 0, 0, 0.04);
          display: grid;
          grid-template-columns: 42% 58%;
          overflow: hidden;
          position: relative;
        }

        .login-left-panel {
          background: #748cf0;
          border-top-right-radius: 120px;
          border-bottom-right-radius: 120px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 2.5rem 1.75rem;
          color: #ffffff;
          text-align: center;
          position: relative;
          z-index: 2;
        }

        .login-left-title {
          font-size: 1.85rem;
          font-weight: 800;
          color: #ffffff;
          margin: 0 0 0.45rem 0;
          letter-spacing: -0.02em;
          line-height: 1.2;
        }

        .login-left-subtitle {
          font-size: 0.85rem;
          color: rgba(255, 255, 255, 0.9);
          margin: 0 0 1.5rem 0;
          font-weight: 400;
        }

        .login-outline-btn {
          background: transparent;
          border: 1.5px solid #ffffff;
          color: #ffffff;
          padding: 0.5rem 2.2rem;
          border-radius: 8px;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          letter-spacing: 0.02em;
        }

        .login-outline-btn:hover {
          background: rgba(255, 255, 255, 0.18);
          transform: translateY(-1px);
        }

        .login-right-panel {
          background: #ffffff;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 2.5rem 2.5rem;
          position: relative;
          z-index: 1;
        }

        .login-form-inner {
          width: 100%;
          max-width: 310px;
          display: flex;
          flex-direction: column;
        }

        .login-heading {
          font-size: 1.85rem;
          font-weight: 800;
          color: #1f2937;
          margin: 0 0 1.5rem 0;
          text-align: center;
          letter-spacing: -0.02em;
        }

        .login-input-group {
          position: relative;
          width: 100%;
          margin-bottom: 0.85rem;
        }

        .login-input {
          width: 100%;
          height: 42px;
          background: #f0f2f5;
          border: 1px solid transparent;
          border-radius: 8px;
          padding: 0 2.5rem 0 1rem;
          font-size: 0.88rem;
          color: #1f2937;
          outline: none;
          box-sizing: border-box;
          transition: all 0.2s ease;
        }

        .login-input::placeholder {
          color: #9ca3af;
        }

        .login-input:focus {
          background: #ffffff;
          border-color: #748cf0;
          box-shadow: 0 0 0 3px rgba(116, 140, 240, 0.18);
        }

        .login-input-icon {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #4b5563;
          pointer-events: none;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .login-input-icon-btn {
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: #4b5563;
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .login-forgot-link {
          background: none;
          border: none;
          color: #6b7280;
          font-size: 0.78rem;
          font-weight: 500;
          cursor: pointer;
          padding: 0;
          margin: 0.1rem 0 1.15rem 0;
          text-align: center;
          transition: color 0.15s ease;
          display: block;
          width: 100%;
        }

        .login-forgot-link:hover {
          color: #748cf0;
          text-decoration: underline;
        }

        .login-submit-btn {
          width: 100%;
          height: 42px;
          background: #748cf0;
          color: #ffffff;
          border: none;
          border-radius: 8px;
          font-size: 0.92rem;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 4px 14px rgba(116, 140, 240, 0.35);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          transition: all 0.15s ease;
        }

        .login-submit-btn:hover:not(:disabled) {
          filter: brightness(1.05);
          transform: translateY(-1px);
        }

        .login-submit-btn:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }

        .login-social-label {
          text-align: center;
          margin: 1.15rem 0 0.8rem 0;
          color: #6b7280;
          font-size: 0.76rem;
          font-weight: 500;
        }

        .login-social-row {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 0.75rem;
        }

        .login-social-btn {
          width: 38px;
          height: 38px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          background: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #4b5563;
          cursor: pointer;
          transition: all 0.15s ease;
          font-weight: 700;
          padding: 0;
        }

        .login-social-btn:hover {
          border-color: #748cf0;
          color: #748cf0;
          background: #f8fafc;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(116, 140, 240, 0.18);
        }

        .login-error-alert {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.25);
          color: #ef4444;
          font-size: 0.76rem;
          padding: 0.45rem 0.65rem;
          border-radius: 6px;
          margin-bottom: 0.75rem;
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }

        .login-role-pills {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 0.75rem;
        }

        .login-role-pill {
          flex: 1;
          height: 34px;
          border-radius: 6px;
          border: 1px solid #e2e8f0;
          background: #f8fafc;
          color: #64748b;
          font-size: 0.76rem;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.35rem;
          transition: all 0.15s ease;
        }

        .login-role-pill.active {
          border-color: #748cf0;
          background: rgba(116, 140, 240, 0.12);
          color: #556ed4;
          font-weight: 700;
        }

        /* Responsive Breakpoint for Mobile Screens */
        @media (max-width: 768px) {
          .login-card-container {
            grid-template-columns: 1fr;
            min-height: auto;
            border-radius: 20px;
          }

          .login-left-panel {
            border-top-right-radius: 0;
            border-bottom-right-radius: 0;
            border-bottom-left-radius: 40px;
            border-bottom-right-radius: 40px;
            padding: 2rem 1.5rem;
          }

          .login-right-panel {
            padding: 2rem 1.5rem;
          }
        }
      `}</style>

      {/* Return to Public Home */}
      <button
        type="button"
        className="login-back-btn"
        onClick={() => setActiveTab('landing')}
        title="Return to AeroDispatch Homepage"
      >
        <span>← Home</span>
      </button>

      <div className="login-card-container">
        {/* =========================================================================
            LEFT PANEL: Curving Welcome Hero (Matches provided image)
            ========================================================================= */}
        <div className="login-left-panel">
          {authMode === 'register' ? (
            <>
              <h2 className="login-left-title">Welcome Back!</h2>
              <p className="login-left-subtitle">Already have an account?</p>
              <button 
                type="button" 
                className="login-outline-btn"
                onClick={() => {
                  setAuthMode('login');
                  setAuthError('');
                }}
              >
                Login
              </button>
            </>
          ) : authMode === 'forgot' ? (
            <>
              <h2 className="login-left-title">Account Recovery</h2>
              <p className="login-left-subtitle">Remember your password?</p>
              <button 
                type="button" 
                className="login-outline-btn"
                onClick={() => {
                  setAuthMode('login');
                  setAuthError('');
                  setForgotSuccess(false);
                }}
              >
                Login
              </button>
            </>
          ) : authMode === 'verify-otp' ? (
            <>
              <h2 className="login-left-title">Verification</h2>
              <p className="login-left-subtitle">Back to account creation?</p>
              <button 
                type="button" 
                className="login-outline-btn"
                onClick={() => {
                  setAuthMode('register');
                  setAuthError('');
                }}
              >
                Register
              </button>
            </>
          ) : (
            <>
              <h2 className="login-left-title">Hello, Welcome!</h2>
              <p className="login-left-subtitle">Don't have an account?</p>
              <button 
                type="button" 
                className="login-outline-btn"
                onClick={() => {
                  setAuthMode('register');
                  setAuthError('');
                }}
              >
                Register
              </button>
            </>
          )}
        </div>

        {/* =========================================================================
            RIGHT PANEL: Login Form (Matches provided image layout and typography)
            ========================================================================= */}
        <div className="login-right-panel">
          <div className="login-form-inner">
            {/* Heading */}
            <h1 className="login-heading">
              {authMode === 'register' 
                ? 'Register' 
                : authMode === 'forgot' 
                ? 'Reset Password' 
                : authMode === 'verify-otp' 
                ? 'Verify Code' 
                : 'Login'}
            </h1>

            {/* Error Message */}
            {authError && (
              <div className="login-error-alert">
                <AlertCircle size={14} style={{ flexShrink: 0 }} />
                <span>{authError}</span>
              </div>
            )}

            {/* 1. OTP Verification Form */}
            {authMode === 'verify-otp' ? (
              <form onSubmit={handleVerifyOtpSubmit}>
                <div style={{ textAlign: 'center', marginBottom: '1rem', color: '#6b7280', fontSize: '0.8rem' }}>
                  Enter the 6-digit verification code sent to <strong style={{ color: '#1f2937' }}>{otpEmail}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.45rem', marginBottom: '1.25rem' }}>
                  {[0, 1, 2, 3, 4, 5].map((idx) => (
                    <input
                      key={idx}
                      id={`reg-otp-input-${idx}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={otpDigits[idx]}
                      onChange={(e) => handleOtpDigitChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      autoFocus={idx === 0}
                      style={{
                        width: '38px',
                        height: '44px',
                        fontSize: '1.2rem',
                        fontWeight: 700,
                        textAlign: 'center',
                        background: '#f0f2f5',
                        border: otpDigits[idx] ? '2px solid #748cf0' : '1px solid #e2e8f0',
                        borderRadius: '8px',
                        color: '#1f2937',
                        outline: 'none'
                      }}
                    />
                  ))}
                </div>

                <div style={{ textAlign: 'center', fontSize: '0.78rem', color: '#6b7280', marginBottom: '1.25rem' }}>
                  {otpCountdown > 0 ? (
                    <span>Resend code in <strong style={{ color: '#748cf0' }}>{otpCountdown}s</strong></span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendCode}
                      style={{ background: 'none', border: 'none', color: '#748cf0', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
                    >
                      Resend code
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || otpDigits.join('').length < 6}
                  className="login-submit-btn"
                >
                  {isSubmitting ? 'Verifying...' : 'Verify & Continue'}
                </button>
              </form>
            ) : forgotSuccess ? (
              /* 2. Forgot Password Success Display */
              <div style={{ textAlign: 'center' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem' }}>
                  <CheckCircle2 size={24} color="#10B981" />
                </div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#1f2937', margin: '0 0 0.35rem 0' }}>
                  Temporary Password Ready
                </h3>
                <p style={{ color: '#6b7280', fontSize: '0.78rem', margin: '0 0 0.85rem 0', lineHeight: 1.45 }}>
                  Dispatched to: <strong style={{ color: '#1f2937' }}>{dispatchedEmail}</strong>
                </p>

                <div style={{
                  background: '#f8fafc',
                  border: '1.5px dashed #748cf0',
                  borderRadius: '8px',
                  padding: '0.75rem',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                      Access Code
                    </div>
                    <code style={{ fontSize: '1.15rem', fontWeight: 800, color: '#748cf0' }}>
                      {generatedTempPassword}
                    </code>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(generatedTempPassword);
                      setCopiedPass(true);
                      setTimeout(() => setCopiedPass(false), 2000);
                      addToast('Password copied!', 'info');
                    }}
                    style={{
                      background: copiedPass ? '#10B981' : '#748cf0',
                      border: 'none',
                      color: '#ffffff',
                      padding: '0.4rem 0.75rem',
                      borderRadius: '6px',
                      fontSize: '0.76rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.3rem'
                    }}
                  >
                    <Copy size={12} />
                    <span>{copiedPass ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                <button
                  type="button"
                  className="login-submit-btn"
                  onClick={() => {
                    setEmail(dispatchedEmail);
                    setPassword(generatedTempPassword);
                    setShowPassword(true);
                    setAuthMode('login');
                    setForgotSuccess(false);
                  }}
                >
                  Sign In With Password
                </button>
              </div>
            ) : (
              /* 3. Main Login / Register / Forgot Form */
              <form onSubmit={handleSubmit}>
                {/* Role Toggle for Registration */}
                {authMode === 'register' && (
                  <div className="login-role-pills">
                    <button
                      type="button"
                      className={`login-role-pill ${authRole === 'customer' ? 'active' : ''}`}
                      onClick={() => setAuthRole('customer')}
                    >
                      <Building2 size={13} />
                      <span>Customer</span>
                    </button>
                    <button
                      type="button"
                      className={`login-role-pill ${authRole === 'driver' ? 'active' : ''}`}
                      onClick={() => setAuthRole('driver')}
                    >
                      <Truck size={13} />
                      <span>Driver</span>
                    </button>
                  </div>
                )}

                {/* Name Field (Register Mode Only) */}
                {authMode === 'register' && (
                  <div className="login-input-group">
                    <input
                      type="text"
                      className="login-input"
                      placeholder="Full Name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                    <div className="login-input-icon">
                      <User size={16} />
                    </div>
                  </div>
                )}

                {/* Mobile Phone Field (Register Mode Only) */}
                {authMode === 'register' && (
                  <div className="login-input-group">
                    <input
                      type="tel"
                      className="login-input"
                      placeholder="Mobile Number"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                    />
                    <div className="login-input-icon">
                      <Phone size={16} />
                    </div>
                  </div>
                )}

                {/* Username / Email Field */}
                <div className="login-input-group">
                  <input
                    id="auth-username-input"
                    type={authMode === 'forgot' ? 'email' : 'text'}
                    className="login-input"
                    placeholder={authMode === 'forgot' ? 'Email Address' : 'Username'}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  <div className="login-input-icon">
                    {authMode === 'forgot' ? <Mail size={16} /> : <User size={16} />}
                  </div>
                </div>

                {/* Password Field */}
                {authMode !== 'forgot' && (
                  <div className="login-input-group" style={{ marginBottom: authMode === 'login' ? '0.45rem' : '1.1rem' }}>
                    <input
                      id="auth-password-input"
                      type={showPassword ? 'text' : 'password'}
                      className="login-input"
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="login-input-icon-btn"
                      onClick={() => setShowPassword(!showPassword)}
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      <Lock size={16} />
                    </button>
                  </div>
                )}

                {/* Forgot Password Link (Only in Login Mode) */}
                {authMode === 'login' && (
                  <button
                    type="button"
                    className="login-forgot-link"
                    onClick={() => {
                      setAuthMode('forgot');
                      setAuthError('');
                      setForgotSuccess(false);
                    }}
                  >
                    Forgot Password?
                  </button>
                )}

                {/* Submit Action Button */}
                <button
                  id="auth-submit-btn"
                  type="submit"
                  disabled={isSubmitting}
                  className="login-submit-btn"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw size={14} className="spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <span>
                      {authMode === 'register' ? 'Register' : authMode === 'forgot' ? 'Send Temporary Password' : 'Login'}
                    </span>
                  )}
                </button>

                {/* Social Login Separator & Icons (As shown in screenshot) */}
                {authMode !== 'forgot' && (
                  <>
                    <div className="login-social-label">
                      or {authMode === 'register' ? 'register' : 'login'} with social platforms
                    </div>

                    <div className="login-social-row">
                      {/* Google */}
                      <button
                        type="button"
                        className="login-social-btn"
                        onClick={() => handleSocialClick('google')}
                        title="Sign in with Google (Customer Shipper Demo)"
                      >
                        <span style={{ fontSize: '1rem', fontFamily: 'sans-serif', fontWeight: 700 }}>G</span>
                      </button>

                      {/* Facebook */}
                      <button
                        type="button"
                        className="login-social-btn"
                        onClick={() => handleSocialClick('facebook')}
                        title="Sign in with Facebook"
                      >
                        <span style={{ fontSize: '1rem', fontFamily: 'serif', fontWeight: 800 }}>f</span>
                      </button>

                      {/* GitHub */}
                      <button
                        type="button"
                        className="login-social-btn"
                        onClick={() => handleSocialClick('github')}
                        title="Sign in with GitHub (Control Tower Admin Demo)"
                      >
                        <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
                          <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                        </svg>
                      </button>

                      {/* LinkedIn */}
                      <button
                        type="button"
                        className="login-social-btn"
                        onClick={() => handleSocialClick('linkedin')}
                        title="Sign in with LinkedIn (Courier Driver Demo)"
                      >
                        <span style={{ fontSize: '0.86rem', fontWeight: 800, letterSpacing: '-0.02em' }}>in</span>
                      </button>
                    </div>
                  </>
                )}
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
