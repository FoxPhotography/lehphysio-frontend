import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { authService } from '../services/authService';
import { playChatSound, setFramesCache } from '../utils/helpers';
import { User, XpSettings } from '../types';

interface AuthContextType {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  token: string;
  setToken: React.Dispatch<React.SetStateAction<string>>;
  confirmEmail: string;
  setConfirmEmail: React.Dispatch<React.SetStateAction<string>>;
  forgotEmail: string;
  setForgotEmail: React.Dispatch<React.SetStateAction<string>>;
  currentPage: string;
  setCurrentPage: (page: string) => void;
  changePage: (page: string, params?: any) => void;
  
  // Custom dialogs
  customModal: any;
  setCustomModal: React.Dispatch<React.SetStateAction<any>>;
  showAlert: (title: string, message: string, type?: 'success' | 'error' | 'info') => void;
  showConfirm: (
    title: string,
    message: string,
    onConfirm: () => void,
    onCancel?: () => void,
    confirmText?: string,
    cancelText?: string,
    type?: 'danger' | 'info' | 'success' | 'warning'
  ) => void;

  toastMessage: string | null;
  showToast: (msg: string) => void;

  // XP Popups
  xpPopups: any[];
  triggerXpPopup: (amount: number) => void;
  xpSettings: XpSettings;

  // User directory / profiles
  usernamesDirectory: any[];
  fetchUserProfile: () => Promise<void>;
  fetchUsernamesDirectory: () => Promise<void>;
  handleUpdateProfile: (batch?: string, avatarUrl?: string, equippedFrameVal?: string, equippedTitleVal?: string) => Promise<void>;
  handleUploadImage: (file: File) => Promise<string | null>;

  // Cosmetics
  equippedFrame: string;
  setEquippedFrame: React.Dispatch<React.SetStateAction<string>>;
  equippedTitle: string;
  setEquippedTitle: React.Dispatch<React.SetStateAction<string>>;
  unlockedCosmetics: string[];
  setUnlockedCosmetics: React.Dispatch<React.SetStateAction<string[]>>;

  // PWA & notifications
  deferredPrompt: any;
  showInstallBanner: boolean;
  setShowInstallBanner: React.Dispatch<React.SetStateAction<boolean>>;
  isSubscribed: boolean;
  pushLoading: boolean;
  isStandalone: boolean;
  showIOSInstall: boolean;
  setShowIOSInstall: React.Dispatch<React.SetStateAction<boolean>>;
  handleInstallPWA: () => Promise<void>;
  dismissInstallBanner: () => void;
  handleTogglePushNotifications: () => Promise<void>;
  dismissIOSInstall: () => void;

  // Streak
  streakOverlay: {
    show: boolean;
    days: number;
    xpEarned: number;
    hasStreakBonus: boolean;
  };
  setStreakOverlay: React.Dispatch<React.SetStateAction<{
    show: boolean;
    days: number;
    xpEarned: number;
    hasStreakBonus: boolean;
  }>>;
  getFlameTier: (days: number) => any;
  getAvatarFrameClass: () => string;

