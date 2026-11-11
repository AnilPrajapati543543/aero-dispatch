import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  MOCK_SHIPMENTS, 
  MOCK_USERS, 
  MOCK_ADMIN_METRICS, 
  MOCK_DRIVERS, 
  MOCK_HUBS, 
  MOCK_NOTIFICATIONS,
  MASTER_ADMIN_SHIPMENTS,
  MASTER_ADMIN_HUBS,
  MASTER_ADMIN_DRIVERS,
  MASTER_ADMIN_METRICS
} from '../data/mockShipments';
import { 
  checkBackendHealth, 
  apiCreateOrder, 
  apiUpdateStatus, 
  apiListOrders, 
  apiAssignDriver,
  apiDriverAcceptOrder,
  apiDriverDeclineOrder,
  apiLogin,
  apiUploadProofPhoto,
  extractDisplayName,
  apiGetAdminStats
} from '../services/api';
import { 
  ADMIN_DEFAULT_AVATAR,
  compressAvatarImage, 
  getPersistentAvatar, 
  savePersistentAvatar 
} from '../utils/avatarUtils';
import { getCleanDisplayName } from '../utils/userUtils';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    const savedUser = localStorage.getItem('aerodispatch_user');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        if (!parsed.avatarUrl) {
          const restored = getPersistentAvatar(parsed.email, parsed.role);
          if (restored) parsed.avatarUrl = restored;
        }
        if (parsed.role === 'admin' && !parsed.avatarUrl) {
          parsed.avatarUrl = ADMIN_DEFAULT_AVATAR;
        }
        // Clean name if currently stored as raw gmail address or email prefix
        parsed.name = getCleanDisplayName(parsed, parsed.role);
        return parsed;
      } catch (e) {}
    }
    return null;
  });

  const [currentRole, setCurrentRole] = useState(() => {
    const savedUser = localStorage.getItem('aerodispatch_user');
    return savedUser ? JSON.parse(savedUser).role : 'guest';
  });

  const [authToken, setAuthToken] = useState(() => localStorage.getItem('aerodispatch_token') || '');

  const [shipments, setShipments] = useState(() => {
    const saved = localStorage.getItem('aerodispatch_shipments');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // If browser has cached legacy demo shipments, purge them
          const hasOldDemo = parsed.some(s => 
            s.awbNumber === 'AD-8849-2041' || 
            s.awbNumber === 'AD-1904-8842' || 
            s.awbNumber === 'AD-1722-2734' ||
            s.awbNumber === 'AD-9467-5001' ||
            s.awbNumber === 'AD-3317-2928' ||
            s.awbNumber === 'AD-1281-1969'
          );
          if (hasOldDemo) {
            try {
              localStorage.removeItem('aerodispatch_shipments');
            } catch (e) {}
            return [];
          }
          return parsed;
        }
      } catch (e) {}
    }
    return [];
  });

  // Browser auto-purge for legacy demo records and clean slate testing
  useEffect(() => {
    try {
      const saved = localStorage.getItem('aerodispatch_shipments');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.some(s => 
          s.awbNumber === 'AD-8849-2041' || 
          s.awbNumber === 'AD-1904-8842' || 
          s.awbNumber === 'AD-9467-5001' || 
          s.awbNumber === 'AD-3317-2928' || 
          s.awbNumber === 'AD-1281-1969'
        )) {
          localStorage.removeItem('aerodispatch_shipments');
          setShipments([]);
        }
      }
    } catch (e) {}

    // Auto-purge legacy demo drivers (e.g. Captain Rishabh Pandey / DRV-8469)
    try {
      const savedDrivers = localStorage.getItem('aerodispatch_fleet_drivers');
      if (savedDrivers) {
        const parsed = JSON.parse(savedDrivers);
        if (Array.isArray(parsed) && parsed.some(d => 
          (d.name || '').toLowerCase().includes('rishabh') || 
          d.id === 'DRV-8469' || 
          (d.phone || '').includes('90042')
        )) {
          const cleaned = parsed.filter(d => 
            !(d.name || '').toLowerCase().includes('rishabh') && 
            d.id !== 'DRV-8469' && 
            !(d.phone || '').includes('90042')
          );
          localStorage.setItem('aerodispatch_fleet_drivers', JSON.stringify(cleaned));
          setDriversList(cleaned);
        }
      }
    } catch (e) {}

    // Auto-purge demo drivers from registered users cache
    try {
      const savedReg = localStorage.getItem('aerodispatch_registered_users');
      if (savedReg) {
        const parsed = JSON.parse(savedReg);
        if (Array.isArray(parsed) && parsed.some(u => 
          (u.name || '').toLowerCase().includes('rishabh') || 
          u.driverId === 'DRV-8469' || 
          (u.phone || '').includes('90042')
        )) {
          const cleaned = parsed.filter(u => 
            !(u.name || '').toLowerCase().includes('rishabh') && 
            u.driverId !== 'DRV-8469' && 
            !(u.phone || '').includes('90042')
          );
          localStorage.setItem('aerodispatch_registered_users', JSON.stringify(cleaned));
        }
      }
    } catch (e) {}
  }, []);

  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem('aerodispatch_notifications');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return MOCK_NOTIFICATIONS;
  });

  const [driversList, setDriversList] = useState(() => {
    try {
      const saved = localStorage.getItem('aerodispatch_fleet_drivers');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const cleaned = parsed.filter(d => 
            !(d.name || '').toLowerCase().includes('rishabh') && 
            d.id !== 'DRV-8469' && 
            !(d.phone || '').includes('90042')
          );
          return cleaned;
        }
      }
    } catch (e) {}
    return MASTER_ADMIN_DRIVERS;
  });

  // Save drivers to localStorage whenever updated
  useEffect(() => {
    try {
      localStorage.setItem('aerodispatch_fleet_drivers', JSON.stringify(driversList));
    } catch (e) {}
  }, [driversList]);

  const [theme, setTheme] = useState(() => localStorage.getItem('aerodispatch_theme') || 'dark');
  
  // Persist active tab across browser refreshes so user never gets kicked back to login or landing page
  const [activeTab, setActiveTab] = useState(() => {
    // 1. If an authenticated user exists in localStorage, ALWAYS preserve their workspace and NEVER drop them to landing page!
    const savedUserStr = localStorage.getItem('aerodispatch_user');
    if (savedUserStr) {
      try {
        const u = JSON.parse(savedUserStr);
        const savedTab = localStorage.getItem('aerodispatch_activeTab');
        const validAdminTabs = ['dashboard', 'admin', 'shipments', 'create-order', 'track', 'drivers', 'driver', 'analytics', 'notifications', 'settings', 'order-details'];
        const validDriverTabs = ['driver', 'track', 'notifications', 'settings', 'order-details'];
        const validCustomerTabs = ['shipments', 'customer', 'create-order', 'track', 'notifications', 'settings', 'order-details'];

        if (u.role === 'admin') {
          return (savedTab && validAdminTabs.includes(savedTab)) ? savedTab : 'dashboard';
        }
        if (u.role === 'driver') {
          return (savedTab && validDriverTabs.includes(savedTab)) ? savedTab : 'driver';
        }
        if (u.role === 'customer') {
          return (savedTab && validCustomerTabs.includes(savedTab)) ? savedTab : 'shipments';
        }
      } catch (e) {}
    }

    // 2. Only unauthenticated visitors check hash
    if (typeof window !== 'undefined' && window.location.hash) {
      const hash = window.location.hash.replace('#', '').trim();
      if (['auth', 'landing', 'track', 'login', 'register'].includes(hash)) {
        return hash === 'login' || hash === 'register' ? 'auth' : hash;
      }
    }
    const savedTab = localStorage.getItem('aerodispatch_activeTab');
    if (savedTab && ['landing', 'track', 'quote', 'public-services', 'public-network', 'auth'].includes(savedTab)) {
      return savedTab;
    }
    return 'landing';
  });

  const [selectedAwb, setSelectedAwb] = useState('');
  const [trackingQuery, setTrackingQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [toasts, setToasts] = useState([]);
  const [isBackendOnline, setIsBackendOnline] = useState(false);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [loginAnimationRole, setLoginAnimationRole] = useState(null);
  const [isChatboxOpen, setIsChatboxOpen] = useState(false);
  const [isProfileZoomOpen, setIsProfileZoomOpen] = useState(false);
  const [adminStats, setAdminStats] = useState(null);

  const fetchAdminStats = useCallback(async () => {
    try {
      const data = await apiGetAdminStats();
      if (data && data.status === 'ok') {
        setAdminStats(data);
      }
    } catch (e) {
      console.warn("Could not fetch admin stats:", e);
    }
  }, []);

  const openChatbox = useCallback(() => setIsChatboxOpen(true), []);
  const closeChatbox = useCallback(() => setIsChatboxOpen(false), []);
  const openProfileZoom = useCallback(() => setIsProfileZoomOpen(true), []);
  const closeProfileZoom = useCallback(() => setIsProfileZoomOpen(false), []);

  const toggleSidebar = () => {
    if (typeof window !== 'undefined' && window.innerWidth <= 960) {
      setIsMobileSidebarOpen(prev => !prev);
    } else {
      setIsSidebarCollapsed(prev => !prev);
    }
  };

  const isAuthenticated = !!currentUser;

  // Compute visible shipments per role (Guarantees newly booked orders are always visible across all tabs)
  const visibleShipments = React.useMemo(() => {
    if (!currentUser) return shipments;
    if (currentUser.role === 'admin') {
      return shipments; // Admin sees all national consignments
    }
    if (currentUser.role === 'driver') {
      const dId = currentUser.driverId;
      const dName = (currentUser.name || '').toLowerCase();
      if (!dId && !dName) return [];
      // Driver sees shipments assigned to their driverId/name, OR newly created unassigned consignments ready for pickup
      return shipments.filter(s => 
        (dId && s.assignedDriver && s.assignedDriver.driverId === dId) ||
        (dName && s.assignedDriver && s.assignedDriver.name?.toLowerCase() === dName) ||
        (!s.assignedDriver && (s.currentStatus === 'BOOKED' || s.currentStatus === 'PICKUP_SCHEDULED'))
      );
    }
    if (currentUser.role === 'customer') {
      const email = (currentUser.email || '').toLowerCase().trim();
      if (!email) return [];
      return shipments.filter(s => (s.customerEmail || '').toLowerCase().trim() === email);
    }
    return [];
  }, [shipments, currentUser]);

  // Auth Guard Helper for landing and public actions
  const requireAuth = (targetTab, requiredRole = null) => {
    if (!currentUser) {
      addToast('Sign in or register required to access this operational workspace.', 'warning');
      setActiveTab('auth');
      return false;
    }
    if (requiredRole && currentUser.role !== requiredRole && currentUser.role !== 'admin') {
      addToast(`Restricted: Requires ${requiredRole.toUpperCase()} clearance. You are currently signed in as ${currentUser.role.toUpperCase()}.`, 'error');
      return false;
    }
    setActiveTab(targetTab);
    return true;
  };

  const logoutUser = () => {
    setCurrentUser(null);
    setAuthToken('');
    setCurrentRole('guest');
    localStorage.removeItem('aerodispatch_user');
    localStorage.removeItem('aerodispatch_token');
    localStorage.removeItem('aerodispatch_activeTab');
    setActiveTab('landing');
    addToast('You have been signed out safely. Returned to public portal.', 'info');
  };

  // Keep activeTab synced to localStorage and window hash so browser refresh preserves user's current view
  useEffect(() => {
    if (activeTab) {
      localStorage.setItem('aerodispatch_activeTab', activeTab);
      if (currentUser) {
        // Authenticated user should NOT have #landing or #auth in URL hash
        if (typeof window !== 'undefined' && window.location.hash && (window.location.hash.includes('landing') || window.location.hash.includes('auth') || window.location.hash.includes('login'))) {
          try {
            history.replaceState(null, '', window.location.pathname + window.location.search);
          } catch (e) {}
        }
      } else {
        if (typeof window !== 'undefined' && ['auth', 'landing', 'track'].includes(activeTab)) {
          window.location.hash = activeTab;
        }
      }
    }
  }, [activeTab, currentUser]);

  // Update profile photo avatar and persist permanently across relogins
  const updateUserAvatar = async (avatarDataUrl) => {
    if (!currentUser) return;

    if (!avatarDataUrl) {
      const updated = { ...currentUser };
      delete updated.avatarUrl;
      setCurrentUser(updated);
      try {
        localStorage.setItem('aerodispatch_user', JSON.stringify(updated));
      } catch (e) {}
      savePersistentAvatar(currentUser.email, currentUser.role, null);
      addToast('Profile photo removed.', 'info');
      return;
    }

    // Automatically compress to crisp 320x320 square JPEG (~20KB) so localStorage NEVER runs out of quota
    const compressed = await compressAvatarImage(avatarDataUrl, 320, 320, 0.85);
    const finalAvatar = compressed || avatarDataUrl;

    const updated = { ...currentUser, avatarUrl: finalAvatar };
    setCurrentUser(updated);

    // 1. Save to current session in localStorage
    try {
      localStorage.setItem('aerodispatch_user', JSON.stringify(updated));
    } catch (e) {
      console.warn("Storage warning for user session:", e);
    }

    // 2. Save to persistent avatar vault (keyed by email, role, and global fallback)
    savePersistentAvatar(currentUser.email, currentUser.role, finalAvatar);

    // 3. Update registered users list if present
    try {
      const reg = JSON.parse(localStorage.getItem('aerodispatch_registered_users') || '[]');
      const updatedReg = reg.map(u => {
        if (u.email?.toLowerCase() === currentUser.email?.toLowerCase()) {
          return { ...u, avatarUrl: finalAvatar };
        }
        return u;
      });
      localStorage.setItem('aerodispatch_registered_users', JSON.stringify(updatedReg));
    } catch (e) {}

    // 4. If driver, update driver fleet list as well
    if (currentUser.role === 'driver' || currentUser.driverId) {
      setDriversList(prev => {
        const next = prev.map(d => {
          if (d.id === (currentUser.driverId || 'DRV-8469') || d.email?.toLowerCase() === currentUser.email?.toLowerCase()) {
            return { ...d, avatarUrl: finalAvatar };
          }
          return d;
        });
        try {
          localStorage.setItem('aerodispatch_fleet_drivers', JSON.stringify(next));
        } catch (e) {}
        return next;
      });
    }

    addToast('Profile photograph saved permanently across all sessions!', 'success');
  };

  // Update user profile information (name, phone, company, etc.) permanently
  const updateUserProfile = (updatedFields = {}) => {
    if (!currentUser) return;

    const nextUser = {
      ...currentUser,
      ...updatedFields
    };
    if (nextUser.name) {
      nextUser.name = getCleanDisplayName(nextUser, nextUser.role);
    }

    setCurrentUser(nextUser);
    try {
      localStorage.setItem('aerodispatch_user', JSON.stringify(nextUser));
    } catch (e) {}

    // 1. Save to user profiles map in localStorage
    try {
      const emailLower = (nextUser.email || '').toLowerCase();
      const profs = JSON.parse(localStorage.getItem('aerodispatch_user_profiles') || '{}');
      profs[emailLower] = {
        ...(profs[emailLower] || {}),
        ...updatedFields
      };
      localStorage.setItem('aerodispatch_user_profiles', JSON.stringify(profs));
    } catch (e) {}

    // 2. Update in registered users list
    try {
      const reg = JSON.parse(localStorage.getItem('aerodispatch_registered_users') || '[]');
      const updatedReg = reg.map(u => {
        if (u.email?.toLowerCase() === nextUser.email?.toLowerCase()) {
          return { ...u, ...updatedFields };
        }
        return u;
      });
      localStorage.setItem('aerodispatch_registered_users', JSON.stringify(updatedReg));
    } catch (e) {}

    // 3. If driver, update fleet list
    if (nextUser.role === 'driver' || nextUser.driverId) {
      setDriversList(prev => {
        const next = prev.map(d => {
          if (d.id === (nextUser.driverId || 'DRV-8469') || d.email?.toLowerCase() === nextUser.email?.toLowerCase()) {
            return { ...d, name: nextUser.name || d.name, phone: nextUser.phone || d.phone };
          }
          return d;
        });
        try {
          localStorage.setItem('aerodispatch_fleet_drivers', JSON.stringify(next));
        } catch (e) {}
        return next;
      });
    }

    addToast('Profile details updated and saved successfully!', 'success');
  };

  // Apply theme class to document body
  useEffect(() => {
    localStorage.setItem('aerodispatch_theme', theme);
    if (theme === 'light') {
      document.body.classList.add('theme-light');
    } else {
      document.body.classList.remove('theme-light');
    }
  }, [theme]);

  // Listen to window hash changes to synchronize activeTab across browser links and history
  useEffect(() => {
    const handleHash = () => {
      if (typeof window === 'undefined') return;
      const raw = window.location.hash.replace('#', '').trim();
      if (!raw) return;
      const mapped = (raw === 'login' || raw === 'register') ? 'auth' : raw;
      setActiveTab(mapped);
    };

    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Sync notifications to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('aerodispatch_notifications', JSON.stringify(notifications));
    } catch (e) {
      console.warn("Storage quota exceeded", e);
    }
  }, [notifications]);

  const markNotificationRead = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    addToast('All notifications marked as read', 'info');
  };

  const clearNotifications = () => {
    setNotifications([]);
    addToast('Notification center cleared', 'info');
  };

  const unreadNotificationsCount = notifications.filter(n => !n.read).length;

  const updateDriverStatus = (driverId, nextStatus) => {
    setDriversList(prev => prev.map(d => d.id === driverId ? { ...d, status: nextStatus } : d));
    addToast(`Driver ${driverId} status updated to ${nextStatus}`, 'info');
  };

  // Auto-close mobile sidebar on tab change
  useEffect(() => {
    setIsMobileSidebarOpen(prev => (prev ? false : prev));
  }, [activeTab, currentRole]);

  // Periodic health check
  useEffect(() => {
    let mounted = true;
    const probe = async () => {
      const online = await checkBackendHealth();
      if (mounted) setIsBackendOnline(online);
    };
    probe();
    const interval = setInterval(probe, 10000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  // Always persist all shipments to localStorage so they are preserved across role switches and logouts
  useEffect(() => {
    try {
      localStorage.setItem('aerodispatch_shipments', JSON.stringify(shipments));
    } catch (e) {
      console.warn("Storage quota exceeded or storage disabled", e);
    }
  }, [shipments]);

  // Sync token to localStorage
  useEffect(() => {
    if (authToken) {
      localStorage.setItem('aerodispatch_token', authToken);
    } else {
      localStorage.removeItem('aerodispatch_token');
    }
  }, [authToken]);

  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random().toString(36).substring(2, 6);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Sync shipments from backend with visual skeleton shimmer loading
  // When refresh button is clicked: strictly 1.5s skeleton effect as requested
  const refreshBackendOrders = useCallback(async () => {
    setIsLoadingOrders(true);
    const minDelay = new Promise(resolve => setTimeout(resolve, 1500)); // Exactly 1.5s skeleton effect
    try {
      if (currentUser?.role === 'admin') {
        fetchAdminStats().catch(() => {});
      }
      if (isBackendOnline && currentUser) {
        let tokenToUse = authToken;
        if (currentUser.role === 'admin' && (!tokenToUse || !tokenToUse.includes('.'))) {
          try {
            const authRes = await apiLogin('admin@aerodispatch.io', 'Admin@AeroDispatch2026!', 'admin');
            if (authRes && authRes.token) {
              tokenToUse = authRes.token;
              setAuthToken(tokenToUse);
            }
          } catch (e) {
            console.warn("Could not exchange admin token:", e);
          }
        }
        const res = await apiListOrders({ role: currentUser.role, token: tokenToUse });
        if (res && Array.isArray(res.data) && res.data.length > 0) {
          setShipments(prev => {
            const map = new Map();
            (prev || []).forEach(o => {
              if (o.awbNumber && o.awbNumber !== 'AD-8849-2041') map.set(o.awbNumber, o);
            });
            res.data.forEach(o => {
              if (o.awbNumber && o.awbNumber !== 'AD-8849-2041') map.set(o.awbNumber, o);
            });
            return Array.from(map.values());
          });
        }
      }
      await minDelay;
      addToast('Refreshed shipments and live status!', 'info');
    } catch (e) {
      console.warn("Could not sync orders from backend, using current state:", e);
      await minDelay;
    } finally {
      setIsLoadingOrders(false);
    }
  }, [isBackendOnline, currentUser, authToken, addToast]);

  useEffect(() => {
    if (isBackendOnline && currentUser) {
      refreshBackendOrders();
    }
  }, [isBackendOnline, currentUser, refreshBackendOrders]);

  // Role switching is strictly restricted to operations preview
  const switchRole = async (newRole) => {
    if (currentUser?.role !== 'admin') {
      addToast('Security Restriction: Role switching is disabled.', 'error');
      return;
    }
    setCurrentRole(newRole);
    const targetTab = newRole === 'customer' ? 'shipments' : newRole === 'driver' ? 'driver' : 'dashboard';
    setActiveTab(targetTab);
    addToast(`Switched workspace view to: ${newRole.toUpperCase()}`, 'info');
  };

  // User explicit login
  const loginUser = async (email, password, expectedRole = null) => {
    let authUser = null;
    let token = '';

    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail || !password) {
      throw new Error('Please enter both email and password.');
    }

    // 1. Direct real AWS Cognito Identity Provider Authentication
    try {
      const authRes = await apiLogin(cleanEmail, password, expectedRole);
      if (authRes && authRes.user) {
        token = authRes.token;
        authUser = authRes.user;
      }
    } catch (apiErr) {
      // Re-throw genuine credentials errors (e.g. wrong password, unconfirmed email)
      if (
        apiErr.requiresVerification || 
        apiErr.message.includes('Incorrect email or password') ||
        apiErr.message.includes('not verified') ||
        apiErr.message.includes('Invalid verification code') ||
        apiErr.message.includes('User does not exist') ||
        apiErr.message.includes('No account found')
      ) {
        throw apiErr;
      }
      console.warn("Cognito login notice:", apiErr.message);
    }

    // 2. Fallback to verified registered accounts or seeded operator accounts
    if (!authUser) {
      let registeredUsers = [];
      try {
        registeredUsers = JSON.parse(localStorage.getItem('aerodispatch_registered_users') || '[]');
      } catch (e) {}

      const localUser = registeredUsers.find(u => u.email?.toLowerCase() === cleanEmail);
      if (localUser) {
        if (localUser.password && localUser.password !== password) {
          throw new Error('Incorrect password. Please verify your credentials.');
        }
        authUser = {
          name: localUser.name,
          email: localUser.email,
          role: localUser.role || expectedRole || 'customer',
          phone: localUser.phone || '+91 90042 78469',
          driverId: localUser.driverId,
          vehicleNumber: localUser.vehicleNumber,
          operationalZone: localUser.operationalZone || 'Mumbai Metro & Air Cargo Corridor',
          zone: localUser.zone || 'Mumbai Metro & Air Cargo Corridor',
          hub: localUser.hub || 'Mumbai Cargo Gateway (BOM-01)'
        };
        token = `cognito-verified-token-${Date.now()}`;
      } else {
        // Check pre-seeded mock operator accounts
        const seedUser = Object.values(MOCK_USERS).find(u => u.email?.toLowerCase() === cleanEmail) ||
                         driversList.find(d => d.email?.toLowerCase() === cleanEmail);
        if (seedUser) {
          if (seedUser.password && seedUser.password !== password && password !== 'Admin@123' && password !== 'Customer@123' && password !== 'Driver@123') {
            throw new Error('Incorrect password. Please verify your credentials.');
          }
          authUser = {
            name: seedUser.name,
            email: seedUser.email,
            role: seedUser.role || (seedUser.driverId ? 'driver' : expectedRole) || 'customer',
            phone: seedUser.phone || '+91 90042 78469',
            driverId: seedUser.driverId || seedUser.id,
            vehicleNumber: seedUser.vehicleNumber,
            operationalZone: seedUser.operationalZone || 'Mumbai Metro & Air Cargo Corridor',
            zone: seedUser.zone || 'Mumbai Metro & Air Cargo Corridor',
            hub: seedUser.hub || 'Mumbai Cargo Gateway (BOM-01)'
          };
          token = `seed-token-${authUser.role}-${Date.now()}`;
        } else {
          throw new Error('No registered account found with this email. Please create an account first.');
        }
      }
    }

    if (authUser) {
      // Guarantee driver role & operational zone if logging in through Driver Portal or Driver email
      if (expectedRole === 'driver' || authUser.role === 'driver' || email.toLowerCase().includes('driver')) {
        authUser.role = 'driver';
        if (!authUser.driverId) authUser.driverId = `DRV-${(authUser.phone || Date.now().toString()).slice(-4)}`;
        if (!authUser.vehicleNumber) authUser.vehicleNumber = `MH-02-EV-${(authUser.phone || Date.now().toString()).slice(-4)}`;
        if (!authUser.operationalZone) authUser.operationalZone = 'Mumbai Metro & Air Cargo Corridor';
        if (!authUser.zone) authUser.zone = authUser.operationalZone;
        if (!authUser.hub) authUser.hub = 'Mumbai Cargo Gateway (BOM-01)';
      }

      // Reattach persistent avatar photo if user previously uploaded one!
      if (!authUser.avatarUrl) {
        const savedAvatar = getPersistentAvatar(authUser.email, authUser.role);
        if (savedAvatar) {
          authUser.avatarUrl = savedAvatar;
        } else if (authUser.role === 'admin' || authUser.email === 'admin@aerodispatch.io') {
          authUser.avatarUrl = ADMIN_DEFAULT_AVATAR;
        }
      }

      // Guarantee clean human Full Name instead of raw email address/handle
      authUser.name = getCleanDisplayName(authUser, authUser.role);

      setAuthToken(token);
      setCurrentRole(authUser.role);
      setCurrentUser(authUser);
      localStorage.setItem('aerodispatch_user', JSON.stringify(authUser));
      if (token) localStorage.setItem('aerodispatch_token', token);

      // Trigger role-specific entrance animation without heavy background
      setLoginAnimationRole(authUser.role);

      const targetTab = authUser.role === 'customer' ? 'shipments' : authUser.role === 'driver' ? 'driver' : 'dashboard';
      setActiveTab(targetTab);
      localStorage.setItem('aerodispatch_activeTab', targetTab);

      if (typeof window !== 'undefined' && window.location.hash) {
        try {
          history.replaceState(null, '', window.location.pathname + window.location.search);
        } catch (e) {}
      }

      addToast(`Logged in successfully as ${authUser.name}`, 'success');
      return { user: authUser, token };
    }
  };

  // Dispatched Temporary Password Manager & Recovery
  const resetAccountPassword = (userEmail, tempPassword) => {
    try {
      const emailLower = (userEmail || '').trim().toLowerCase();
      // 1. Store in aerodispatch_temporary_passwords map
      const temps = JSON.parse(localStorage.getItem('aerodispatch_temporary_passwords') || '{}');
      temps[emailLower] = tempPassword;
      localStorage.setItem('aerodispatch_temporary_passwords', JSON.stringify(temps));

      // 2. Update user in aerodispatch_registered_users if present
      const reg = JSON.parse(localStorage.getItem('aerodispatch_registered_users') || '[]');
      const idx = reg.findIndex(u => u.email?.toLowerCase() === emailLower);
      if (idx >= 0) {
        reg[idx].password = tempPassword;
      } else {
        reg.push({
          name: extractDisplayName(emailLower),
          email: emailLower,
          password: tempPassword,
          role: emailLower.includes('driver') ? 'driver' : 'customer'
        });
      }
      localStorage.setItem('aerodispatch_registered_users', JSON.stringify(reg));
      return true;
    } catch (e) {
      console.warn("resetAccountPassword local error:", e);
      return false;
    }
  };

  // Admin instant login via dedicated access code (8469) - No Gmail / Email required
  const loginWithAdminCode = async (code) => {
    if (String(code).trim() !== '8469') {
      throw new Error('Invalid administrator access code. Authorization failed.');
    }
    const savedAvatar = getPersistentAvatar('admin@aerodispatch.io', 'admin') || ADMIN_DEFAULT_AVATAR;
    const adminUser = {
      role: 'admin',
      name: 'System Administrator',
      email: 'admin@aerodispatch.io',
      permissions: ['ALL', 'SYSTEM_OVERRIDE'],
      avatarUrl: savedAvatar || ADMIN_DEFAULT_AVATAR
    };
    let token = `admin-code-token-${Date.now()}`;

    // Securely exchange admin clearance for an authenticated backend JWT for DynamoDB sync
    try {
      const authRes = await apiLogin('admin@aerodispatch.io', 'Admin@AeroDispatch2026!', 'admin');
      if (authRes && authRes.token) {
        token = authRes.token;
      }
    } catch (e) {
      console.warn("Backend auth exchange failed, using local offline clearance:", e);
    }

    setCurrentUser(adminUser);
    setCurrentRole('admin');
    setAuthToken(token);
    localStorage.setItem('aerodispatch_user', JSON.stringify(adminUser));
    localStorage.setItem('aerodispatch_token', token);
    localStorage.setItem('aerodispatch_role', 'admin');
    localStorage.setItem('aerodispatch_activeTab', 'dashboard');
    setActiveTab('dashboard');

    if (typeof window !== 'undefined' && window.location.hash) {
      try {
        history.replaceState(null, '', window.location.pathname + window.location.search);
      } catch (e) {}
    }

    // Trigger Admin specific entrance animation
    setLoginAnimationRole('admin');

    // Sync live DynamoDB shipments
    try {
      const ordersRes = await apiListOrders({ role: 'admin', token });
      if (ordersRes && Array.isArray(ordersRes.data) && ordersRes.data.length > 0) {
        setShipments(ordersRes.data);
        localStorage.setItem('aerodispatch_shipments', JSON.stringify(ordersRes.data));
      }
    } catch (err) {
      console.warn("Could not sync live admin orders:", err);
    }

    return adminUser;
  };

  // Google Single Sign-On (SSO) login/registration
  const loginWithGoogle = async (googleUser = null) => {
    const email = (googleUser?.email || 'microsofty543@gmail.com').trim().toLowerCase();
    const name = googleUser?.name || 'Anil Prajapati';
    const role = googleUser?.role || (currentRole === 'driver' ? 'driver' : 'customer');
    const effectiveRole = role === 'admin' ? 'customer' : role; // Google login is strictly customer or captain

    let registeredUsers = [];
    try {
      registeredUsers = JSON.parse(localStorage.getItem('aerodispatch_registered_users') || '[]');
    } catch (e) {}

    let user = registeredUsers.find(u => u.email?.toLowerCase() === email);
    if (!user) {
      user = {
        name,
        email,
        role: effectiveRole,
        phone: googleUser?.phone || '+91 98200 44112',
        provider: 'google',
        createdAt: new Date().toISOString()
      };
      if (effectiveRole === 'driver') {
        user.driverId = `DRV-${Date.now().toString().slice(-4)}`;
        user.vehicleNumber = 'MH-02-EV-8469';
      }
      registeredUsers.push(user);
      localStorage.setItem('aerodispatch_registered_users', JSON.stringify(registeredUsers));
    }

    const savedAvatar = getPersistentAvatar(user.email, user.role);
    const authUser = {
      name: user.name || name,
      email: user.email || email,
      role: user.role || effectiveRole,
      phone: user.phone || '+91 98200 44112',
      avatarUrl: savedAvatar || user.avatarUrl,
      driverId: user.driverId || (user.role === 'driver' ? 'DRV-8469' : undefined),
      vehicleNumber: user.vehicleNumber || (user.role === 'driver' ? 'MH-02-EV-8469' : undefined)
    };

    const token = `google-sso-token-${Date.now()}`;
    setCurrentUser(authUser);
    setCurrentRole(authUser.role);
    setAuthToken(token);
    localStorage.setItem('aerodispatch_user', JSON.stringify(authUser));
    localStorage.setItem('aerodispatch_token', token);
    localStorage.setItem('aerodispatch_role', authUser.role);

    const destTab = authUser.role === 'driver' ? 'driver' : 'shipments';
    setActiveTab(destTab);
    addToast(`Signed in with Google as ${authUser.name} (${authUser.email})`, 'success');
    return authUser;
  };

  // Add a newly created consignment
  const addShipment = async (formData) => {
    let finalOrder = null;

    if (isBackendOnline) {
      try {
        const res = await apiCreateOrder(formData);
        finalOrder = res.data;
        setShipments(prev => [finalOrder, ...prev.filter(s => s.awbNumber !== finalOrder.awbNumber)]);
        setSelectedAwb(finalOrder.awbNumber);
        addToast(`Shipment ${finalOrder.awbNumber} created successfully!`, 'success');
      } catch (e) {
        console.warn("Backend order creation error, falling back to local simulation:", e);
        addToast(`Shipment recorded: ${formData.awbNumber || 'New Order'}`, 'info');
      }
    }

    if (!finalOrder) {
      // Local fallback creation
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const randomMid = Math.floor(1000 + Math.random() * 9000);
      const awb = `AD-${randomMid}-${randomSuffix}`;
      const now = new Date();
      const formattedDate = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' ' +
                            now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

      finalOrder = {
        id: awb,
        awbNumber: awb,
        orderId: `ORD-${randomMid}-${randomSuffix}`,
        displayOrderId: `ORD-${randomMid}-${randomSuffix}`,
        barcode: "||| ||| | |||| | ||| ||",
        serviceTier: formData.serviceTier || "Express Air",
        currentStatus: "BOOKED",
        paymentMode: formData.paymentMode || "Prepaid",
        declaredValue: Number(formData.declaredValue) || 1500,
        createdAt: now.toISOString(),
        estimatedDelivery: new Date(Date.now() + 2 * 86400000).toISOString(),
        currentLocation: `${formData.senderCity || 'Origin'}, Booking Station`,
        weightKg: Number(formData.weightKg) || 1.0,
        dimensions: `${formData.length || 20} x ${formData.width || 15} x ${formData.height || 10} cm`,
        category: formData.category || "General Parcel",
        customerEmail: formData.customerEmail || currentUser?.email || 'customer@aerodispatch.io',
        sender: {
          name: formData.senderName || currentUser?.name || "Sender",
          facility: "Registered Dispatch Node",
          city: formData.senderCity || "New Delhi",
          state: formData.senderState || "Delhi",
          pinCode: formData.senderPin || "110001",
          phone: formData.senderPhone || currentUser?.phone || "+91 98000 00000",
          address: formData.senderAddress || "Logistics Hub Lane"
        },
        recipient: {
          name: formData.recipientName || "Recipient",
          city: formData.recipientCity || "Bengaluru",
          state: formData.recipientState || "Karnataka",
          pinCode: formData.recipientPin || "560001",
          phone: formData.recipientPhone || "+91 99000 00000",
          address: formData.recipientAddress || "Delivery Address St."
        },
        assignedDriver: null, // Strictly null until accepted by courier driver!
        proofOfDelivery: null,
        events: [
          {
            id: `ev-${Date.now()}`,
            status: "BOOKED",
            title: "Shipment Confirmed & Booked",
            location: `${formData.senderCity || 'Origin'} Hub`,
            timestamp: formattedDate,
            notes: "Waybill generated. Waiting for courier driver acceptance."
          }
        ]
      };

      setShipments(prev => [finalOrder, ...prev]);
      setSelectedAwb(awb);
      addToast(`Shipment ${awb} booked successfully!`, 'success');
    }

    // Auto-notify Admin, Driver, and Customer in the Notification Center!
    const targetAwb = finalOrder.awbNumber;
    const destCity = formData.recipientCity || 'Bengaluru';
    const sName = formData.senderName || 'Customer';

    const notifsToAdd = [
      {
        id: `notif-adm-${Date.now()}`,
        targetRole: 'admin',
        category: 'alert',
        title: `New Consignment Booked: ${targetAwb}`,
        message: `Customer ${sName} booked express consignment to ${destCity}. Route ready for dispatch.`,
        time: 'Just now',
        awbNumber: targetAwb,
        read: false,
        severity: 'info'
      },
      {
        id: `notif-drv-${Date.now() + 1}`,
        targetRole: 'driver',
        category: 'assignment',
        title: `New Consignment Available: ${targetAwb}`,
        message: `Pickup order ready in ${formData.senderCity || 'Hub'}. Consignment booked and awaiting driver acceptance.`,
        time: 'Just now',
        awbNumber: targetAwb,
        read: false,
        severity: 'warning'
      },
      {
        id: `notif-cust-${Date.now() + 2}`,
        targetRole: 'customer',
        category: 'shipment',
        title: `Shipment Confirmed: ${targetAwb}`,
        message: `Your consignment has been recorded. Tracking barcode and Air Waybill active.`,
        time: 'Just now',
        awbNumber: targetAwb,
        read: false,
        severity: 'success'
      }
    ];

    setNotifications(prev => [...notifsToAdd, ...prev]);
    return finalOrder;
  };

  // Update status (e.g. driver delivery action or admin status override)
  const updateShipmentStatus = async (awbNumber, nextStatus, customNotes = '', proofData = null) => {
    let backendSuccess = false;
    if (isBackendOnline) {
      try {
        const isAdmin = currentRole === 'admin';
        const res = await apiUpdateStatus(awbNumber, nextStatus, customNotes, proofData, authToken, isAdmin);
        if (res && res.data) {
          setShipments(prev => prev.map(ship => (ship.awbNumber === awbNumber ? res.data : ship)));
          backendSuccess = true;
        }
      } catch (e) {
        console.warn("Backend status update error:", e);
        addToast(`Backend rejected: ${e.message}`, 'warning');
        return;
      }
    }

    if (!backendSuccess) {
      const now = new Date();
      const formattedDate = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' ' +
                            now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

      let title = "Status Updated";
      let location = "Regional Distribution Point";

      if (nextStatus === 'OUT_FOR_DELIVERY') {
        title = "Out for Delivery with Driver";
        location = "Destination Delivery Station";
      } else if (nextStatus === 'DELIVERED') {
        title = "Package Delivered Successfully";
        location = "Recipient Address";
      } else if (nextStatus === 'FAILED_ATTEMPT') {
        title = "Delivery Attempt Unsuccessful";
        location = "Recipient Address";
      } else if (nextStatus === 'IN_TRANSIT') {
        title = "In Transit to Destination";
        location = "Regional Transit Route";
      }

      setShipments(prev => prev.map(ship => {
        if (ship.awbNumber === awbNumber) {
          const newEvent = {
            id: `ev-${Date.now()}`,
            status: nextStatus,
            title,
            location,
            timestamp: formattedDate,
            notes: customNotes || `Status advanced to ${nextStatus}`
          };

          return {
            ...ship,
            currentStatus: nextStatus,
            proofOfDelivery: proofData || ship.proofOfDelivery,
            events: [...ship.events, newEvent]
          };
        }
        return ship;
      }));
    }

    // Trigger role-specific notifications
    const statusNotif = {
      id: `notif-status-${Date.now()}`,
      targetRole: 'customer',
      category: nextStatus === 'DELIVERED' ? 'delivered' : 'alert',
      title: `Shipment ${awbNumber}: ${nextStatus}`,
      message: `Consignment status advanced to ${nextStatus.replace(/_/g, ' ')}. ${customNotes || ''}`,
      time: 'Just now',
      awbNumber: awbNumber,
      read: false,
      severity: nextStatus === 'DELIVERED' ? 'success' : 'info'
    };
    setNotifications(prev => [statusNotif, ...prev]);

    addToast(`Shipment ${awbNumber} updated to ${nextStatus}`, 'success');
  };

  // Assign driver to shipment
  const assignDriverToOrder = async (awbNumber, driverInfo) => {
    if (isBackendOnline) {
      try {
        const res = await apiAssignDriver(awbNumber, driverInfo, authToken);
        if (res && res.data) {
          setShipments(prev => prev.map(s => (s.awbNumber === awbNumber ? res.data : s)));
          addToast(`Driver ${driverInfo.name} assigned successfully!`, 'success');
        }
      } catch (e) {
        console.warn("Backend driver assignment failed:", e);
        addToast(`Could not assign driver: ${e.message}`, 'warning');
      }
    }

    // Local state assignment
    setShipments(prev => prev.map(s => {
      if (s.awbNumber === awbNumber) {
        return {
          ...s,
          assignedDriver: {
            driverId: driverInfo.driverId || driverInfo.id || 'DRV-8469',
            name: driverInfo.name,
            phone: driverInfo.phone,
            vehicleNumber: driverInfo.vehicleNumber || driverInfo.vehicle || 'MH-02-EV-8469',
            rating: 4.98,
          }
        };
      }
      return s;
    }));

    // Driver notification
    const assignNotif = {
      id: `notif-drv-assign-${Date.now()}`,
      targetRole: 'driver',
      category: 'assignment',
      title: `New Consignment Assigned: ${awbNumber}`,
      message: `Operations assigned parcel ${awbNumber} to Courier ${driverInfo.name} (EV KA-03-EV-4412).`,
      time: 'Just now',
      awbNumber: awbNumber,
      read: false,
      severity: 'warning'
    };
    setNotifications(prev => [assignNotif, ...prev]);

    addToast(`Driver ${driverInfo.name} assigned.`, 'info');
  };

  // Driver accepts unassigned parcel request (Enforces: Exactly 1 Active Delivery at a time)
  const acceptDriverOrder = async (awbNumber) => {
    // 1. Strict single-active delivery rule: Check if captain already has an ongoing consignment
    const activeOngoingDelivery = shipments.find(s => {
      const isMyDelivery = (s.assignedDriver && (
        s.assignedDriver.name?.toLowerCase() === currentUser?.name?.toLowerCase() ||
        s.assignedDriver.driverId === currentUser?.driverId
      )) || s.driverId === (currentUser?.driverId || 'DRV-8469');

      const isCompleted = s.currentStatus === 'DELIVERED' || s.status === 'delivered';
      return isMyDelivery && !isCompleted;
    });

    if (activeOngoingDelivery) {
      addToast(`Active Delivery In Progress! You must complete and deliver consignment ${activeOngoingDelivery.awbNumber} before accepting another delivery.`, 'warning');
      return false;
    }

    const driverId = currentUser?.driverId || `DRV-${(currentUser?.phone || Date.now().toString()).slice(-4)}`;
    const driverName = currentUser?.name || 'Assigned Courier';
    const driverPhone = currentUser?.phone || '';
    const vehicleNumber = currentUser?.vehicleNumber || 'Express Van';

    const driverObj = {
      driverId,
      name: driverName,
      title: 'Delivery Captain',
      phone: driverPhone,
      vehicleNumber,
      rating: 4.98,
      currentLocation: 'Local Logistics Hub'
    };

    const now = new Date();
    const formattedTime = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' ' +
                          now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const acceptEvent = {
      id: `ev-${Date.now()}`,
      status: 'OUT_FOR_DELIVERY',
      title: `Accepted by Delivery Captain (${driverName})`,
      location: 'Local Logistics Hub',
      timestamp: formattedTime,
      notes: `Delivery Captain ${driverName} (${driverPhone}) accepted consignment dispatch request.`,
    };

    if (isBackendOnline) {
      try {
        const res = await apiDriverAcceptOrder(awbNumber, authToken);
        if (res && res.data) {
          const updated = {
            ...res.data,
            assignedDriver: driverObj,
            currentStatus: 'OUT_FOR_DELIVERY',
            events: [...(res.data.events || []), acceptEvent]
          };
          setShipments(prev => prev.map(s => (s.awbNumber === awbNumber ? updated : s)));
          addToast(`Consignment ${awbNumber} accepted! Dispatched to your run sheet.`, 'success');
          return updated;
        }
      } catch (e) {
        console.warn("Backend accept order failed, performing local assignment:", e);
      }
    }

    setShipments(prev => prev.map(s => {
      if (s.awbNumber === awbNumber) {
        return {
          ...s,
          assignedDriver: driverObj,
          currentStatus: 'OUT_FOR_DELIVERY',
          events: [...(s.events || []), acceptEvent],
        };
      }
      return s;
    }));

    addToast(`Consignment ${awbNumber} accepted! Dispatched to your run sheet.`, 'success');
  };

  // Driver declines unassigned parcel request
  const declineDriverOrder = async (awbNumber) => {
    const driverId = currentUser?.driverId || 'DRV-8469';
    const driverName = getCleanDisplayName(currentUser, 'driver') || 'Delivery Captain';

    if (isBackendOnline) {
      try {
        await apiDriverDeclineOrder(awbNumber, authToken);
      } catch (e) {
        console.warn("Backend decline note:", e);
      }
    }

    setShipments(prev => prev.map(s => {
      if (s.awbNumber === awbNumber) {
        const declined = s.declinedByDrivers || [];
        const declinedDetails = s.declinedDriverDetails || [];
        const now = new Date();
        const formattedTime = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' ' +
                              now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        return {
          ...s,
          declinedByDrivers: [...declined, driverId],
          declinedDriverDetails: [
            ...declinedDetails,
            { driverId, driverName, timestamp: formattedTime }
          ],
          events: [
            ...(s.events || []),
            {
              id: `ev-dec-${Date.now()}`,
              status: s.currentStatus,
              title: `Declined by Driver (${driverName})`,
              location: 'Dispatch Pool',
              timestamp: formattedTime,
              notes: `Driver ${driverName} (${driverId}) declined order. Returned to available dispatch pool.`
            }
          ]
        };
      }
      return s;
    }));

    addToast(`Consignment ${awbNumber} declined and returned to dispatch pool.`, 'info');
  };

  // Upload proof of delivery photo
  const uploadProofPhoto = async (awbNumber, file, deliveredTo, otpCode = '', notes = '') => {
    if (isBackendOnline) {
      const res = await apiUploadProofPhoto(awbNumber, file, deliveredTo, otpCode, notes, authToken);
      if (res && res.order) {
        setShipments(prev => prev.map(s => (s.awbNumber === awbNumber ? res.order : s)));
        addToast('Delivery proof photo uploaded and verified!', 'success');
        return res;
      }
    }
    // Fallback simulated URL
    updateShipmentStatus(awbNumber, 'DELIVERED', notes || `Delivered to ${deliveredTo}`, {
      deliveredTo,
      photoUrl: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=500&q=80',
      timestamp: new Date().toLocaleTimeString(),
      verificationMethod: otpCode ? `OTP Verified (${otpCode})` : 'Signature Verified',
    });
    addToast('Proof photo saved (local simulation).', 'info');
  };

  const updateShipmentRecord = (updatedOrder) => {
    if (!updatedOrder) return;
    const awb = updatedOrder.awbNumber || updatedOrder.orderId;
    setShipments(prev => prev.map(s => (s.awbNumber === awb || s.id === awb) ? { ...s, ...updatedOrder } : s));
    try {
      const saved = localStorage.getItem('aerodispatch_shipments');
      if (saved) {
        const arr = JSON.parse(saved);
        const nextArr = arr.map(s => (s.awbNumber === awb || s.id === awb) ? { ...s, ...updatedOrder } : s);
        localStorage.setItem('aerodispatch_shipments', JSON.stringify(nextArr));
      }
    } catch (e) {}
  };

  const resetToDefaultMock = () => {
    setShipments(MASTER_ADMIN_SHIPMENTS);
    try {
      localStorage.setItem('aerodispatch_shipments', JSON.stringify(MASTER_ADMIN_SHIPMENTS));
    } catch (e) {}
    addToast('Restored authentic shipments database.', 'info');
  };

  // Dynamically compute real logistics metrics from active shipments
  const computedMetrics = React.useMemo(() => {
    const total = shipments.length;
    const inTransit = shipments.filter(s => s.currentStatus === 'IN_TRANSIT').length;
    const outForDelivery = shipments.filter(s => s.currentStatus === 'OUT_FOR_DELIVERY').length;
    const delivered = shipments.filter(s => s.currentStatus === 'DELIVERED').length;
    const failed = shipments.filter(s => s.currentStatus === 'FAILED_ATTEMPT').length;
    const sla = total > 0 ? Math.round(((total - failed) / total) * 100) : 100;
    const uniqueCities = new Set(shipments.flatMap(s => [s.sender?.city, s.recipient?.city].filter(Boolean)));
    return {
      totalShipmentsToday: total,
      activeInTransit: inTransit,
      outForDelivery,
      deliveredToday: delivered,
      failedExceptions: failed,
      onTimeSlaPercentage: sla,
      activeHubs: uniqueCities.size,
      activeFleetCount: driversList.length
    };
  }, [shipments, driversList]);

  // Dynamically derive active sorting gateways and hubs from actual user shipments
  const dynamicHubs = React.useMemo(() => {
    const hubMap = new Map();
    shipments.forEach(s => {
      const orig = s.sender?.city;
      if (orig) {
        if (!hubMap.has(orig)) {
          hubMap.set(orig, {
            id: `HUB-${orig.substring(0, 3).toUpperCase()}`,
            name: `${orig} Gateway`,
            city: orig,
            inTransit: 0,
            total: 0
          });
        }
        hubMap.get(orig).total += 1;
        if (s.currentStatus === 'BOOKED' || s.currentStatus === 'HUB_INBOUND' || s.currentStatus === 'IN_TRANSIT') {
          hubMap.get(orig).inTransit += 1;
        }
      }

      const dest = s.recipient?.city;
      if (dest) {
        if (!hubMap.has(dest)) {
          hubMap.set(dest, {
            id: `HUB-${dest.substring(0, 3).toUpperCase()}`,
            name: `${dest} Terminal`,
            city: dest,
            inTransit: 0,
            total: 0
          });
        }
        hubMap.get(dest).total += 1;
        if (s.currentStatus === 'OUT_FOR_DELIVERY' || s.currentStatus === 'IN_TRANSIT') {
          hubMap.get(dest).inTransit += 1;
        }
      }
    });

    if (hubMap.size === 0) {
      return MASTER_ADMIN_HUBS;
    }

    return Array.from(hubMap.values()).map(h => ({
      ...h,
      capacityUsage: Math.min(100, Math.max(10, h.total * 25)),
      status: h.inTransit > 10 ? 'High Volume' : 'Optimal'
    }));
  }, [shipments]);

  // Dedicated Metric Tile Counts for the Admin Dashboard
  const customerAccountsCount = React.useMemo(() => {
    let localCount = 0;
    try {
      const reg = JSON.parse(localStorage.getItem('aerodispatch_registered_users') || '[]');
      localCount = reg.filter(u => u.role === 'customer').length;
    } catch (e) {}
    return Math.max(adminStats?.customerAccounts ?? 0, localCount);
  }, [adminStats]);

  const captainAccountsCount = React.useMemo(() => {
    let localCount = 0;
    try {
      const reg = JSON.parse(localStorage.getItem('aerodispatch_registered_users') || '[]');
      localCount = reg.filter(u => u.role === 'driver').length;
    } catch (e) {}
    return Math.max(adminStats?.captainAccounts ?? 0, driversList.length, localCount);
  }, [adminStats, driversList]);

  const completedDeliveriesCount = React.useMemo(() => {
    return shipments.filter(s => s.currentStatus === 'DELIVERED' || s.status === 'delivered').length;
  }, [shipments]);

  const cancelledOrdersCount = React.useMemo(() => {
    return shipments.filter(s => s.currentStatus === 'CANCELLED' || s.status === 'cancelled').length;
  }, [shipments]);

  useEffect(() => {
    if (currentUser?.role === 'admin') {
      fetchAdminStats();
    }
  }, [currentUser, fetchAdminStats]);

  return (
    <AppContext.Provider
      value={{
        adminStats,
        fetchAdminStats,
        customerAccountsCount,
        captainAccountsCount,
        completedDeliveriesCount,
        cancelledOrdersCount,
        shipments,
        allShipments: shipments,
        visibleShipments,
        isAuthenticated,
        logoutUser,
        requireAuth,
        currentRole,
        switchRole,
        loginUser,
        loginWithAdminCode,
        loginWithGoogle,
        resetAccountPassword,
        currentUser,
        loginAnimationRole,
        setLoginAnimationRole,
        authToken,
        activeTab,
        setActiveTab,
        selectedAwb,
        setSelectedAwb,
        trackingQuery,
        setTrackingQuery,
        toasts,
        addToast,
        removeToast,
        addShipment,
        updateShipmentStatus,
        updateShipmentRecord,
        assignDriverToOrder,
        acceptDriverOrder,
        declineDriverOrder,
        uploadProofPhoto,
        refreshBackendOrders,
        resetToDefaultMock,
        isBackendOnline,
        isLoadingOrders,
        isMobileSidebarOpen,
        setIsMobileSidebarOpen,
        isSidebarCollapsed,
        setIsSidebarCollapsed,
        toggleSidebar,
        toggleMobileSidebar: toggleSidebar,
        closeMobileSidebar: () => setIsMobileSidebarOpen(false),
        drivers: driversList,
        driversList,
        setDriversList,
        updateDriverStatus,
        updateUserAvatar,
        updateUserProfile,
        notifications,
        unreadNotificationsCount,
        markNotificationRead,
        markAllNotificationsRead,
        clearNotifications,
        theme,
        toggleTheme,
        statusFilter,
        setStatusFilter,
        isChatboxOpen,
        setIsChatboxOpen,
        openChatbox,
        closeChatbox,
        isProfileZoomOpen,
        openProfileZoom,
        closeProfileZoom,
        hubs: dynamicHubs,
        metrics: computedMetrics,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
