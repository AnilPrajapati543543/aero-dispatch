import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { apiRegister, apiConfirmRegister, apiResendCode, API_BASE_URL } from '../services/api';
import { SkeletonRegisterCard } from '../components/SkeletonLoading';
import { 
  User, 
  Lock, 
  Mail, 
  Phone, 
  KeyRound, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle,
  Truck,
  Building2,
  RefreshCw,
  Eye,
  EyeOff,
  ArrowRight
} from 'lucide-react';

export default function AuthPage() {
  const { currentUser, loginUser, resetAccountPassword, addToast, setActiveTab } = useApp();

  // 1.2s Skeleton loading effect when clicking "Add another account"
  const [isSkeletonLoading, setIsSkeletonLoading] = useState(() => {
    const needSkeleton = sessionStorage.getItem('aerodispatch_auth_skeleton');
    if (needSkeleton === 'true') {
      sessionStorage.removeItem('aerodispatch_auth_skeleton');
      return true;
    }
    return false;
  });

  useEffect(() => {
    if (isSkeletonLoading) {
      const timer = setTimeout(() => {
        setIsSkeletonLoading(false);
      }, 1200); // Strictly 1.2s skeleton effect as requested
      return () => clearTimeout(timer);
    }
  }, [isSkeletonLoading]);

  const initialMode = React.useMemo(() => {
    const modeKey = localStorage.getItem('aerodispatch_auth_mode');
    localStorage.removeItem('aerodispatch_auth_mode');
    if (modeKey === 'register') return 'register';
    if (modeKey === 'login') return 'login';
    const p = localStorage.getItem('aerodispatch_prefill_phone');
    return p ? 'register' : 'login';
  }, []);

  const initialRole = React.useMemo(() => {
    const roleKey = localStorage.getItem('aerodispatch_auth_role');
    localStorage.removeItem('aerodispatch_auth_role');
    if (roleKey === 'driver') return 'driver';
    return 'customer';
  }, []);

  const prefilledPhone = React.useMemo(() => {
    const p = localStorage.getItem('aerodispatch_prefill_phone') || '';
    localStorage.removeItem('aerodispatch_prefill_phone');
    return p;
  }, []);

  const [authRole, setAuthRole] = useState(initialRole);
  const [authMode, setAuthMode] = useState(initialMode); // 'login' | 'register' | 'verify-otp' | 'forgot'

  useEffect(() => {
    const modeKey = localStorage.getItem('aerodispatch_auth_mode');
    if (modeKey) {
      localStorage.removeItem('aerodispatch_auth_mode');
      if (modeKey === 'register' || modeKey === 'login') {
        setAuthMode(modeKey);
      }
    }
    const roleKey = localStorage.getItem('aerodispatch_auth_role');
    if (roleKey) {
      localStorage.removeItem('aerodispatch_auth_role');
      if (roleKey === 'driver' || roleKey === 'customer') {
        setAuthRole(roleKey);
      }
    }
  }, []);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState(prefilledPhone);
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [dispatchedEmail, setDispatchedEmail] = useState('');

  // OTP Verification State
  const [otpEmail, setOtpEmail] = useState('');
  const [otpPassword, setOtpPassword] = useState('');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [otpCountdown, setOtpCountdown] = useState(60);
  const [pendingUserData, setPendingUserData] = useState(null);

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
    setIsSubmitting(true);
    setAuthError('');
    try {
      await apiResendCode(otpEmail);
      setOtpCountdown(60);
      setOtpDigits(['', '', '', '', '', '']);
      addToast(`New verification code sent to ${otpEmail}! Check your inbox.`, 'info');
    } catch (err) {
      setAuthError(err.message || 'Failed to resend code');
      addToast(err.message || 'Failed to resend code', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtpSubmit = async (e) => {
    e.preventDefault();
    const code = otpDigits.join('').trim();
    if (code.length < 6) {
      setAuthError('Please enter all 6 digits of the verification code sent to your email.');
      return;
    }

    setIsSubmitting(true);
    setAuthError('');

    try {
      // 1. Validate real verification code with AWS Cognito
      await apiConfirmRegister(otpEmail, code);
      addToast('Email verified successfully with AWS Cognito! Logging in...', 'success');

      // 2. Persist user locally for reliable role-matching
      if (pendingUserData) {
        const existing = JSON.parse(localStorage.getItem('aerodispatch_registered_users') || '[]');
        const updated = existing.filter(u => u.email?.toLowerCase() !== pendingUserData.email.toLowerCase());
        updated.push({
          name: pendingUserData.name,
          email: pendingUserData.email.toLowerCase(),
          password: pendingUserData.password,
          role: pendingUserData.role,
          phone: pendingUserData.phone,
          driverId: pendingUserData.role === 'driver' ? `DRV-${pendingUserData.phone.slice(-4) || '8469'}` : undefined,
          vehicleNumber: pendingUserData.role === 'driver' ? 'MH-02-EE-8891' : undefined
        });
        localStorage.setItem('aerodispatch_registered_users', JSON.stringify(updated));
      }

      // 3. Log user in
      const loginPassword = otpPassword || pendingUserData?.password;
      await loginUser(otpEmail, loginPassword, authRole);
      setOtpDigits(['', '', '', '', '', '']);
    } catch (err) {
      setAuthError(err.message || 'Verification failed. Please check the code sent to your email and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');

    // Forgot Password Flow: Real Request Submission
    if (authMode === 'forgot') {
      const targetEmail = email.trim();
      if (!targetEmail) {
        setAuthError('Please enter your registered email address.');
        return;
      }
      setIsSubmitting(true);

      try {
        await fetch(`${API_BASE_URL}/api/v1/auth/forgot-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: targetEmail })
        }).catch(() => {});
      } catch (err) {}

      if (resetAccountPassword) {
        resetAccountPassword(targetEmail);
      }

      setTimeout(() => {
        setIsSubmitting(false);
        setDispatchedEmail(targetEmail);
        setForgotSuccess(true);
        addToast(`Password reset request submitted for ${targetEmail}!`, 'success');
      }, 500);
      return;
    }

    if (!email || !password) {
      setAuthError('Please enter both username/email and password.');
      return;
    }

    const resolvedEmail = email.trim();

    setIsSubmitting(true);
    try {
      if (authMode === 'register') {
        if (!name.trim()) {
          setAuthError('Please enter your full name.');
          setIsSubmitting(false);
          return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(resolvedEmail)) {
          setAuthError('Please enter a valid email address (e.g. name@domain.com).');
          setIsSubmitting(false);
          return;
        }

        // Proper password validation: min 8 chars, uppercase, lowercase, number, symbol
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
        if (!passwordRegex.test(password)) {
          setAuthError('Password must be at least 8 characters and include uppercase, lowercase, numbers, and special symbols (e.g. StrongPass123!).');
          setIsSubmitting(false);
          return;
        }

        try {
          // Real AWS Cognito User Registration -> Dispatches actual email verification code
          await apiRegister(name.trim(), resolvedEmail, password, authRole, phone.trim());
          setOtpEmail(resolvedEmail);
          setOtpPassword(password);
          setPendingUserData({
            name: name.trim(),
            email: resolvedEmail,
            password: password,
            role: authRole,
            phone: phone.trim()
          });
          setOtpDigits(['', '', '', '', '', '']);
          setOtpCountdown(60);
          setAuthMode('verify-otp');
          setAuthError('');
          addToast(`Verification code sent to ${resolvedEmail}! Check your inbox.`, 'success');
        } catch (apiErr) {
          setAuthError(apiErr.message || 'Registration failed. Please check your details.');
        } finally {
          setIsSubmitting(false);
        }
        return;
      }

      // Real Login: authenticate against AWS Cognito or persistent user store
      try {
        await loginUser(resolvedEmail, password, authRole);
      } catch (loginErr) {
        if (loginErr.requiresVerification || (loginErr.message && loginErr.message.includes('not verified'))) {
          setOtpEmail(resolvedEmail);
          setOtpPassword(password);
          setOtpDigits(['', '', '', '', '', '']);
          setOtpCountdown(60);
          setAuthMode('verify-otp');
          setAuthError('Your account has not been verified yet. We sent a verification code to your email.');
          try {
            await apiResendCode(resolvedEmail);
          } catch {}
          return;
        }
        throw loginErr;
      }
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
          background: radial-gradient(circle at 18% 25%, rgba(185, 28, 28, 0.32) 0%, transparent 45%),
                      radial-gradient(circle at 82% 75%, rgba(220, 38, 38, 0.24) 0%, transparent 45%),
                      radial-gradient(circle at 50% 50%, rgba(153, 27, 27, 0.15) 0%, transparent 60%),
                      #07070a;
          padding: 2.5rem 1.5rem;
          box-sizing: border-box;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          position: relative;
          overflow: hidden;
        }

        /* Glassmorphism Glowing Ambient Orbs Behind Card */
        .login-ambient-orb-1 {
          position: absolute;
          width: 520px;
          height: 520px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(220, 38, 38, 0.28) 0%, rgba(153, 27, 27, 0) 70%);
          top: -120px;
          left: -120px;
          filter: blur(80px);
          pointer-events: none;
          z-index: 1;
        }

        .login-ambient-orb-2 {
          position: absolute;
          width: 480px;
          height: 480px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(185, 28, 28, 0.25) 0%, rgba(69, 10, 10, 0) 70%);
          bottom: -100px;
          right: -100px;
          filter: blur(85px);
          pointer-events: none;
          z-index: 1;
        }

        .login-back-btn {
          position: absolute;
          top: 1.5rem;
          left: 1.75rem;
          background: rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: #f3f4f6;
          font-size: 0.82rem;
          font-weight: 600;
          padding: 0.45rem 1rem;
          border-radius: 9999px;
          cursor: pointer;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4);
          transition: all 0.2s ease;
          z-index: 10;
          display: flex;
          align-items: center;
          gap: 0.45rem;
        }

        .login-back-btn:hover {
          background: rgba(220, 38, 38, 0.25);
          border-color: rgba(239, 68, 68, 0.5);
          color: #ffffff;
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(220, 38, 38, 0.3);
        }

        /* Widened Horizontal Card with Glassmorphism */
        .login-card-container {
          width: 100%;
          max-width: 960px;
          min-height: 500px;
          background: rgba(14, 14, 20, 0.72);
          backdrop-filter: blur(24px) saturate(160%);
          -webkit-backdrop-filter: blur(24px) saturate(160%);
          border-radius: 28px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          box-shadow: 0 30px 70px -15px rgba(0, 0, 0, 0.85),
                      0 0 40px rgba(185, 28, 28, 0.16),
                      inset 0 1px 0 rgba(255, 255, 255, 0.15);
          display: grid;
          grid-template-columns: 41% 59%;
          overflow: hidden;
          position: relative;
          z-index: 2;
        }

        /* Left Hero Panel: Dark Crimson with Outward Convex Curve */
        .login-left-panel {
          background: linear-gradient(145deg, #b91c1c 0%, #991b1b 50%, #580c0c 100%);
          border-top-right-radius: 125px;
          border-bottom-right-radius: 125px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3rem 2.25rem;
          color: #ffffff;
          text-align: center;
          position: relative;
          z-index: 2;
          box-shadow: 6px 0 25px rgba(0, 0, 0, 0.35), inset 0 0 35px rgba(0, 0, 0, 0.3);
        }

        .login-left-title {
          font-size: 2rem;
          font-weight: 800;
          color: #ffffff;
          margin: 0 0 0.5rem 0;
          letter-spacing: -0.02em;
          line-height: 1.2;
          text-shadow: 0 2px 10px rgba(0, 0, 0, 0.4);
        }

        .login-left-subtitle {
          font-size: 0.9rem;
          color: rgba(255, 255, 255, 0.9);
          margin: 0 0 1.75rem 0;
          font-weight: 400;
          line-height: 1.4;
        }

        .login-outline-btn {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          border: 1.5px solid rgba(255, 255, 255, 0.9);
          color: #ffffff;
          padding: 0.58rem 2.6rem;
          border-radius: 9px;
          font-size: 0.88rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
          letter-spacing: 0.02em;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.2);
        }

        .login-outline-btn:hover {
          background: #ffffff;
          color: #991b1b;
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
        }

        /* Right Panel: Spacious Dark Glass Aesthetic */
        .login-right-panel {
          background: transparent;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3rem 3.25rem;
          position: relative;
          z-index: 1;
        }

        .login-form-inner {
          width: 100%;
          max-width: 370px;
          display: flex;
          flex-direction: column;
        }

        .login-heading {
          font-size: 2rem;
          font-weight: 800;
          color: #ffffff;
          margin: 0 0 1.6rem 0;
          text-align: center;
          letter-spacing: -0.02em;
          text-shadow: 0 2px 12px rgba(0, 0, 0, 0.5);
        }

        .login-input-group {
          position: relative;
          width: 100%;
          margin-bottom: 0.95rem;
        }

        .login-input {
          width: 100%;
          height: 46px;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 10px;
          padding: 0 2.8rem 0 1.15rem;
          font-size: 0.92rem;
          color: #ffffff;
          outline: none;
          box-sizing: border-box;
          transition: all 0.2s ease;
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
        }

        .login-input::placeholder {
          color: rgba(255, 255, 255, 0.42);
        }

        .login-input:focus {
          background: rgba(255, 255, 255, 0.1);
          border-color: #ef4444;
          box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.25);
        }

        .login-input-icon {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: #ef4444;
          pointer-events: none;
          display: flex;
          align-items: center;
          justify-content: center;
          filter: drop-shadow(0 0 6px rgba(239, 68, 68, 0.3));
        }

        .login-input-icon-btn {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: #ef4444;
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: opacity 0.15s ease;
          filter: drop-shadow(0 0 6px rgba(239, 68, 68, 0.3));
        }

        .login-input-icon-btn:hover {
          opacity: 0.8;
        }

        .login-forgot-link {
          background: none;
          border: none;
          color: #9ca3af;
          font-size: 0.8rem;
          font-weight: 500;
          cursor: pointer;
          padding: 0;
          margin: 0.2rem 0 1.3rem 0;
          text-align: center;
          transition: color 0.15s ease;
          display: block;
          width: 100%;
        }

        .login-forgot-link:hover {
          color: #f87171;
          text-decoration: underline;
        }

        .login-submit-btn {
          width: 100%;
          height: 46px;
          background: linear-gradient(135deg, #dc2626 0%, #b91c1c 60%, #991b1b 100%);
          color: #ffffff;
          border: none;
          border-radius: 10px;
          font-size: 0.96rem;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 4px 18px rgba(220, 38, 38, 0.45);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          transition: all 0.2s ease;
        }

        .login-submit-btn:hover:not(:disabled) {
          filter: brightness(1.12);
          transform: translateY(-1px);
          box-shadow: 0 6px 24px rgba(220, 38, 38, 0.6);
        }

        .login-submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .login-error-alert {
          background: rgba(220, 38, 38, 0.18);
          border: 1px solid rgba(239, 68, 68, 0.4);
          color: #fca5a5;
          font-size: 0.78rem;
          padding: 0.55rem 0.75rem;
          border-radius: 8px;
          margin-bottom: 0.85rem;
          display: flex;
          align-items: center;
          gap: 0.45rem;
        }

        .login-role-pills {
          display: flex;
          gap: 0.6rem;
          margin-bottom: 0.9rem;
        }

        .login-role-pill {
          flex: 1;
          height: 38px;
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          background: rgba(255, 255, 255, 0.04);
          color: #9ca3af;
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.4rem;
          transition: all 0.2s ease;
        }

        .login-role-pill.active {
          border-color: #ef4444;
          background: rgba(220, 38, 38, 0.2);
          color: #ffffff;
          font-weight: 700;
          box-shadow: 0 0 14px rgba(220, 38, 38, 0.25);
        }

        /* Mobile Responsiveness */
        @media (max-width: 820px) {
          .login-card-container {
            grid-template-columns: 1fr;
            min-height: auto;
            border-radius: 22px;
          }

          .login-left-panel {
            border-top-right-radius: 0;
            border-bottom-right-radius: 0;
            border-bottom-left-radius: 45px;
            border-bottom-right-radius: 45px;
            padding: 2.25rem 1.75rem;
          }

          .login-right-panel {
            padding: 2.5rem 1.75rem;
          }
        }
      `}</style>

      {/* Ambient Blur Glow Orbs */}
      <div className="login-ambient-orb-1" />
      <div className="login-ambient-orb-2" />

      {/* Return to Public Home or Active Dashboard Link */}
      <button
        type="button"
        className="login-back-btn"
        onClick={() => {
          if (currentUser) {
            setActiveTab(currentUser.role === 'admin' ? 'dashboard' : currentUser.role === 'driver' ? 'driver' : 'shipments');
          } else {
            setActiveTab('landing');
          }
        }}
        title="Return to AeroDispatch Dashboard or Homepage"
      >
        <span>← {currentUser ? 'Return to Dashboard' : 'AeroDispatch Home'}</span>
      </button>

      {/* 1.2s Skeleton loading or Glassmorphic Centered Card */}
      {isSkeletonLoading ? (
        <SkeletonRegisterCard />
      ) : (
        <div className="login-card-container">
        {/* =========================================================================
            LEFT PANEL: Crimson Red Gradient with Curved Outward Sweep
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
              <p className="login-left-subtitle">Back to registration?</p>
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
            RIGHT PANEL: Dark Glass Login Form
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
                <AlertCircle size={15} style={{ flexShrink: 0 }} />
                <span>{authError}</span>
              </div>
            )}

            {/* 1. OTP Verification Form */}
            {authMode === 'verify-otp' ? (
              <form onSubmit={handleVerifyOtpSubmit}>
                <div style={{ textAlign: 'center', marginBottom: '1.35rem', color: '#9ca3af', fontSize: '0.86rem', lineHeight: 1.5 }}>
                  <span>A real 6-digit verification passcode has been dispatched to:</span>
                  <br />
                  <strong style={{ color: '#ffffff', fontSize: '1rem', display: 'inline-block', margin: '0.4rem 0' }}>{otpEmail}</strong>
                  <div style={{ fontSize: '0.78rem', color: '#6b7280' }}>
                    Please check your email inbox (and spam/junk folder) for the verification message from <strong>AeroDispatch</strong>.
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginBottom: '1.35rem' }}>
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
                        width: '42px',
                        height: '48px',
                        fontSize: '1.25rem',
                        fontWeight: 700,
                        textAlign: 'center',
                        background: 'rgba(255, 255, 255, 0.06)',
                        border: otpDigits[idx] ? '2px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.15)',
                        borderRadius: '10px',
                        color: '#ffffff',
                        outline: 'none'
                      }}
                    />
                  ))}
                </div>

                <div style={{ textAlign: 'center', fontSize: '0.8rem', color: '#9ca3af', marginBottom: '1.35rem' }}>
                  {otpCountdown > 0 ? (
                    <span>Resend code in <strong style={{ color: '#ef4444' }}>{otpCountdown}s</strong></span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendCode}
                      style={{ background: 'none', border: 'none', color: '#ef4444', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
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
              /* 2. Forgot Password Success Display (Real Request Confirmation) */
              <div style={{ textAlign: 'center' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.18)', border: '1px solid rgba(239, 68, 68, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.95rem' }}>
                  <CheckCircle2 size={26} color="#ef4444" />
                </div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff', margin: '0 0 0.5rem 0' }}>
                  Request Sent
                </h3>
                <p style={{ color: '#9ca3af', fontSize: '0.84rem', margin: '0 0 1.5rem 0', lineHeight: 1.5 }}>
                  A password reset request has been dispatched to:
                  <br />
                  <strong style={{ color: '#ffffff', fontSize: '0.9rem' }}>{dispatchedEmail}</strong>
                  <br />
                  <span style={{ fontSize: '0.78rem', color: '#6b7280', display: 'inline-block', marginTop: '0.4rem' }}>
                    Please check your email inbox and follow the verification instructions.
                  </span>
                </p>

                <button
                  type="button"
                  className="login-submit-btn"
                  onClick={() => {
                    setForgotSuccess(false);
                    setAuthMode('login');
                  }}
                >
                  Return to Login
                </button>
              </div>
            ) : (
              /* 3. Main Login / Register / Forgot Form */
              <form onSubmit={handleSubmit}>
                {/* Role Persona Picker (Customer vs Driver) */}
                {authMode !== 'forgot' && (
                  <div className="login-role-pills">
                    <button
                      type="button"
                      className={`login-role-pill ${authRole === 'customer' ? 'active' : ''}`}
                      onClick={() => setAuthRole('customer')}
                    >
                      <Building2 size={14} />
                      <span>Customer Portal</span>
                    </button>
                    <button
                      type="button"
                      className={`login-role-pill ${authRole === 'driver' ? 'active' : ''}`}
                      onClick={() => setAuthRole('driver')}
                    >
                      <Truck size={14} />
                      <span>Delivery Captain</span>
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
                      <User size={17} />
                    </div>
                  </div>
                )}

                {/* Mobile Phone Field (Register Mode Only) */}
                {authMode === 'register' && (
                  <div className="login-input-group">
                    <input
                      type="tel"
                      className="login-input"
                      placeholder="Mobile Phone Number"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                    />
                    <div className="login-input-icon">
                      <Phone size={17} />
                    </div>
                  </div>
                )}

                {/* Email Address Field */}
                <div className="login-input-group">
                  <input
                    id="auth-username-input"
                    type={authMode === 'login' ? 'text' : 'email'}
                    className="login-input"
                    placeholder={
                      authMode === 'register' 
                        ? 'Email Address (e.g. yourname@gmail.com)' 
                        : authMode === 'forgot' 
                        ? 'Enter Registered Email' 
                        : 'Email or Username'
                    }
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  <div className="login-input-icon">
                    {authMode === 'login' ? <User size={17} /> : <Mail size={17} />}
                  </div>
                </div>

                {/* Password Field */}
                {authMode !== 'forgot' && (
                  <>
                    <div className="login-input-group" style={{ marginBottom: authMode === 'register' ? '0.25rem' : '0.45rem' }}>
                      <input
                        id="auth-password-input"
                        type={showPassword ? 'text' : 'password'}
                        className="login-input"
                        placeholder={authMode === 'register' ? 'Create Password (min. 8 chars with symbols)' : 'Password'}
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
                        {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                      </button>
                    </div>
                    {authMode === 'register' && (
                      <div style={{ fontSize: '0.72rem', color: '#9ca3af', marginBottom: '1rem', paddingLeft: '6px' }}>
                        Must be at least 8 characters and include uppercase, lowercase, numbers &amp; special symbols.
                      </div>
                    )}
                  </>
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

                {/* Action Submit Button */}
                <button
                  id="auth-submit-btn"
                  type="submit"
                  disabled={isSubmitting}
                  className="login-submit-btn"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw size={15} className="spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <span>
                      {authMode === 'register' 
                        ? 'Register' 
                        : authMode === 'forgot' 
                        ? 'Send request' 
                        : 'Login'}
                    </span>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
      )}
    </div>
  );
}