  // Auth Handlers
  handleLogout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentPage, _setCurrentPage] = useState('home');
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [confirmEmail, setConfirmEmail] = useState('');
  const [forgotEmail, setForgotEmail] = useState('');

  // Cosmetics
  const [equippedFrame, setEquippedFrame] = useState(localStorage.getItem('eq_frame') || 'none');
  const [equippedTitle, setEquippedTitle] = useState(localStorage.getItem('eq_title') || 'none');
  const [unlockedCosmetics, setUnlockedCosmetics] = useState<string[]>(
    JSON.parse(localStorage.getItem('cosmetics') || '[]')
  );

  // Global Dialogs / Popups
  const [customModal, setCustomModal] = useState<any>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [xpPopups, setXpPopups] = useState<any[]>([]);
  const [usernamesDirectory, setUsernamesDirectory] = useState<any[]>([]);

  const [xpSettings, setXpSettings] = useState<XpSettings>({
    like: 5,
    comment: 15,
    share: 25,
    comment_like: 2,
    daily_login: 10,
    streak_bonus: 70,
    game_play: 50,
    referral: 25,
    surprise_box: 50,
    poll_vote: 30,
    quiz_solve: 150
  });

  // PWA & Push
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showIOSInstall, setShowIOSInstall] = useState(false);

  const [streakOverlay, setStreakOverlay] = useState<{
    show: boolean;
    days: number;
    xpEarned: number;
    hasStreakBonus: boolean;
  }>({ show: false, days: 0, xpEarned: 0, hasStreakBonus: false });

  const showToast = (msg: string) => {
    setToastMessage(msg);
  };

  useEffect(() => {
    let timer: any;
    if (toastMessage) {
      timer = setTimeout(() => setToastMessage(null), 2500);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [toastMessage]);

  const triggerXpPopup = (amount: number) => {
    const id = Date.now() + Math.random();
    setXpPopups(prev => [...prev, { id, amount }]);
    playChatSound(amount > 0 ? 'xp_gain' : 'xp_loss');
    setTimeout(() => {
      setXpPopups(prev => prev.filter(p => p.id !== id));
    }, 1500);
  };

  const showAlert = (title: string, message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setCustomModal({
      isOpen: true,
      title,
      message,
      confirmText: 'OK',
      onConfirm: () => setCustomModal(null),
      type
    });
  };

  const showConfirm = (
    title: string,
    message: string,
    onConfirm: () => void,
    onCancel?: () => void,
    confirmText: string = 'Confirm',
    cancelText: string = 'Cancel',
    type: 'danger' | 'info' | 'success' | 'warning' = 'warning'
  ) => {
    setCustomModal({
      isOpen: true,
      title,
      message,
      confirmText,
      cancelText,
      onConfirm: () => {
        onConfirm();
        setCustomModal(null);
      },
      onCancel: () => {
        if (onCancel) onCancel();
        setCustomModal(null);
      },
      type
    });
  };

  // Sync token and load Profile
  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
      fetchUserProfile();
      fetchUsernamesDirectory();
    } else {
      localStorage.removeItem('token');
      setUser(null);
      setUsernamesDirectory([]);
    }
  }, [token]);

  const fetchUserProfile = async () => {
    if (!token) return;
    try {
      const res = await authService.fetchUserProfile(token);
      const data = await res.json();
      if (res.ok) {
        setUser(data.user);
        if (data.user.equipped_frame) {
          setEquippedFrame(data.user.equipped_frame);
          localStorage.setItem('eq_frame', data.user.equipped_frame);
        }
        if (data.user.equipped_title) {
          setEquippedTitle(data.user.equipped_title);
          localStorage.setItem('eq_title', data.user.equipped_title);
        }
        if (data.rewards) {
          if (data.rewards.daily_login) {
            triggerXpPopup(xpSettings.daily_login || 10);
          }
          if (data.rewards.streak_bonus) {
            setTimeout(() => triggerXpPopup(xpSettings.streak_bonus || 70), 1000);
          }
        }
      } else {
        setToken('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchXpSettings = async () => {
    try {
      const res = await authService.fetchXpSettings();
      const data = await res.json();
      if (res.ok) {
        setXpSettings(data);
      }
    } catch (err) {
      console.error('Failed to fetch XP settings:', err);
    }
  };

  const fetchUsernamesDirectory = async () => {
    if (!token) return;
    try {
      const res = await authService.fetchUsernamesDirectory(token);
      const data = await res.json();
      if (res.ok) {
        setUsernamesDirectory(data);
      }
    } catch (e) {
      console.error('Error fetching usernames directory:', e);
    }
  };

  const handleUpdateProfile = async (batch?: string, avatarUrl?: string, equippedFrameVal?: string, equippedTitleVal?: string) => {
    if (!token) return;
    try {
      const body: any = {};
      if (batch) body.batch = batch;
      if (avatarUrl !== undefined) body.avatar_url = avatarUrl;
      if (equippedFrameVal !== undefined) body.equipped_frame = equippedFrameVal;
      if (equippedTitleVal !== undefined) body.equipped_title = equippedTitleVal;
      const res = await authService.updateProfile(body, token);
      const data = await res.json();
      if (res.ok) {
        fetchUserProfile();
        fetchUsernamesDirectory();
        showToast(data.message || 'Profile updated!');
      } else {
        showToast(data.error || 'Failed to update profile.');
      }
    } catch (e) {
      console.error(e);
      showToast('Error updating profile.');
    }
  };

  const resizeImage = (file: File, maxWidth: number, maxHeight: number): Promise<Blob> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              resolve(file);
            }
          },
          'image/jpeg',
          0.85
        );
      };
      img.onerror = () => {
        resolve(file);
      };
    });
  };

  const handleUploadImage = async (file: File): Promise<string | null> => {
    if (!token) return null;
    try {
      showToast('Compressing image... ⚙️');
      const compressedBlob = await resizeImage(file, 1200, 1200);
      const res = await authService.uploadImage(compressedBlob, file.name.replace(/\.[^/.]+$/, "") + ".jpg", token);
      
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        console.error('Server returned non-JSON response:', res.status);
        showToast('Upload failed: Server error or file too large.');
        return null;
      }

      const data = await res.json();
      if (res.ok) {
        return data.url;
      } else {
        showToast(data.error || 'Upload failed.');
        return null;
      }
    } catch (e) {
      console.error('Error uploading image:', e);
      showToast('Upload error.');
      return null;
    }
  };

  // PWA detect standalone
  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches
      || (window.navigator as any).standalone === true;
    setIsStandalone(standalone);
  }, []);

  // Catch PWA install prompt
  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);

      const dismissedAt = localStorage.getItem('pwa_install_dismissed');
      if (dismissedAt) {
        const daysSince = (Date.now() - Number(dismissedAt)) / (1000 * 60 * 60 * 24);
        if (daysSince < 7) return;
      }

      const standalone = window.matchMedia('(display-mode: standalone)').matches
        || (window.navigator as any).standalone === true;
      if (standalone) return;

      setTimeout(() => setShowInstallBanner(true), 3000);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // iOS PWA detect
  useEffect(() => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    const standalone = window.matchMedia('(display-mode: standalone)').matches
      || (window.navigator as any).standalone === true;

    if (isIOS && !standalone) {
      const dismissedAt = localStorage.getItem('ios_pwa_install_dismissed');
      if (dismissedAt) {
        const daysSince = (Date.now() - Number(dismissedAt)) / (1000 * 60 * 60 * 24);
        if (daysSince < 7) return;
      }
      setTimeout(() => setShowIOSInstall(true), 3000);
    }
  }, []);

  // Service Worker and Push Activation
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then((reg) => {
        console.log('PWA Service Worker registered with scope:', reg.scope);
      }).catch(err => {
        console.error('Service Worker registration failed:', err);
      });
    }

    if ('serviceWorker' in navigator && 'PushManager' in window) {
      navigator.serviceWorker.ready.then((reg) => {
        reg.pushManager.getSubscription().then((sub) => {
          setIsSubscribed(!!sub);
        });
      });
    }
  }, [token]);

  const handleInstallPWA = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('User accepted the PWA install prompt');
      setShowInstallBanner(false);
      setDeferredPrompt(null);
      localStorage.removeItem('pwa_install_dismissed');
    }
  };

  const dismissInstallBanner = () => {
    setShowInstallBanner(false);
    localStorage.setItem('pwa_install_dismissed', Date.now().toString());
  };

  const dismissIOSInstall = () => {
    setShowIOSInstall(false);
    localStorage.setItem('ios_pwa_install_dismissed', Date.now().toString());
  };

  const handleTogglePushNotifications = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      showToast('الإشعارات غير مدعومة على هذا الجهاز أو المتصفح.');
      return;
    }

    setPushLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const existingSub = await reg.pushManager.getSubscription();

      if (existingSub) {
        await existingSub.unsubscribe();
        await authService.unsubscribePush(existingSub.endpoint);
        setIsSubscribed(false);
        showToast('تم إلغاء تفعيل الإشعارات.');
      } else {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          showToast('يرجى تفعيل صلاحية الإشعارات من إعدادات المتصفح.');
          setPushLoading(false);
          return;
        }

        const keyRes = await authService.getVapidKey();
        if (!keyRes.ok) {
          const errData = await keyRes.json().catch(() => ({}));
          showToast(errData.error || 'فشل تشغيل الإشعارات: يرجى إعادة تشغيل السيرفر (Backend Server) لقراءة مفاتيح الإشعارات الجديدة.');
          setPushLoading(false);
          return;
        }
        const keyData = await keyRes.json();
        
        const urlBase64ToUint8Array = (base64String: string) => {
          const padding = '='.repeat((4 - base64String.length % 4) % 4);
          const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
          const rawData = window.atob(base64);
          const outputArray = new Uint8Array(rawData.length);
          for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
          }
          return outputArray;
        };

        const convertedKey = urlBase64ToUint8Array(keyData.publicKey);

        const newSub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedKey
        });

        const devType = /iPad|iPhone|iPod/.test(navigator.userAgent) ? 'ios' : (/Android/.test(navigator.userAgent) ? 'android' : 'desktop');
        await authService.subscribePush(newSub, devType, token);

        setIsSubscribed(true);
        showToast('تم تفعيل الإشعارات بنجاح! 🔔');
      }
    } catch (err) {
      console.error('Error toggling push notifications:', err);
      showToast('حدث خطأ أثناء تفعيل الإشعارات.');
    } finally {
      setPushLoading(false);
    }
  };

  const handleLogout = () => {
    setToken('');
    setUser(null);
    changePage('home');
  };

  const getAvatarFrameClass = () => {
    if (equippedFrame === 'gold-glow') return 'avatar-frame-gold-glow';
    if (equippedFrame === 'neon-ring') return 'avatar-frame-neon-ring';
    return '';
  };

  const getFlameTier = (days: number) => {
    if (days >= 15) {
      return {
        name: "Supernova Blue",
        badge: "Peak Performance!",
        outer: ["#002080", "#00bfff", "#e0ffff"],
        mid: ["#0055ff", "#00ffff", "#ffffff"],
        inner: ["#00ffff", "#ffffff", "#ffffff"],
        shadow: "drop-shadow-[0_0_65px_rgba(0,191,255,0.9)]",
        textClass: "text-cyan-400 drop-shadow-[0_0_15px_rgba(6,182,212,0.6)] font-black",
        particleColor: "from-cyan-500 to-blue-300",
        ambientGlow: "bg-cyan-500/20"
      };
    }
    if (days >= 7) {
      return {
        name: "Plasma Storm",
        badge: "Plasma Storm!",
        outer: ["#310062", "#8a2be2", "#ff007f"],
        mid: ["#4b0082", "#ff00ff", "#ffffff"],
        inner: ["#ff00ff", "#ffffff", "#ffffff"],
        shadow: "drop-shadow-[0_0_65px_rgba(255,0,255,0.9)]",
        textClass: "text-pink-400 drop-shadow-[0_0_15px_rgba(236,72,153,0.6)] font-black",
        particleColor: "from-purple-600 to-pink-400",
        ambientGlow: "bg-purple-500/20"
      };
    }
    if (days >= 3) {
      return {
        name: "Golden Blaze",
        badge: "Golden Blaze!",
        outer: ["#b8860b", "#ffaa00", "#ffea80"],
        mid: ["#d4af37", "#ffdf00", "#ffffff"],
        inner: ["#ffdf00", "#ffffff", "#ffffff"],
        shadow: "drop-shadow-[0_0_65px_rgba(255,215,0,0.9)]",
        textClass: "text-yellow-400 drop-shadow-[0_0_15px_rgba(234,179,8,0.6)] font-black",
        particleColor: "from-yellow-500 to-amber-300",
        ambientGlow: "bg-yellow-500/20"
      };
    }
    return {
      name: "Starter Spark",
      badge: "Spark Up!",
      outer: ["#d90429", "#f77f00", "#fcbf49"],
      mid: ["#f77f00", "#fcbf49", "#eae2b7"],
      inner: ["#fcbf49", "#ffffff", "#ffffff"],
      shadow: "drop-shadow-[0_0_60px_rgba(255,106,0,0.85)]",
      textClass: "text-brand-orange drop-shadow-[0_0_15px_rgba(242,101,34,0.6)] font-black",
      particleColor: "from-brand-orange to-yellow-400",
      ambientGlow: "bg-brand-orange/20"
    };
  };

  // Fetch initial configs on mount
  useEffect(() => {
    fetchXpSettings();
    const fetchFramesCache = async () => {
      try {
        const res = await authService.fetchFrames();
        const data = await res.json();
        if (res.ok) setFramesCache(data);
      } catch (e) {
        console.error(e);
      }
    };
    fetchFramesCache();
  }, []);

  const changePage = (page: string, params?: any) => {
    let path = '/';
    if (page === 'home') path = '/';
    else if (page === 'episodes') path = '/episodes';
    else if (page === 'episode-detail') {
      const epId = params?.id || '';
      path = `/episodes/${epId}`;
    }
    else if (page === 'community') path = '/chat';
    else if (page === 'games') path = '/games';
    else if (page === 'play-game') {
      const code = params?.roomCode || '';
      path = `/game/${code}`;
    }
    else if (page === 'leaderboard') path = '/leaderboard';
    else if (page === 'rewards') path = '/rewards';
    else if (page === 'profile') path = '/profile';
    else if (page === 'login') path = '/login';
    else if (page === 'register') path = '/register';
    else if (page === 'confirm') path = '/confirm';
    else if (page === 'forgot-password') path = '/forgot-password';
    else if (page === 'reset-password') path = '/reset-password';
    else if (page === 'admin') path = '/admin';
    else if (page === 'news') path = '/news';
    
    if (window.location.pathname !== path) {
      window.history.pushState(null, '', path);
    }
    _setCurrentPage(page);
  };

  const setCurrentPage = (page: string) => {
    changePage(page);
  };

  return (
    <AuthContext.Provider value={{
      user, setUser, token, setToken, confirmEmail, setConfirmEmail, forgotEmail, setForgotEmail,
      currentPage, setCurrentPage, changePage,
      customModal, setCustomModal, showAlert, showConfirm,
      toastMessage, showToast,
      xpPopups, triggerXpPopup, xpSettings,
      usernamesDirectory, fetchUserProfile, fetchUsernamesDirectory, handleUpdateProfile, handleUploadImage,
      equippedFrame, setEquippedFrame, equippedTitle, setEquippedTitle, unlockedCosmetics, setUnlockedCosmetics,
      deferredPrompt, showInstallBanner, setShowInstallBanner, isSubscribed, pushLoading, isStandalone,
      showIOSInstall, setShowIOSInstall, handleInstallPWA, dismissInstallBanner, handleTogglePushNotifications, dismissIOSInstall,
      streakOverlay, setStreakOverlay, getFlameTier, getAvatarFrameClass, handleLogout
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
