import React, { useState, useEffect, useRef } from 'react';
import { playChatSound, getNameColor, getYoutubeEmbedUrl, getLocalDateString, setFramesCache, copyToClipboard } from './utils/helpers';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, X } from 'lucide-react';

// Pages
import { Home } from './pages/Home';
import { Episodes } from './pages/Episodes';
import { EpisodeDetail } from './pages/EpisodeDetail';
import { Community } from './pages/Community';
import { Games } from './pages/Games';
import { PlayGame } from './pages/PlayGame';
import { Leaderboard } from './pages/Leaderboard';
import { Profile } from './pages/Profile';
import { Rewards } from './pages/Rewards';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Confirm } from './pages/Confirm';
import { ForgotPassword } from './pages/ForgotPassword';
import { ResetPassword } from './pages/ResetPassword';
import { Admin } from './pages/Admin';
import { News } from './pages/News';

// Components
import { Sidebar } from './components/Sidebar';
import { MobileHeader } from './components/MobileHeader';
import { BottomNav } from './components/BottomNav';
import { CustomModal } from './components/CustomModal';
import { Toast } from './components/Toast';
import { XPPopup } from './components/XPPopup';

// Use environment variable VITE_API_BASE if defined, otherwise detect localhost / local networks
import { io } from 'socket.io-client';

const API_BASE = import.meta.env.VITE_API_BASE || (
  window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname.startsWith('192.168.') 
    ? `http://${window.location.hostname}:5000` 
    : ''
);

const socket = io(API_BASE || window.location.origin);



function App() {
  // Navigation State
  const [currentPage, _setCurrentPage] = useState('home'); // home, episodes, community, games, leaderboard, profile, rewards, episode-detail, play-game, login, register, confirm, admin

  // Auth State
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [confirmEmail, setConfirmEmail] = useState('');
  const [forgotEmail, setForgotEmail] = useState('');
  
  // App Data
  const [episodes, setEpisodes] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [leaderboardTab, setLeaderboardTab] = useState('all-time'); // all-time, weekly, batch
  const [communityPosts, setCommunityPosts] = useState<any[]>([]);
  const [newsPosts, setNewsPosts] = useState<any[]>([]);
  const [isLoadingOlderPosts, setIsLoadingOlderPosts] = useState(false);
  const [hasMorePosts, setHasMorePosts] = useState(true);
  
  // Forms
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ username: '', email: '', password: '', batch: 'PT 11' });
  const [confirmCode, setConfirmCode] = useState('');
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
  const [loginReward, setLoginReward] = useState<any>(null);

  // Redeem code
  const [secretCode, setSecretCode] = useState('');
  const [redeemError, setRedeemError] = useState('');
  const [redeemSuccess, setRedeemSuccess] = useState('');
  const [xpPopups, setXpPopups] = useState<any[]>([]);

  // Chat/Community State
  const [communityTab, setCommunityTab] = useState<'feed' | 'chat'>('feed');
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [replyingTo, setReplyingTo] = useState<any>(null);
  const [activeReactionMenu, setActiveReactionMenu] = useState<number | null>(null);
  const [editingMessage, setEditingMessage] = useState<any>(null);
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [selectedMessageIds, setSelectedMessageIds] = useState<number[]>([]);
  const [activeContextMenu, setActiveContextMenu] = useState<any>(null);
  const [swipeTranslateX, setSwipeTranslateX] = useState<{ [key: number]: number }>({});
  const [lastSeenMessageId, setLastSeenMessageId] = useState<number>(() => Number(localStorage.getItem('lastSeenMessageId') || '0'));
  const [customModal, setCustomModal] = useState<any>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [onlineCount, setOnlineCount] = useState(1);
  const [usernamesDirectory, setUsernamesDirectory] = useState<any[]>([]);
  const [isLoadingOlderChat, setIsLoadingOlderChat] = useState(false);
  const [hasMoreChat, setHasMoreChat] = useState(true);
  const shouldScrollToBottomRef = useRef(false);

  // Polls Mock State
  const [pollVotes, setPollVotes] = useState<number[]>([42, 12, 8, 25]);
  const [hasVotedPoll, setHasVotedPoll] = useState(false);
  const [userVotedOption, setUserVotedOption] = useState<number | null>(null);

  // Dynamic XP Settings State
  const [xpSettings, setXpSettings] = useState<any>({
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

  // Multiplayer Room Game States
  const [activeGameRoom, setActiveGameRoom] = useState<any>(null);
  const [gameRoomCodeInput, setGameRoomCodeInput] = useState('');
  const [createGameRounds, setCreateGameRounds] = useState(5);
  const [createGameDuration, setCreateGameDuration] = useState(60);
  const [submittedGameAnswer, setSubmittedGameAnswer] = useState('');
  const [isGameLoading, setIsGameLoading] = useState(false);
  const [gameError, setGameError] = useState('');
  const [gameTab, setGameTab] = useState<'single' | 'multiplayer'>('single');
  const [isMultiplayerExpanded, setIsMultiplayerExpanded] = useState(false);

  // Single-player Games States
  const [activeGame, setActiveGame] = useState<any>(null); // memory, spin, quiz
  const [gameQuestionIdx, setGameQuestionIdx] = useState(0);
  const [gameScore, setGameScore] = useState(0);
  const [gameFinished, setGameFinished] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [gameFeedback, setGameFeedback] = useState('');
  const [gamePlayError, setGamePlayError] = useState('');
  const [gamePlaySuccess, setGamePlaySuccess] = useState('');

  // Memory Game State
  const [memoryCards, setMemoryCards] = useState<any[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [memoryMoves, setMemoryMoves] = useState(0);
  const [memoryMatches, setMemoryMatches] = useState(0);
  
  // Spin Wheel State
  const [isSpinning, setIsSpinning] = useState(false);
  const [wheelRotation, setWheelRotation] = useState(0);

  // Cosmetics Equips State
  const [equippedFrame, setEquippedFrame] = useState(localStorage.getItem('eq_frame') || 'none');
  const [equippedTitle, setEquippedTitle] = useState(localStorage.getItem('eq_title') || 'none');
  const [unlockedCosmetics, setUnlockedCosmetics] = useState<string[]>(
    JSON.parse(localStorage.getItem('cosmetics') || '[]')
  );

  // Episode Details State
  const [selectedEpisodeId, setSelectedEpisodeId] = useState<number | null>(null);
  const [episodeDetail, setEpisodeDetail] = useState<any>(null);
  const [episodeDetailLoading, setEpisodeDetailLoading] = useState(false);
  const [quizAnswer, setQuizAnswer] = useState<number | null>(null);
  const [quizResult, setQuizResult] = useState<any>(null);
  const [commentInput, setCommentInput] = useState('');
  const [episodeInteracting, setEpisodeInteracting] = useState(false);
  const [replyingToComment, setReplyingToComment] = useState<any>(null);

  // Admin Section State
  const [adminSection, setAdminSection] = useState('episodes');
  const [adminUsers, setAdminUsers] = useState([]);
  const [adminCodes, setAdminCodes] = useState([]);
  const [adminEpisodeForm, setAdminEpisodeForm] = useState({
    title_ar: '', title_en: '', description: '', thumbnail_url: '', youtube_url: '',
    quiz_question: '', quiz_options: ['', '', '', ''], quiz_correct: 0,
    code: '', code_max_uses: 200, code_expiry: ''
  });
  const [adminSubmitting, setAdminSubmitting] = useState(false);
  const [adminMessage, setAdminMessage] = useState('');
  const [adminCodeForm, setAdminCodeForm] = useState({ code: '', xp_reward: 50, type: 'social', max_uses: 1000, expiry_date: '' });
  const [adminSuggestions, setAdminSuggestions] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);

  // Moderation state
  const [moderationUser, setModerationUser] = useState<{ username: string; id: number } | null>(null);
  const [moderationAction, setModerationAction] = useState('mute');
  const [moderationDuration, setModerationDuration] = useState('1d');

  // PWA Install & Push Notification States
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

  // Detect if already running as installed PWA (standalone)
  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches
      || (window.navigator as any).standalone === true;
    setIsStandalone(standalone);
  }, []);

  // Catch PWA beforeinstallprompt
  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);

      // Check if user dismissed recently (7-day cooldown)
      const dismissedAt = localStorage.getItem('pwa_install_dismissed');
      if (dismissedAt) {
        const daysSince = (Date.now() - Number(dismissedAt)) / (1000 * 60 * 60 * 24);
        if (daysSince < 7) return; // Don't show again within 7 days
      }

      // Don't show if already running as PWA
      const standalone = window.matchMedia('(display-mode: standalone)').matches
        || (window.navigator as any).standalone === true;
      if (standalone) return;

      // Delay showing banner for a smooth experience (3 seconds after page load)
      setTimeout(() => setShowInstallBanner(true), 3000);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // Detect and prompt iOS PWA installation
  useEffect(() => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    const standalone = window.matchMedia('(display-mode: standalone)').matches
      || (window.navigator as any).standalone === true;

    if (isIOS && !standalone) {
      // Check if user dismissed recently (7-day cooldown)
      const dismissedAt = localStorage.getItem('ios_pwa_install_dismissed');
      if (dismissedAt) {
        const daysSince = (Date.now() - Number(dismissedAt)) / (1000 * 60 * 60 * 24);
        if (daysSince < 7) return;
      }
      
      // Delay showing iOS install popup for a smooth experience (3 seconds)
      setTimeout(() => setShowIOSInstall(true), 3000);
    }
  }, []);

  // Sync Push subscription state and handle Service Worker updates on mount
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
        // Unsubscribe
        await existingSub.unsubscribe();
        // Remove from DB
        await fetch(`${API_BASE}/api/notifications/unsubscribe`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: existingSub.endpoint })
        });
        setIsSubscribed(false);
        showToast('تم إلغاء تفعيل الإشعارات.');
      } else {
        // Ask permission
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          showToast('يرجى تفعيل صلاحية الإشعارات من إعدادات المتصفح.');
          setPushLoading(false);
          return;
        }

        // Get VAPID public key
        const keyRes = await fetch(`${API_BASE}/api/notifications/vapid-key`);
        if (!keyRes.ok) {
          const errData = await keyRes.json().catch(() => ({}));
          showToast(errData.error || 'فشل تشغيل الإشعارات: يرجى إعادة تشغيل السيرفر (Backend Server) لقراءة مفاتيح الإشعارات الجديدة.');
          setPushLoading(false);
          return;
        }
        const keyData = await keyRes.json();
        
        // base64 to uint8 helper
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

        // Subscribe browser
        const newSub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedKey
        });

        // Register in backend
        const devType = /iPad|iPhone|iPod/.test(navigator.userAgent) ? 'ios' : (/Android/.test(navigator.userAgent) ? 'android' : 'desktop');
        await fetch(`${API_BASE}/api/notifications/subscribe`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          body: JSON.stringify({
            subscription: newSub,
            device_type: devType
          })
        });

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

  // References
  const chatMessagesRef = useRef(chatMessages);
  const userRef = useRef(user);
  const holdTimeoutRef = useRef<any>(null);
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const swipeMessageIdRef = useRef<number | null>(null);
  const prevMessagesCountRef = useRef<number>(0);
  const prevPageRef = useRef<string>('');

  const changePage = (page: string, params?: any) => {
    let path = '/';
    if (page === 'home') path = '/';
    else if (page === 'episodes') path = '/episodes';
    else if (page === 'episode-detail') {
      const epId = params?.id || selectedEpisodeId || (episodeDetail && episodeDetail.episode ? episodeDetail.episode.id : '');
      path = `/episodes/${epId}`;
    }
    else if (page === 'community') path = '/chat';
    else if (page === 'games') path = '/games';
    else if (page === 'play-game') {
      const code = params?.roomCode || (activeGameRoom ? activeGameRoom.code : '');
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
    
    if (window.location.pathname !== path) {
      window.history.pushState(null, '', path);
    }
    _setCurrentPage(page);
  };

  const setCurrentPage = (page: string) => {
    changePage(page);
  };

  // Toast Functionality
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

  useEffect(() => {
    chatMessagesRef.current = chatMessages;
  }, [chatMessages]);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    if (currentPage === 'community' && chatMessages.length > 0) {
      const maxId = Math.max(...chatMessages.map((m: any) => Number(m.id || 0)));
      if (maxId > lastSeenMessageId) {
        setLastSeenMessageId(maxId);
        localStorage.setItem('lastSeenMessageId', maxId.toString());
      }
    }
  }, [currentPage, chatMessages, lastSeenMessageId]);

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

  // Handle auto-joining pending game code from login/register
  useEffect(() => {
    if (token) {
      const pendingCode = sessionStorage.getItem('pendingGameCode');
      if (pendingCode) {
        sessionStorage.removeItem('pendingGameCode');
        handleJoinGameRoom(pendingCode);
      }
    }
  }, [token]);

  const handleUrlRouting = () => {
    const path = window.location.pathname;
    const params = new URLSearchParams(window.location.search);
    const refUsername = params.get('ref');

    // Handle referral track
    if (refUsername) {
      const activeToken = localStorage.getItem('token') || token;
      let contentType = null;
      let contentId = null;
      
      const epMatch = path.match(/^\/episodes\/(\d+)/);
      const postMatch = path.match(/^\/post\/(\d+)/);
      if (epMatch) {
        contentType = 'episode';
        contentId = parseInt(epMatch[1]);
      } else if (postMatch) {
        contentType = 'community_post';
        contentId = parseInt(postMatch[1]);
      } else {
        const page = params.get('page');
        const cid = params.get('id') || params.get('post');
        if (page === 'episode-detail' && cid) {
          contentType = 'episode';
          contentId = parseInt(cid);
        } else if (page === 'community' && cid) {
          contentType = 'community_post';
          contentId = parseInt(cid);
        }
      }

      fetch(`${API_BASE}/api/share/visit`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(activeToken ? { 'Authorization': `Bearer ${activeToken}` } : {})
        },
        body: JSON.stringify({ 
          referrer: refUsername,
          content_type: contentType,
          content_id: contentId ? parseInt(contentId as any) : null
        })
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          showToast(`You came via a link from @${refUsername}! 🎉`);
        }
      })
      .catch(err => console.error('Error tracking share visit:', err));

      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }

    // Path parsing
    if (path === '/' || path === '') {
      _setCurrentPage('home');
    } else if (path === '/chat') {
      _setCurrentPage('community');
      setCommunityTab('chat');
    } else if (path === '/episodes') {
      _setCurrentPage('episodes');
    } else if (path.startsWith('/episodes/')) {
      const idStr = path.substring('/episodes/'.length);
      const id = parseInt(idStr);
      if (!isNaN(id)) {
        setSelectedEpisodeId(id);
        _setCurrentPage('episode-detail');
        setEpisodeDetailLoading(true);
        fetchEpisodeDetail(id);
      } else {
        _setCurrentPage('episodes');
      }
    } else if (path.startsWith('/post/')) {
      const idStr = path.substring('/post/'.length);
      const id = parseInt(idStr);
      if (!isNaN(id)) {
        _setCurrentPage('home'); // Feed is home
      } else {
        _setCurrentPage('home');
      }
    } else if (path === '/games') {
      _setCurrentPage('games');
    } else if (path.startsWith('/game/')) {
      const roomCode = path.substring('/game/'.length).toUpperCase();
      const activeToken = localStorage.getItem('token') || token;
      if (activeToken) {
        if (activeGameRoom && activeGameRoom.code === roomCode) {
          _setCurrentPage('play-game');
        } else {
          handleJoinGameRoom(roomCode);
        }
      } else {
        sessionStorage.setItem('pendingGameCode', roomCode);
        _setCurrentPage('login');
        showToast('Please log in to join the game room! 🔐');
      }
    } else if (path === '/leaderboard') {
      _setCurrentPage('leaderboard');
    } else if (path === '/rewards') {
      _setCurrentPage('rewards');
    } else if (path === '/profile') {
      _setCurrentPage('profile');
    } else if (path === '/login') {
      _setCurrentPage('login');
    } else if (path === '/register') {
      _setCurrentPage('register');
    } else if (path === '/confirm') {
      _setCurrentPage('confirm');
    } else if (path === '/forgot-password') {
      _setCurrentPage('forgot-password');
    } else if (path === '/reset-password') {
      _setCurrentPage('reset-password');
    } else if (path === '/admin') {
      _setCurrentPage('admin');
    } else {
      _setCurrentPage('home');
    }
  };

  // Initial Fetching & Routing Setup
  useEffect(() => {
    fetchEpisodes();
    fetchCommunityPosts();
    fetchNewsPosts();
    fetchLeaderboard();
    fetchPublicSuggestions();
    fetchFrames();
    fetchXpSettings();

    handleUrlRouting();
    const onPopState = () => {
      handleUrlRouting();
    };
    window.addEventListener('popstate', onPopState);
    return () => {
      window.removeEventListener('popstate', onPopState);
    };
  }, [token]);

  // Listener for news published event to live-refresh feeds
  useEffect(() => {
    const handleNewsPublished = () => {
      fetchNewsPosts();
      fetchCommunityPosts();
    };
    window.addEventListener('news_published', handleNewsPublished);
    return () => window.removeEventListener('news_published', handleNewsPublished);
  }, [token]);

  // Highlight and scroll to a shared community post if the URL path targets one
  useEffect(() => {
    const path = window.location.pathname;
    if (path.startsWith('/post/') && communityPosts.length > 0) {
      const idStr = path.substring('/post/'.length);
      const id = parseInt(idStr);
      if (!isNaN(id)) {
        setTimeout(() => {
          const el = document.getElementById(`post-${id}`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.style.border = '2px solid var(--orange)';
            setTimeout(() => {
              el.style.transition = 'border 1.5s ease-out';
              el.style.border = '1px solid var(--card-border)';
            }, 3000);
          }
        }, 400);
      }
    }
  }, [communityPosts]);

  // Fetch chat messages on mount/page focus
  useEffect(() => {
    if (communityTab === 'chat' && currentPage === 'community') {
      shouldScrollToBottomRef.current = true;
      fetchChatMessages();
    }
  }, [communityTab, currentPage]);

  // Reactive real-time Socket updates (bypasses primitive 1.5s interval polling)
  useEffect(() => {
    const handleChatUpdate = () => {
      if (communityTab === 'chat' && currentPage === 'community') {
        fetchChatMessages();
      }
    };
    socket.on('chat_update', handleChatUpdate);
    return () => {
      socket.off('chat_update', handleChatUpdate);
    };
  }, [communityTab, currentPage]);

  // Autoscroll chat to bottom smartly
  useEffect(() => {
    if (currentPage === 'community') {
      const el = document.getElementById('pl-chat-feed');
      if (el) {
        const isPageChange = prevPageRef.current !== 'community';
        const hasNewMessages = chatMessages.length > prevMessagesCountRef.current;
        const lastMsg = chatMessages[chatMessages.length - 1];
        const sentByMe = lastMsg && user && lastMsg.username === user.username;
        const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;

        if (isPageChange || shouldScrollToBottomRef.current || (hasNewMessages && (sentByMe || isNearBottom))) {
          el.scrollTop = el.scrollHeight;
          if (chatMessages.length > 0) {
            shouldScrollToBottomRef.current = false;
          }
        }
      }
    }
    prevMessagesCountRef.current = chatMessages.length;
    prevPageRef.current = currentPage;
  }, [chatMessages, currentPage, user]);

  useEffect(() => {
    if (currentPage === 'leaderboard') fetchLeaderboard();
  }, [currentPage, leaderboardTab]);

  // Real-time Socket.io updates for multiplayer game rooms
  useEffect(() => {
    if (activeGameRoom && currentPage === 'play-game') {
      // 1. Emit join_game event
      socket.emit('join_game', { roomCode: activeGameRoom.code, username: user?.username });

      // 2. Handle room state update events
      const handleGameUpdate = (data: any) => {
        setActiveGameRoom((prev: any) => {
          if (prev) {
            if (prev.status === 'waiting' && data.status === 'playing') {
              playChatSound('start');
            }
            if (prev.status === 'playing' && data.status === 'finished') {
              playChatSound('win');
            }
          }
          return data;
        });
      };

      const handleGameDeleted = (data: any) => {
        setActiveGameRoom(null);
        setCurrentPage('games');
        if (data && data.message) {
          showToast(data.message);
        }
      };

      const handlePlayerKicked = (data: any) => {
        if (data && data.username === user?.username) {
          setActiveGameRoom(null);
          setCurrentPage('games');
          showToast('لقد تم طردك من الغرفة بواسطة المضيف! 🚨');
          playChatSound('error');
        }
      };

      socket.on('game_update', handleGameUpdate);
      socket.on('game_deleted', handleGameDeleted);
      socket.on('player_kicked', handlePlayerKicked);

      // Fetch initial game state once to sync up (acts as fallback/initial load)
      const fetchInitialStatus = async () => {
        try {
          const res = await fetch(`${API_BASE}/api/games/status/${activeGameRoom.code}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            handleGameUpdate(data);
          } else {
            setActiveGameRoom(null);
            setCurrentPage('games');
          }
        } catch (err) {
          console.error('Initial game fetch failed:', err);
        }
      };
      
      fetchInitialStatus();

      return () => {
        socket.emit('leave_game', { roomCode: activeGameRoom.code, username: user?.username });
        socket.off('game_update', handleGameUpdate);
        socket.off('game_deleted', handleGameDeleted);
        socket.off('player_kicked', handlePlayerKicked);
      };
    }
  }, [activeGameRoom?.code, currentPage, token, user?.username]);

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

  // HTTP API Layer Handlers
  const fetchUserProfile = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data.user);
        if (data.user.last_poll_vote_date === new Date().toISOString().split('T')[0]) {
          setHasVotedPoll(true);
        } else {
          setHasVotedPoll(false);
        }
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
      const res = await fetch(`${API_BASE}/api/xp-settings`);
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
      const res = await fetch(`${API_BASE}/api/users/usernames`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
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
      const res = await fetch(`${API_BASE}/api/user/profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(body)
      });
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

      const formData = new FormData();
      formData.append('image', compressedBlob, file.name.replace(/\.[^/.]+$/, "") + ".jpg");

      const res = await fetch(`${API_BASE}/api/upload/image`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

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

  const handleLikeEpisode = async (episodeId: number) => {
    if (!token) {
      showToast('Please login to like episodes.');
      return;
    }
    playChatSound('react');
    const likeXp = 5;
    // Determine current liked state before optimistic update
    const currentEp = episodes.find((ep: any) => ep.id === episodeId);
    const wasLiked = currentEp?.isLiked ?? (episodeDetail?.episode?.id === episodeId ? episodeDetail.has_liked : false);
    // Optimistic updates
    setEpisodes(prev => prev.map((ep: any) => {
      if (ep.id !== episodeId) return ep;
      return { ...ep, isLiked: !ep.isLiked, likes_count: ep.likes_count + (ep.isLiked ? -1 : 1) };
    }));
    if (episodeDetail && episodeDetail.episode?.id === episodeId) {
      setEpisodeDetail((prev: any) => {
        if (!prev) return prev;
        return {
          ...prev,
          has_liked: !prev.has_liked,
          likes_count: prev.likes_count + (prev.has_liked ? -1 : 1)
        };
      });
    }
    // Optimistic XP update
    const xpDelta = wasLiked ? -likeXp : likeXp;
    setUser((prev: any) => prev ? { ...prev, total_xp: prev.total_xp + xpDelta, weekly_xp: (prev.weekly_xp || 0) + xpDelta } : prev);
    triggerXpPopup(wasLiked ? -likeXp : likeXp);
    try {
      const res = await fetch(`${API_BASE}/api/episodes/${episodeId}/interact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ type: 'like' })
      });
      const data = await res.json();
      if (res.ok) {
        fetchUserProfile();
      } else {
        // Revert optimistic XP
        setUser((prev: any) => prev ? { ...prev, total_xp: prev.total_xp - xpDelta, weekly_xp: (prev.weekly_xp || 0) - xpDelta } : prev);
        fetchEpisodes();
        if (episodeDetail && episodeDetail.episode?.id === episodeId) {
          fetch(`${API_BASE}/api/episodes/${episodeId}`)
            .then(r => r.json())
            .then(d => { if (d.episode) setEpisodeDetail(d); })
            .catch(() => {});
        }
      }
    } catch (e) {
      // Revert optimistic XP
      setUser((prev: any) => prev ? { ...prev, total_xp: prev.total_xp - xpDelta, weekly_xp: (prev.weekly_xp || 0) - xpDelta } : prev);
      fetchEpisodes();
      console.error(e);
    }
  };

  const handleShareEpisode = async (episodeId: number) => {
    const ref = user ? user.username : '';
    const shareLink = `${window.location.origin}/episodes/${episodeId}${ref ? '?ref=' + ref : ''}`;
    copyToClipboard(shareLink).catch(() => {});
    showToast('Episode link copied to clipboard! 🔗');
  };

  const handleShareCommunityPost = async (postId: number) => {
    const ref = user ? user.username : '';
    const shareLink = `${window.location.origin}/post/${postId}${ref ? '?ref=' + ref : ''}`;
    copyToClipboard(shareLink).catch(() => {});
    showToast('Post link copied to clipboard! 🔗');
  };

  const fetchEpisodes = async () => {
    try {
      const headers: any = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`${API_BASE}/api/episodes`, { headers });
      const data = await res.json();
      if (res.ok) setEpisodes(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchFrames = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/frames`);
      const data = await res.json();
      if (res.ok) {
        setFramesCache(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      let url = `${API_BASE}/api/leaderboard?tab=${leaderboardTab}`;
      if (leaderboardTab === 'batch' && user) {
        url += `&batch=${encodeURIComponent(user.batch)}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok) setLeaderboard(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAdminUsers = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/api/admin/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setAdminUsers(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAdminCodes = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/api/admin/xp-codes`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setAdminCodes(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAdminSuggestions = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/api/admin/suggestions`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setAdminSuggestions(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchPublicSuggestions = async () => {
    try {
      const activeToken = localStorage.getItem('token') || token;
      const res = await fetch(`${API_BASE}/api/suggestions`, {
        headers: activeToken ? { 'Authorization': `Bearer ${activeToken}` } : {}
      });
      const data = await res.json();
      if (res.ok) setSuggestions(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAdminCreateCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setAdminSubmitting(true);
    setAdminMessage('');
    try {
      const res = await fetch(`${API_BASE}/api/xp-codes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          code: adminCodeForm.code,
          xp_reward: Number(adminCodeForm.xp_reward),
          type: adminCodeForm.type,
          max_uses: Number(adminCodeForm.max_uses),
          expiry_date: adminCodeForm.expiry_date || null
        })
      });
      const data = await res.json();
      setAdminMessage(data.message || data.error);
      if (res.ok) {
        showToast('XP Code created successfully! 🔑');
        fetchAdminCodes();
        setAdminCodeForm({ code: '', xp_reward: 50, type: 'social', max_uses: 1000, expiry_date: '' });
      }
    } catch (err) {
      setAdminMessage('Failed to connect to the server.');
    } finally {
      setAdminSubmitting(false);
    }
  };

  const handleAdminToggleUserRole = async (userId: number, currentRole: string) => {
    if (!token) return;
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    showConfirm(
      'Change User Role',
      `Are you sure you want to change this user's role to ${newRole === 'admin' ? 'Admin' : 'Student'}?`,
      async () => {
        try {
          const res = await fetch(`${API_BASE}/api/admin/users/${userId}/role`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ role: newRole })
          });
          const data = await res.json();
          if (res.ok) {
            showToast(data.message || 'User role updated! 🎉');
            fetchAdminUsers();
          } else {
            showToast(data.error || 'Failed to update role.');
          }
        } catch (e) {
          showToast('Connection failed.');
        }
      }
    );
  };

  const handleAdminUpdateSuggestionStatus = async (suggestionId: number, status: 'approved' | 'rejected') => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/api/admin/suggestions/${suggestionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        showToast(`Suggestion marked as ${status}! 💡`);
        fetchAdminSuggestions();
        fetchPublicSuggestions();
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to update suggestion.');
      }
    } catch (e) {
      showToast('Connection failed.');
    }
  };

  const handleCreateSuggestion = async (title: string, content: string) => {
    if (!token) {
      showToast('You must be logged in to submit a suggestion. 🔐');
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/suggestions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title, content })
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Thank you! Suggestion submitted successfully. 💡');
        fetchPublicSuggestions();
        triggerXpPopup(50);
        fetchUserProfile();
      } else {
        showToast(data.error || 'Failed to submit suggestion.');
      }
    } catch (e) {
      showToast('Connection failed.');
    }
  };

  const handleUpvoteSuggestion = async (suggestionId: number) => {
    if (!token) {
      showToast('You must be logged in to upvote suggestions. 🔐');
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/suggestions/${suggestionId}/upvote`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        playChatSound('success');
        fetchPublicSuggestions();
      } else {
        showToast(data.error || 'Failed to upvote.');
      }
    } catch (e) {
      showToast('Connection failed.');
    }
  };

  useEffect(() => {
    if (currentPage === 'admin' && (user?.role === 'admin' || user?.role === 'owner')) {
      fetchAdminUsers();
      fetchAdminCodes();
      fetchAdminSuggestions();
    }
  }, [currentPage, user, token]);

  const fetchChatMessages = async (beforeId?: string) => {
    try {
      const headers: any = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      let url = `${API_BASE}/api/chat?limit=30`;
      if (beforeId) {
        url += `&before=${beforeId}`;
        setIsLoadingOlderChat(true);
      }
      const res = await fetch(url, { headers });
      const data = await res.json();
      if (res.ok) {
        if (beforeId) {
          if (data.length < 30) {
            setHasMoreChat(false);
          }
          if (data.length > 0) {
            const el = document.getElementById('pl-chat-feed');
            const prevScrollHeight = el ? el.scrollHeight : 0;
            const prevScrollTop = el ? el.scrollTop : 0;

            setChatMessages(prev => {
              const prevIds = new Set(prev.map((m: any) => m.id));
              const filteredNew = data.filter((m: any) => !prevIds.has(m.id));
              return [...filteredNew, ...prev];
            });

            setTimeout(() => {
              if (el) {
                el.scrollTop = el.scrollHeight - prevScrollHeight + prevScrollTop;
              }
            }, 30);
          }
        } else {
          setHasMoreChat(true);
          if (chatMessagesRef.current && chatMessagesRef.current.length > 0 && data.length > chatMessagesRef.current.length) {
            const currentIds = new Set(chatMessagesRef.current.map((m: any) => m.id));
            const hasNewIncoming = data.some((m: any) => !currentIds.has(m.id) && (!userRef.current || m.username !== userRef.current.username));
            if (hasNewIncoming) {
              playChatSound('receive');
            }
          }
          
          // Preserve any pending (optimistic) messages that are still sending
          const pendingMessages = chatMessagesRef.current.filter((m: any) => m.isPending);
          // Exclude pending messages that have now been confirmed in the server response
          const serverIds = new Set(data.map((m: any) => m.id));
          const filteredPending = pendingMessages.filter((pm: any) => !serverIds.has(pm.id));
          
          setChatMessages([...data, ...filteredPending]);

          const onlineHeader = res.headers.get('X-Online-Count');
          if (onlineHeader) {
            setOnlineCount(parseInt(onlineHeader, 10));
          }
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      if (beforeId) {
        setIsLoadingOlderChat(false);
      }
    }
  };

  const fetchCommunityPosts = async (beforeId?: string) => {
    if (beforeId) {
      setIsLoadingOlderPosts(true);
    }
    try {
      const headers: any = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      let url = `${API_BASE}/api/community/posts?limit=10`;
      if (beforeId) url += `&before=${beforeId}`;
      const res = await fetch(url, { headers });
      const data = await res.json();
      if (res.ok) {
        if (beforeId) {
          setCommunityPosts(prev => {
            const existingIds = new Set(prev.map(p => p.id));
            const newPosts = data.filter((p: any) => !existingIds.has(p.id));
            if (newPosts.length === 0) {
              setHasMorePosts(false);
            }
            return [...prev, ...newPosts];
          });
        } else {
          setCommunityPosts(data);
          setHasMorePosts(data.length >= 10);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingOlderPosts(false);
    }
  };

  const fetchNewsPosts = async () => {
    try {
      const headers: any = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`${API_BASE}/api/community/posts?limit=20&news=true`, { headers });
      const data = await res.json();
      if (res.ok) {
        setNewsPosts(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateGameRoom = async () => {
    if (!token) { showToast('Please login to play 🔐'); return; }
    setIsGameLoading(true);
    setGameError('');
    try {
      const res = await fetch(`${API_BASE}/api/games/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ rounds: createGameRounds, roundDuration: createGameDuration })
      });
      const data = await res.json();
      if (res.ok) {
        setActiveGameRoom(data);
        changePage('play-game', { roomCode: data.code });
      } else {
        setGameError(data.error);
      }
    } catch (e) {
      setGameError('Connection to server failed.');
    } finally {
      setIsGameLoading(false);
    }
  };

  const handleJoinGameRoom = async (code: string) => {
    if (!token) { showToast('Please login to play 🔐'); return; }
    if (!code) { setGameError('Enter room code.'); return; }
    setIsGameLoading(true);
    setGameError('');
    try {
      const res = await fetch(`${API_BASE}/api/games/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ roomCode: code.toUpperCase() })
      });
      const data = await res.json();
      if (res.ok) {
        setActiveGameRoom(data);
        changePage('play-game', { roomCode: data.code });
        setGameRoomCodeInput('');
      } else {
        setGameError(data.error);
      }
    } catch (e) {
      setGameError('Incorrect room code.');
    } finally {
      setIsGameLoading(false);
    }
  };

  const handleStartGame = async () => {
    if (!activeGameRoom || !token) return;
    try {
      const res = await fetch(`${API_BASE}/api/games/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ roomCode: activeGameRoom.code })
      });
      const data = await res.json();
      if (res.ok) setActiveGameRoom(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmitGameAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submittedGameAnswer.trim() || !activeGameRoom || !token) return;
    const ans = submittedGameAnswer;
    setSubmittedGameAnswer('');
    try {
      const res = await fetch(`${API_BASE}/api/games/submit-answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ roomCode: activeGameRoom.code, answer: ans })
      });
      const data = await res.json();
      if (res.ok) {
        if (data.isCorrect) {
          playChatSound('success');
          setActiveGameRoom(data.room);
        } else {
          playChatSound('error');
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleNextRound = async () => {
    if (!activeGameRoom || !token) return;
    try {
      const res = await fetch(`${API_BASE}/api/games/next-round`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ roomCode: activeGameRoom.code })
      });
      const data = await res.json();
      if (res.ok) setActiveGameRoom(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handlePlayAgain = async () => {
    if (!activeGameRoom || !token) return;
    try {
      const res = await fetch(`${API_BASE}/api/games/play-again`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ roomCode: activeGameRoom.code })
      });
      const data = await res.json();
      if (res.ok) setActiveGameRoom(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleLeaveGameRoom = async () => {
    if (!activeGameRoom || !token) return;
    try {
      await fetch(`${API_BASE}/api/games/leave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ roomCode: activeGameRoom.code })
      });
    } catch (e) {
      console.error(e);
    } finally {
      setActiveGameRoom(null);
      setCurrentPage('games');
    }
  };

  const handleRedeem = async (e: any) => {
    e.preventDefault();
    setRedeemError('');
    setRedeemSuccess('');
    if (!token) {
      setRedeemError('Please login first.');
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/xp-codes/redeem`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ code: secretCode })
      });
      const data = await res.json();
      if (res.ok) {
        setRedeemSuccess(data.message);
        setSecretCode('');
        playChatSound('success');
        triggerXpPopup(data.xp_earned);
        fetchUserProfile();
        fetchLeaderboard();
      } else {
        setRedeemError(data.error);
        playChatSound('error');
      }
    } catch (e) {
      setRedeemError('Failed to activate code.');
    }
  };

  const triggerXpPopup = (amount: number) => {
    const id = Date.now() + Math.random();
    setXpPopups(prev => [...prev, { id, amount }]);
    playChatSound(amount > 0 ? 'xp_gain' : 'xp_loss');
    setTimeout(() => {
      setXpPopups(prev => prev.filter(p => p.id !== id));
    }, 1500);
  };

  // Auth Operations
  const handleLogin = async (e: any) => {
    e.preventDefault();
    setAuthError('');
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm)
      });
      const data = await res.json();
      if (res.ok) {
        setToken(data.token);
        setUser(data.user);
        setLoginForm({ username: '', password: '' });
        playChatSound('success');
        if (data.rewards) {
          const totalXpEarned = (data.rewards.daily_login ? (xpSettings.daily_login || 10) : 0) + 
                               (data.rewards.streak_bonus ? (xpSettings.streak_bonus || 70) : 0);
          
          if (data.rewards.daily_login || data.rewards.streak_bonus) {
            setStreakOverlay({
              show: true,
              days: data.user.streak_count || 1,
              xpEarned: totalXpEarned,
              hasStreakBonus: !!data.rewards.streak_bonus
            });
            playChatSound('win');
          }
        }
        if (!sessionStorage.getItem('pendingGameCode')) {
          setCurrentPage('home');
        }
      } else {
        setAuthError(data.error);
      }
    } catch (err) {
      setAuthError('Connection error occurred.');
    }
  };

  const handleRegister = async (e: any) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');
    try {
      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registerForm)
      });
      const data = await res.json();
      if (res.ok) {
        setAuthSuccess(data.message);
        setConfirmEmail(registerForm.email);
        setTimeout(() => {
          setCurrentPage('confirm');
          setAuthSuccess('');
        }, 1500);
      } else {
        setAuthError(data.error);
      }
    } catch (e) {
      setAuthError('Connection error occurred.');
    }
  };

  const handleConfirm = async (e: any) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');
    try {
      const res = await fetch(`${API_BASE}/api/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: confirmEmail, code: confirmCode })
      });
      const data = await res.json();
      if (res.ok) {
        setAuthSuccess(data.message);
        setToken(data.token);
        setUser(data.user);
        setConfirmCode('');

        if (data.rewards) {
          const totalXpEarned = (data.rewards.daily_login ? (xpSettings.daily_login || 10) : 0) + 
                               (data.rewards.streak_bonus ? (xpSettings.streak_bonus || 70) : 0);
          
          if (data.rewards.daily_login || data.rewards.streak_bonus) {
            setStreakOverlay({
              show: true,
              days: data.user.streak_count || 1,
              xpEarned: totalXpEarned,
              hasStreakBonus: !!data.rewards.streak_bonus
            });
            playChatSound('win');
          }
        }

        setTimeout(() => {
          if (!sessionStorage.getItem('pendingGameCode')) {
            setCurrentPage('home');
          }
          setAuthSuccess('');
        }, 1500);
      } else {
        setAuthError(data.error);
      }
    } catch (e) {
      setAuthError('Failed to activate account.');
    }
  };

  const handleForgotPassword = async (email: string) => {
    setAuthError('');
    setAuthSuccess('');
    try {
      const res = await fetch(`${API_BASE}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (res.ok) {
        setAuthSuccess(data.message);
        setForgotEmail(email);
        setTimeout(() => {
          setCurrentPage('reset-password');
          setAuthSuccess('');
        }, 1500);
      } else {
        setAuthError(data.error);
      }
    } catch (e) {
      setAuthError('Connection error occurred.');
    }
  };

  const handleResetPassword = async (code: string, newPassword: string) => {
    setAuthError('');
    setAuthSuccess('');
    try {
      const res = await fetch(`${API_BASE}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail, code, newPassword })
      });
      const data = await res.json();
      if (res.ok) {
        setAuthSuccess(data.message);
        setTimeout(() => {
          setCurrentPage('login');
          setAuthSuccess('');
        }, 2000);
      } else {
        setAuthError(data.error);
      }
    } catch (e) {
      setAuthError('Connection error occurred.');
    }
  };

  const handleLogout = () => {
    setToken('');
    setUser(null);
    setCurrentPage('home');
  };

  const navigateToEpisode = (id: number) => {
    setSelectedEpisodeId(id);
    changePage('episode-detail', { id });
    setEpisodeDetailLoading(true);
    fetchEpisodeDetail(id);
  };

  const fetchEpisodeDetail = async (id: number) => {
    try {
      const headers: any = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`${API_BASE}/api/episodes/${id}`, { headers });
      const data = await res.json();
      if (res.ok) setEpisodeDetail(data);
    } catch (e) {
      console.error(e);
    } finally {
      setEpisodeDetailLoading(false);
    }
  };

  const handleEpisodeInteract = async (type: string, content?: string, parentId?: number) => {
    if (!token || !selectedEpisodeId) return;
    setEpisodeInteracting(true);

    const commentLikeXp = 2;

    // Determine current comment liked state before optimistic update
    let wasCommentLiked = false;
    if (type === 'comment_like' && episodeDetail && episodeDetail.episode?.id === selectedEpisodeId && parentId) {
      for (const c of episodeDetail.comments || []) {
        if (c.id === parentId) { wasCommentLiked = c.has_liked; break; }
        const reply = (c.replies || []).find((r: any) => r.id === parentId);
        if (reply) { wasCommentLiked = reply.has_liked; break; }
      }
    }

    // Optimistic comment likes with XP
    if (type === 'comment_like' && episodeDetail && episodeDetail.episode?.id === selectedEpisodeId) {
      setEpisodeDetail((prev: any) => {
        if (!prev) return prev;
        const updatedComments = prev.comments.map((c: any) => {
          if (c.id === parentId) {
            return { ...c, has_liked: !c.has_liked, likes_count: c.likes_count + (c.has_liked ? -1 : 1) };
          }
          if (c.replies) {
            return {
              ...c,
              replies: c.replies.map((r: any) =>
                r.id === parentId ? { ...r, has_liked: !r.has_liked, likes_count: r.likes_count + (r.has_liked ? -1 : 1) } : r
              )
            };
          }
          return c;
        });
        return { ...prev, comments: updatedComments };
      });
      const xpDelta = wasCommentLiked ? -commentLikeXp : commentLikeXp;
      setUser((prev: any) => prev ? { ...prev, total_xp: prev.total_xp + xpDelta, weekly_xp: (prev.weekly_xp || 0) + xpDelta } : prev);
      triggerXpPopup(wasCommentLiked ? -commentLikeXp : commentLikeXp);
    }

    // Optimistic episode like (on detail page)
    if (type === 'like' && episodeDetail && episodeDetail.episode?.id === selectedEpisodeId) {
      setEpisodeDetail((prev: any) => {
        if (!prev) return prev;
        const wasLiked = prev.has_liked;
        return {
          ...prev,
          has_liked: !prev.has_liked,
          likes_count: prev.likes_count + (prev.has_liked ? -1 : 1)
        };
      });
    }

    try {
      const res = await fetch(`${API_BASE}/api/episodes/${selectedEpisodeId}/interact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ type, content, parent_id: parentId })
      });
      const data = await res.json();
      if (res.ok) {
        if (data.xp_earned) triggerXpPopup(data.xp_earned);
        if (type !== 'comment_like' && type !== 'like') {
          fetchEpisodeDetail(selectedEpisodeId);
        }
        fetchUserProfile();
        if (type === 'comment') {
          setCommentInput('');
          setReplyingToComment(null);
        }
      } else {
        // Revert on error
        fetchEpisodeDetail(selectedEpisodeId);
        fetchUserProfile();
      }
    } catch (e) {
      console.error(e);
      fetchEpisodeDetail(selectedEpisodeId);
      fetchUserProfile();
    } finally {
      setEpisodeInteracting(false);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/api/comments/${commentId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        showToast('Comment deleted.');
        fetchEpisodeDetail(selectedEpisodeId!);
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to delete comment.');
      }
    } catch (e) {
      showToast('Error deleting comment.');
    }
  };

  const handleEditComment = async (commentId: number, content: string) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/api/comments/${commentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ content })
      });
      if (res.ok) {
        showToast('Comment updated.');
        fetchEpisodeDetail(selectedEpisodeId!);
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to edit comment.');
      }
    } catch (e) {
      showToast('Error editing comment.');
    }
  };

  const handleQuizSubmit = async (quizId: number) => {
    if (quizAnswer === null || !token) return;
    try {
      const res = await fetch(`${API_BASE}/api/episodes/${selectedEpisodeId}/quiz/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ quiz_id: quizId, answer_index: quizAnswer })
      });
      const data = await res.json();
      if (res.ok || res.status === 400) {
        setQuizResult(data);
        if (data.is_correct && data.xp_earned > 0) {
          triggerXpPopup(data.xp_earned);
          playChatSound('success');
          fetchUserProfile();
        } else {
          playChatSound('error');
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Community Feed Interaction API calls
  const handleCreatePost = async (title: string, content: string, imageUrl: string, isNews: boolean = false) => {
    if (!content.trim() || !token) return;
    try {
      const res = await fetch(`${API_BASE}/api/community/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ title, content, image_url: imageUrl, is_news: isNews })
      });
      const data = await res.json();
      if (res.ok) {
        setNewPostContent('');
        playChatSound('send');
        triggerXpPopup(data.xp_reward);
        fetchCommunityPosts();
        if (isNews) {
          fetchNewsPosts();
        }
        fetchUserProfile();
      } else {
        showToast(data.error || 'Failed to publish post.');
      }
    } catch (e) {
      console.error(e);
      showToast('Error publishing post.');
    }
  };

  const handleLikePost = async (postId: number) => {
    if (!token) { showToast('Login to interact 🔐'); return; }
    playChatSound('react');
    const postXp = 5;
    const currentPost = communityPosts.find(p => p.id === postId);
    const wasLiked = currentPost?.isLiked ?? false;
    try {
      // Optimistic state update
      setCommunityPosts(prev => prev.map(p => {
        if (p.id !== postId) return p;
        return {
          ...p,
          isLiked: !p.isLiked,
          likes_count: p.likes_count + (p.isLiked ? -1 : 1)
        };
      }));
      const xpDelta = wasLiked ? -postXp : postXp;
      setUser((prev: any) => prev ? { ...prev, total_xp: prev.total_xp + xpDelta, weekly_xp: (prev.weekly_xp || 0) + xpDelta } : prev);
      triggerXpPopup(wasLiked ? -postXp : postXp);

      const res = await fetch(`${API_BASE}/api/community/posts/${postId}/like`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        fetchCommunityPosts();
        fetchUserProfile();
      } else {
        const data = await res.json();
        if (data.total_xp !== undefined) {
          setUser((prev: any) => prev ? { ...prev, total_xp: data.total_xp, weekly_xp: data.weekly_xp } : prev);
        }
      }
    } catch (e) {
      fetchCommunityPosts();
      fetchUserProfile();
    }
  };

  // Chat contextual and swipe gesture handlers
  const handleChatContextMenu = (e: React.MouseEvent, msg: any) => {
    e.preventDefault();
    if (!user) return;
    setActiveContextMenu({
      messageId: msg.id,
      msg,
      x: e.clientX,
      y: e.clientY
    });
  };

  const handleChatTouchStart = (e: React.TouchEvent, msg: any) => {
    if (!user) return;
    const touch = e.touches[0];
    const clientX = touch.clientX;
    const clientY = touch.clientY;
    
    if (holdTimeoutRef.current) clearTimeout(holdTimeoutRef.current);
    
    holdTimeoutRef.current = setTimeout(() => {
      if (navigator.vibrate) {
        navigator.vibrate(40);
      }
      setActiveContextMenu({
        messageId: msg.id,
        msg,
        x: clientX,
        y: clientY
      });
    }, 600);

    touchStartXRef.current = touch.clientX;
    touchStartYRef.current = touch.clientY;
    swipeMessageIdRef.current = msg.id;
  };

  const handleChatTouchMove = (e: React.TouchEvent, msg: any) => {
    if (holdTimeoutRef.current) {
      clearTimeout(holdTimeoutRef.current);
      holdTimeoutRef.current = null;
    }

    if (touchStartXRef.current === null || swipeMessageIdRef.current !== msg.id) return;
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartXRef.current;
    const deltaY = touch.clientY - touchStartYRef.current;

    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
      if (e.cancelable) e.preventDefault();
      const dragX = deltaX > 0 ? Math.min(70, deltaX) : Math.max(-70, deltaX);
      setSwipeTranslateX(prev => ({ ...prev, [msg.id]: dragX }));
    }
  };

  const handleChatTouchEnd = (e: React.TouchEvent, msg: any) => {
    if (holdTimeoutRef.current) {
      clearTimeout(holdTimeoutRef.current);
      holdTimeoutRef.current = null;
    }

    if (swipeMessageIdRef.current === msg.id) {
      const currentTranslateX = swipeTranslateX[msg.id] || 0;
      if (Math.abs(currentTranslateX) > 45) {
        setReplyingTo({
          id: msg.id,
          username: msg.username,
          message: msg.message
        });
        playChatSound('react');
      }
      setSwipeTranslateX(prev => {
        const updated = { ...prev };
        delete updated[msg.id];
        return updated;
      });
    }

    touchStartXRef.current = null;
    touchStartYRef.current = null;
    swipeMessageIdRef.current = null;
  };

  // Chat posting
  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const messageText = chatInput.trim();
    if (!messageText || !token) return;

    if (editingMessage) {
      handleEditMessage(editingMessage.id, messageText);
      return;
    }

    // Keep mobile keyboard open by refocusing
    setTimeout(() => {
      document.getElementById('community-chat-input')?.focus();
    }, 50);

    // Create optimistic message
    const optimisticId = -Date.now();
    const optimisticMsg = {
      id: optimisticId,
      user_id: user?.id || 0,
      username: user?.username || 'Me',
      batch: user?.batch || '',
      rank: user?.rank || { name_en: 'Anatomy Rookie', emoji: '🧪', tier: 1 },
      message: messageText,
      created_at: new Date().toISOString(),
      avatar_url: user?.avatar_url || null,
      equipped_frame: user?.equipped_frame || 'none',
      role: user?.role || 'student',
      reply_to: replyingTo ? {
        id: replyingTo.id,
        username: replyingTo.username,
        message: replyingTo.message
      } : null,
      reactions: [],
      is_edited: 0,
      isPending: true
    };

    // Update messages locally instantly
    setChatMessages(prev => [...prev, optimisticMsg]);
    // Manually sync ref so polling doesn't lose the optimistic message
    chatMessagesRef.current = [...chatMessagesRef.current, optimisticMsg];
    setChatInput('');
    setReplyingTo(null);

    try {
      const res = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ message: messageText, reply_to_id: optimisticMsg.reply_to?.id || null })
      });
      const data = await res.json();
      if (res.ok) {
        playChatSound('send');
        setChatMessages(prev => prev.map(m => m.id === optimisticId ? { ...m, id: data.id, isPending: false, equipped_frame: data.equipped_frame || m.equipped_frame, role: data.role || m.role, avatar_url: data.avatar_url || m.avatar_url, batch: data.batch || m.batch, rank: data.rank || m.rank } : m));
        chatMessagesRef.current = chatMessagesRef.current.map(m => m.id === optimisticId ? { ...m, id: data.id, isPending: false, equipped_frame: data.equipped_frame || m.equipped_frame, role: data.role || m.role, avatar_url: data.avatar_url || m.avatar_url, batch: data.batch || m.batch, rank: data.rank || m.rank } : m);
      } else {
        // Remove optimistic message if error occurred
        setChatMessages(prev => prev.filter(m => m.id !== optimisticId));
        showToast(data.error || 'Failed to send message');
      }
    } catch (err) {
      console.error(err);
      setChatMessages(prev => prev.filter(m => m.id !== optimisticId));
      showToast('Network error: Failed to send message');
    }
  };

  const handleToggleReaction = async (messageId: number, emoji: string) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/api/chat/${messageId}/react`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ emoji })
      });
      if (res.ok) {
        playChatSound('react');
        fetchChatMessages();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditMessage = async (messageId: number, newMessage: string) => {
    if (!token || !newMessage.trim()) return;
    try {
      const res = await fetch(`${API_BASE}/api/chat/${messageId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ message: newMessage.trim() })
      });
      if (res.ok) {
        setChatInput('');
        setEditingMessage(null);
        showToast('Message edited successfully');
        fetchChatMessages();
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to edit message');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteMessage = async (messageId: number) => {
    if (!token) return;
    showConfirm(
      'Delete Message',
      'Are you sure you want to delete this message?',
      async () => {
        try {
          const res = await fetch(`${API_BASE}/api/chat/${messageId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            showToast('Message deleted');
            fetchChatMessages();
          } else {
            const data = await res.json();
            showToast(data.error || 'Failed to delete message');
          }
        } catch (err) {
          console.error(err);
        }
      }
    );
  };

  const handleBulkDeleteMessages = async () => {
    if (!token || selectedMessageIds.length === 0) return;
    showConfirm(
      'Delete Multiple Messages',
      `Are you sure you want to delete ${selectedMessageIds.length} selected messages?`,
      async () => {
        try {
          const res = await fetch(`${API_BASE}/api/chat/delete-bulk`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ messageIds: selectedMessageIds })
          });
          if (res.ok) {
            showToast('Selected messages deleted');
            setIsMultiSelectMode(false);
            setSelectedMessageIds([]);
            fetchChatMessages();
          } else {
            const data = await res.json();
            showToast(data.error || 'Failed to delete messages');
          }
        } catch (err) {
          console.error(err);
        }
      }
    );
  };

  // Memory Game Logic
  const initMemoryGame = () => {
    const terms = ['Femur 🦴', 'Deltoid 💪', 'ACL 🎗️', 'Neuron 🧠', 'Patella 🥏', 'Spasticity ⚡', 'Clavicle 🦴', 'Synapse ⚡'];
    const deck = [...terms, ...terms]
      .map((val, idx) => ({ id: idx, value: val, isFlipped: false, isMatched: false }))
      .sort(() => Math.random() - 0.5);
    setMemoryCards(deck);
    setFlippedCards([]);
    setMemoryMoves(0);
    setMemoryMatches(0);
    setGameFinished(false);
    setGamePlaySuccess('');
    setGamePlayError('');
  };

  const handleCardClick = (index: number) => {
    if (flippedCards.length === 2 || memoryCards[index].isFlipped || memoryCards[index].isMatched) return;
    
    const newCards = [...memoryCards];
    newCards[index].isFlipped = true;
    setMemoryCards(newCards);
    
    const nextFlipped = [...flippedCards, index];
    setFlippedCards(nextFlipped);
    
    if (nextFlipped.length === 2) {
      setMemoryMoves(prev => prev + 1);
      const [firstIdx, secondIdx] = nextFlipped;
      if (newCards[firstIdx].value === newCards[secondIdx].value) {
        // Match!
        newCards[firstIdx].isMatched = true;
        newCards[secondIdx].isMatched = true;
        setMemoryCards(newCards);
        setFlippedCards([]);
        setMemoryMatches(prev => {
          const total = prev + 1;
          if (total === 8) {
            setGameFinished(true);
            playChatSound('win');
            claimGameXP();
          } else {
            playChatSound('success');
          }
          return total;
        });
      } else {
        // No match
        setTimeout(() => {
          newCards[firstIdx].isFlipped = false;
          newCards[secondIdx].isFlipped = false;
          setMemoryCards(newCards);
          setFlippedCards([]);
          playChatSound('error');
        }, 1000);
      }
    }
  };

  const claimGameXP = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/api/games/1/play`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setGamePlaySuccess(data.message);
        triggerXpPopup(data.xp_earned);
        fetchUserProfile();
      } else {
        setGamePlayError(data.error);
      }
    } catch (e) {
      setGamePlayError('Failed to save game score.');
    }
  };

  // Spin Wheel Operations
  const handleSpinWheelClick = () => {
    if (isSpinning) return;
    setIsSpinning(true);
    // Random angle between 1440 and 2160 degrees
    const randomDegree = 1440 + Math.floor(Math.random() * 720);
    const startAngle = wheelRotation;
    const newRot = startAngle + randomDegree;
    playChatSound('start');

    // Run a high-precision animation frame loop to play tick clicks exactly as segment lines cross 12 o'clock
    const startTime = performance.now();
    const duration = 5000; // 5 seconds high-suspense physical decay
    let lastSegmentIndex = Math.floor((startAngle - 15) / 30);
    let lastTickTime = 0;

    const animateTicks = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Quintic ease-out curve matches the beautiful physical deceleration friction
      const easeProgress = 1 - Math.pow(1 - progress, 5);
      const currentAngle = startAngle + easeProgress * randomDegree;
      
      // Update rotation in real-time frame by frame (smooth SVG updates)
      setWheelRotation(currentAngle);

      // Play tick sound when boundary lines (30 degrees step with 15 degrees offset) cross 12 o'clock
      const currentSegmentIndex = Math.floor((currentAngle - 15) / 30);
      
      if (currentSegmentIndex !== lastSegmentIndex) {
        const timeNow = performance.now();
        // Dynamic throttle: as the wheel slows down, allow faster or slower ticks naturally
        const minThrottle = progress > 0.8 ? 80 : 35; 
        if (timeNow - lastTickTime > minThrottle) {
          playChatSound('tick');
          lastTickTime = timeNow;
        }
        lastSegmentIndex = currentSegmentIndex;
      }

      if (progress < 1) {
        requestAnimationFrame(animateTicks);
      }
    };
    // Start tracking ticks
    requestAnimationFrame(animateTicks);

    setTimeout(() => {
      // Ensure the rotation lands precisely at the final target angle
      setWheelRotation(newRot);

      // Math formula for 12 segments centered under the 12 o'clock pointer (0° relative to drawing, not 270°)
      const actualDeg = (360 - (newRot % 360)) % 360;
      const segs = [
        'Mystery Box 🎁', 
        '+5 XP ⚡', 
        '+30 XP ⚡', 
        '+100 XP ⚡', 
        'Try Again 🍀', 
        '+15 XP ⚡', 
        '+5 XP ⚡', 
        '+50 XP ⚡', 
        'Try Again 🍀', 
        '+20 XP ⚡', 
        '+10 XP ⚡', 
        '+5 XP ⚡'
      ];
      // Use Math.round for closest segment center matching
      const prizeIdx = Math.round(actualDeg / 30) % 12;
      const prize = segs[prizeIdx];

      showToast(`Spin Wheel: You won ${prize}`);
      let xpAmt = 0;
      if (prize.includes('XP') || prize.includes('Mystery')) {
        playChatSound('win');
        const match = prize.match(/\+(\d+)\s*XP/);
        if (match) {
          xpAmt = parseInt(match[1], 10);
        } else if (prize.includes('Mystery')) {
          xpAmt = 40; // Mystery box default
        }
        if (xpAmt > 0) {
          triggerXpPopup(xpAmt);
        }
      } else {
        playChatSound('error');
      }
      if (prize.includes('Try Again')) {
        claimSpinWheelReward(0, prize);
      } else {
        const todayStr = getLocalDateString();
        setUser((prev: any) => prev ? { ...prev, last_spin_wheel_date: todayStr } : null);
        claimSpinWheelReward(xpAmt, prize);
      }
    }, 5000);
  };

  const handleClaimSurpriseBox = async () => {
    if (!token) return;
    const todayStr = getLocalDateString();
    setUser((prev: any) => prev ? { ...prev, last_surprise_box_date: todayStr } : null);
    try {
      const res = await fetch(`${API_BASE}/api/rewards/surprise-box`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ clientDate: todayStr })
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || 'Opened daily surprise box! You earned +50 XP ⚡');
        triggerXpPopup(data.xp_earned || 50);
        playChatSound('win');
        fetchUserProfile();
      } else {
        setUser((prev: any) => prev ? { ...prev, last_surprise_box_date: null } : null);
        showToast(data.error || 'Failed to claim daily surprise box.');
        playChatSound('error');
      }
    } catch (err) {
      setUser((prev: any) => prev ? { ...prev, last_surprise_box_date: null } : null);
      showToast('Connection error.');
    }
  };

  const claimSpinWheelReward = async (amount: number, prizeLabel?: string) => {
    if (!token) {
      setIsSpinning(false);
      return;
    }
    const todayStr = getLocalDateString();
    try {
      const res = await fetch(`${API_BASE}/api/rewards/spin-wheel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ xpAmount: amount, clientDate: todayStr, prizeLabel })
      });
      const data = await res.json();
      if (res.ok) {
        if (data.try_again) {
          showToast('Try Again! You get another spin! 🍀');
          setUser((prev: any) => prev ? { ...prev, last_spin_wheel_date: null } : null);
        }
        fetchUserProfile();
      } else {
        setUser((prev: any) => prev ? { ...prev, last_spin_wheel_date: null } : null);
        showToast(data.error || 'Failed to claim spin wheel reward.');
      }
    } catch (err) {
      setUser((prev: any) => prev ? { ...prev, last_spin_wheel_date: null } : null);
      showToast('Connection error.');
    } finally {
      setIsSpinning(false);
    }
  };

  const claimMockReward = async (amount: number) => {
    if (!token) return;
    try {
      // Simulate rewards using single game plays endpoint to increment database score
      await fetch(`${API_BASE}/api/games/1/play`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
      });
      fetchUserProfile();
    } catch (e) {}
  };

  const handleAdminDeleteCode = (codeId: number, codeName: string) => {
    showConfirm(
      'Delete XP Code',
      `Are you sure you want to delete the XP Code "${codeName}"? This action cannot be undone.`,
      async () => {
        if (!token) return;
        try {
          const res = await fetch(`${API_BASE}/api/admin/xp-codes/${codeId}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          const data = await res.json();
          if (res.ok) {
            showToast(data.message || 'XP Code deleted successfully.');
            fetchAdminCodes();
          } else {
            showToast(data.error || 'Failed to delete XP Code.');
          }
        } catch (err) {
          showToast('Connection error.');
        }
      },
      undefined,
      'Delete',
      'Cancel',
      'danger'
    );
  };

  const handleDeletePost = (postId: number) => {
    showConfirm(
      'Delete Post',
      'Are you sure you want to delete this post? This action cannot be undone.',
      async () => {
        if (!token) return;
        try {
          const res = await fetch(`${API_BASE}/api/community/posts/${postId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const data = await res.json();
          if (res.ok) {
            showToast(data.message || 'Post deleted successfully.');
            fetchCommunityPosts();
          } else {
            showToast(data.error || 'Failed to delete post.');
          }
        } catch (err) {
          showToast('Connection error.');
        }
      },
      undefined, 'Delete', 'Cancel', 'danger'
    );
  };

  const handleEditPost = async (postId: number, content: string, imageUrl: string, title?: string | null) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/api/community/posts/${postId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          title: title || null,
          content, 
          image_url: imageUrl || null 
        })
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || 'Post updated successfully!');
        fetchCommunityPosts();
        fetchNewsPosts();
      } else {
        showToast(data.error || 'Failed to update post.');
      }
    } catch (err) {
      showToast('Connection error.');
    }
  };

  const handleDeleteSuggestion = (suggestionId: number) => {
    showConfirm(
      'Delete Suggestion',
      'Are you sure you want to delete this suggestion? This action cannot be undone.',
      async () => {
        if (!token) return;
        try {
          const res = await fetch(`${API_BASE}/api/suggestions/${suggestionId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const data = await res.json();
          if (res.ok) {
            showToast(data.message || 'Suggestion deleted.');
            fetchPublicSuggestions();
            fetchAdminSuggestions();
          } else {
            showToast(data.error || 'Failed to delete suggestion.');
          }
        } catch (err) {
          showToast('Connection error.');
        }
      },
      undefined, 'Delete', 'Cancel', 'danger'
    );
  };

  const handleAdminDeleteUser = (userId: number, username: string) => {
    showConfirm(
      'Delete User Permanently',
      `⚠️ This will permanently delete user "${username}" and ALL their data (posts, messages, suggestions, XP, etc). This cannot be undone!`,
      async () => {
        if (!token) return;
        try {
          const res = await fetch(`${API_BASE}/api/admin/users/${userId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const data = await res.json();
          if (res.ok) {
            showToast(data.message || 'User deleted successfully.');
            fetchAdminUsers();
          } else {
            showToast(data.error || 'Failed to delete user.');
          }
        } catch (err) {
          showToast('Connection error.');
        }
      },
      undefined, 'Delete User', 'Cancel', 'danger'
    );
  };

  const handleOpenModerationModal = (username: string, userId: number) => {
    setModerationUser({ username, id: userId });
    setModerationAction('mute');
    setModerationDuration('1d');
  };

  const handleAdminModerateUser = async () => {
    if (!token || !moderationUser) return;
    try {
      const res = await fetch(`${API_BASE}/api/admin/users/${moderationUser.id}/moderate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          action: moderationAction,
          duration: moderationDuration
        })
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || `Successfully moderated @${moderationUser.username}`);
        setModerationUser(null);
        if (currentPage === 'admin') {
          fetchAdminUsers();
        }
      } else {
        showToast(data.error || 'Failed to apply moderation action.');
      }
    } catch (err) {
      showToast('Connection failed.');
    }
  };

  const renderModerationModal = () => {
    return (
      <AnimatePresence>
        {moderationUser && (
          <div 
            className="fixed inset-0 z-[11000] bg-black/85 backdrop-blur-xs flex items-center justify-center p-4"
            onClick={() => setModerationUser(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="w-full max-w-sm rounded-2xl border border-white/8 bg-zinc-950/95 p-6 shadow-2xl relative"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-5 pb-3 border-b border-zinc-900">
                <div className="flex items-center gap-2 text-brand-orange">
                  <ShieldAlert className="w-5 h-5 shrink-0" />
                  <h3 className="text-sm font-black uppercase tracking-wider">
                    Moderation: @{moderationUser.username}
                  </h3>
                </div>
                <button
                  onClick={() => setModerationUser(null)}
                  className="text-zinc-500 hover:text-white cursor-pointer transition-colors p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Action Select */}
                <div className="flex flex-col gap-1.5 text-left">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">Select Action</label>
                  <select
                    className="w-full bg-zinc-900/60 border border-zinc-800 focus:border-brand-orange focus:ring-1 focus:ring-brand-orange/30 text-white rounded-xl px-3.5 py-2.5 text-xs font-bold outline-none transition-all cursor-pointer"
                    value={moderationAction}
                    onChange={(e) => setModerationAction(e.target.value)}
                  >
                    <option value="mute">Mute User (Chat & Comments)</option>
                    <option value="unmute">Unmute User</option>
                    <option value="ban">Ban User (Login Restriction)</option>
                    <option value="unban">Unban User</option>
                  </select>
                </div>

                {/* Duration Select */}
                {(moderationAction === 'mute' || moderationAction === 'ban') && (
                  <div className="flex flex-col gap-1.5 text-left">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">Duration</label>
                    <select
                      className="w-full bg-zinc-900/60 border border-zinc-800 focus:border-brand-orange focus:ring-1 focus:ring-brand-orange/30 text-white rounded-xl px-3.5 py-2.5 text-xs font-bold outline-none transition-all cursor-pointer"
                      value={moderationDuration}
                      onChange={(e) => setModerationDuration(e.target.value)}
                    >
                      <option value="1h">1 Hour</option>
                      <option value="1d">1 Day</option>
                      <option value="1w">1 Week</option>
                      <option value="permanent">Permanent</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mt-6">
                <button
                  className="flex-1 bg-gradient-to-r from-brand-orange to-brand-amber text-black font-black text-xs py-3 rounded-xl cursor-pointer hover:shadow-orange-intense active:scale-95 transition-all shadow-orange-glow"
                  onClick={handleAdminModerateUser}
                >
                  Apply Action
                </button>
                <button
                  className="flex-1 border border-zinc-800 hover:bg-zinc-900 text-zinc-300 font-bold text-xs py-3 rounded-xl cursor-pointer transition-all active:scale-95"
                  onClick={() => setModerationUser(null)}
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    );
  };

  // Shop Purchases
  const handleShopPurchase = (itemId: string, cost: number) => {
    if (!user) { showToast('Login to browse the shop 🔐'); return; }
    if (user.total_xp < cost) {
      showToast('You do not have enough XP to purchase! 😢');
      playChatSound('error');
      return;
    }
    if (unlockedCosmetics.includes(itemId)) {
      showToast('You already own this item!');
      return;
    }
    showConfirm(
      'Confirm Purchase',
      `Do you want to buy this item for ${cost} XP?`,
      () => {
        const nextUnlocked = [...unlockedCosmetics, itemId];
        setUnlockedCosmetics(nextUnlocked);
        localStorage.setItem('cosmetics', JSON.stringify(nextUnlocked));
        showToast('Purchase successful! 🎉 Go to your profile to equip it.');
        playChatSound('success');
      }
    );
  };

  // Poll Vote Handler
  const handlePollVote = async (idx: number) => {
    if (hasVotedPoll) return;
    setPollVotes(prev => {
      const next = [...prev];
      next[idx] = next[idx] + 1;
      return next;
    });
    setHasVotedPoll(true);
    setUserVotedOption(idx);
    playChatSound('success');
    
    const xpGain = xpSettings.poll_vote !== undefined ? xpSettings.poll_vote : 30;
    triggerXpPopup(xpGain);
    
    if (token) {
      try {
        await fetch(`${API_BASE}/api/rewards/poll-vote`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ clientDate: new Date().toISOString().split('T')[0] })
        });
        fetchUserProfile();
      } catch (err) {
        console.error('Failed to claim poll vote XP reward:', err);
      }
    }
  };

  // Admin and other helpers
  const handleAdminCreateEpisode = async (e: any) => {
    e.preventDefault();
    setAdminSubmitting(true);
    setAdminMessage('');
    try {
      const body: any = {
        title_ar: adminEpisodeForm.title_ar, title_en: adminEpisodeForm.title_en,
        description: adminEpisodeForm.description, thumbnail_url: adminEpisodeForm.thumbnail_url,
        youtube_url: adminEpisodeForm.youtube_url
      };
      if (adminEpisodeForm.quiz_question) {
        body.quiz = {
          question: adminEpisodeForm.quiz_question,
          options: adminEpisodeForm.quiz_options.filter((o: string) => o.trim()),
          correct_option_index: adminEpisodeForm.quiz_correct
        };
      }
      if (adminEpisodeForm.code) {
        body.xp_code = { code: adminEpisodeForm.code, max_uses: adminEpisodeForm.code_max_uses, expiry_date: adminEpisodeForm.code_expiry || null };
      }
      const res = await fetch(`${API_BASE}/api/admin/episode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      setAdminMessage(data.message || data.error);
      if (res.ok) {
        fetchEpisodes();
        setAdminEpisodeForm({ title_ar: '', title_en: '', description: '', thumbnail_url: '', youtube_url: '', quiz_question: '', quiz_options: ['', '', '', ''], quiz_correct: 0, code: '', code_max_uses: 200, code_expiry: '' });
      }
    } catch (err) {
      setAdminMessage('Connection to server failed.');
    } finally {
      setAdminSubmitting(false);
    }
  };

  // Sub-pages render functions
  const renderHome = () => {
    return (
      <Home
        user={user}
        loginReward={loginReward}
        navigateToEpisode={navigateToEpisode}
        setCurrentPage={setCurrentPage}
        setCommunityTab={setCommunityTab}
        pollVotes={pollVotes}
        userVotedOption={userVotedOption}
        hasVotedPoll={hasVotedPoll}
        handlePollVote={handlePollVote}
        newPostContent={newPostContent}
        setNewPostContent={setNewPostContent}
        handleCreatePost={handleCreatePost}
        handleEditPost={handleEditPost}
        communityPosts={communityPosts}
        handleLikePost={handleLikePost}
        handleDeletePost={handleDeletePost}
        handleSharePost={handleShareCommunityPost}
        handleUploadImage={handleUploadImage}
        usernames={usernamesDirectory}
        showToast={showToast}
        equippedFrame={equippedFrame}
        leaderboard={leaderboard}
        episodes={episodes}
        triggerXpPopup={triggerXpPopup}
        xpSettings={xpSettings}
        newsPosts={newsPosts}
        loadOlderPosts={fetchCommunityPosts}
        isLoadingOlderPosts={isLoadingOlderPosts}
        hasMorePosts={hasMorePosts}
      />
    );
  };

  const renderNewsPage = () => {
    return (
      <News
        user={user}
        newsPosts={newsPosts}
        handleLikePost={handleLikePost}
        handleDeletePost={handleDeletePost}
        handleSharePost={handleShareCommunityPost}
        handleUploadImage={handleUploadImage}
        handleEditPost={handleEditPost}
        setCurrentPage={setCurrentPage}
        showToast={showToast}
        equippedFrame={equippedFrame}
      />
    );
  };

  const renderEpisodesPage = () => {
    return (
      <Episodes
        episodes={episodes}
        navigateToEpisode={navigateToEpisode}
        handleLikeEpisode={handleLikeEpisode}
        handleShareEpisode={handleShareEpisode}
        user={user}
      />
    );
  };

  const renderEpisodeDetailPage = () => {
    return (
      <EpisodeDetail
        episodeDetailLoading={episodeDetailLoading}
        episodeDetail={episodeDetail}
        episodeInteracting={episodeInteracting}
        user={user}
        setCurrentPage={setCurrentPage}
        handleEpisodeInteract={handleEpisodeInteract}
        handleQuizSubmit={handleQuizSubmit}
        redeemError={redeemError}
        redeemSuccess={redeemSuccess}
        handleRedeem={handleRedeem}
        secretCode={secretCode}
        setSecretCode={setSecretCode}
        quizResult={quizResult}
        setQuizResult={setQuizResult}
        quizAnswer={quizAnswer}
        setQuizAnswer={setQuizAnswer}
        commentInput={commentInput}
        setCommentInput={setCommentInput}
        replyingToComment={replyingToComment}
        setReplyingToComment={setReplyingToComment}
        handleOpenModerationModal={handleOpenModerationModal}
        handleDeleteComment={handleDeleteComment}
        handleEditComment={handleEditComment}
        usernames={usernamesDirectory}
        showToast={showToast}
      />
    );
  };

  const renderCommunityPage = () => {
    return (
      <Community
        user={user}
        onlineCount={onlineCount}
        chatMessages={chatMessages}
        isMultiSelectMode={isMultiSelectMode}
        setIsMultiSelectMode={setIsMultiSelectMode}
        selectedMessageIds={selectedMessageIds}
        setSelectedMessageIds={setSelectedMessageIds}
        swipeTranslateX={swipeTranslateX}
        swipeMessageIdRef={swipeMessageIdRef}
        replyingTo={replyingTo}
        setReplyingTo={setReplyingTo}
        editingMessage={editingMessage}
        setEditingMessage={setEditingMessage}
        chatInput={chatInput}
        setChatInput={setChatInput}
        handleSendChatMessage={handleSendChatMessage}
        setCurrentPage={setCurrentPage}
        activeContextMenu={activeContextMenu}
        setActiveContextMenu={setActiveContextMenu}
        handleChatContextMenu={handleChatContextMenu}
        handleChatTouchStart={handleChatTouchStart}
        handleChatTouchMove={handleChatTouchMove}
        handleChatTouchEnd={handleChatTouchEnd}
        handleToggleReaction={handleToggleReaction}
        handleDeleteMessage={handleDeleteMessage}
        handleBulkDeleteMessages={handleBulkDeleteMessages}
        suggestions={suggestions}
        handleCreateSuggestion={handleCreateSuggestion}
        handleUpvoteSuggestion={handleUpvoteSuggestion}
        handleOpenModerationModal={handleOpenModerationModal}
        handleDeleteSuggestion={handleDeleteSuggestion}
        usernames={usernamesDirectory}
        getAvatarFrameClass={getAvatarFrameClass}
        equippedFrame={equippedFrame}
        loadOlderMessages={fetchChatMessages}
        isLoadingOlder={isLoadingOlderChat}
        hasMoreChat={hasMoreChat}
      />
    );
  };

  const renderGamesPage = () => {
    const todayStr = getLocalDateString();
    const hasSpunToday = !!(user && user.last_spin_wheel_date === todayStr);
    return (
      <Games
        user={user}
        gameTab={gameTab}
        setGameTab={setGameTab}
        activeGame={activeGame}
        setActiveGame={setActiveGame}
        gameFinished={gameFinished}
        setGameFinished={setGameFinished}
        memoryMoves={memoryMoves}
        memoryMatches={memoryMatches}
        gamePlaySuccess={gamePlaySuccess}
        gamePlayError={gamePlayError}
        initMemoryGame={initMemoryGame}
        memoryCards={memoryCards}
        handleCardClick={handleCardClick}
        wheelRotation={wheelRotation}
        handleSpinWheelClick={handleSpinWheelClick}
        isSpinning={isSpinning}
        gameError={gameError}
        createGameRounds={createGameRounds}
        setCreateGameRounds={setCreateGameRounds}
        createGameDuration={createGameDuration}
        setCreateGameDuration={setCreateGameDuration}
        handleCreateGameRoom={handleCreateGameRoom}
        gameRoomCodeInput={gameRoomCodeInput}
        setGameRoomCodeInput={setGameRoomCodeInput}
        handleJoinGameRoom={handleJoinGameRoom}
        isGameLoading={isGameLoading}
        hasSpunToday={hasSpunToday}
        xpSettings={xpSettings}
      />
    );
  };

  const renderPlayGamePage = () => {
    return (
      <PlayGame
        activeGameRoom={activeGameRoom}
        user={user}
        handleLeaveGameRoom={handleLeaveGameRoom}
        handleStartGame={handleStartGame}
        handleSubmitGameAnswer={handleSubmitGameAnswer}
        submittedGameAnswer={submittedGameAnswer}
        setSubmittedGameAnswer={setSubmittedGameAnswer}
        handleNextRound={handleNextRound}
        handlePlayAgain={handlePlayAgain}
        showToast={showToast}
        token={token}
        apiBase={API_BASE}
        setActiveGameRoom={setActiveGameRoom}
      />
    );
  };

  const renderLeaderboardPage = () => {
    return (
      <Leaderboard
        user={user}
        leaderboard={leaderboard}
        leaderboardTab={leaderboardTab}
        setLeaderboardTab={setLeaderboardTab}
      />
    );
  };

  const renderProfilePage = () => {
    return (
      <Profile
        user={user}
        equippedFrame={equippedFrame}
        setEquippedFrame={setEquippedFrame}
        equippedTitle={equippedTitle}
        setEquippedTitle={setEquippedTitle}
        unlockedCosmetics={unlockedCosmetics}
        setCurrentPage={setCurrentPage}
        handleLogout={handleLogout}
        handleUpdateProfile={handleUpdateProfile}
        handleUploadImage={handleUploadImage}
        isSubscribed={isSubscribed}
        pushLoading={pushLoading}
        onTogglePushNotifications={handleTogglePushNotifications}
      />
    );
  };

  const renderRewardsPage = () => {
    const todayStr = getLocalDateString();
    const hasOpenedBoxToday = !!(user && user.last_surprise_box_date === todayStr);
    return (
      <Rewards
        user={user}
        redeemError={redeemError}
        redeemSuccess={redeemSuccess}
        handleRedeem={handleRedeem}
        secretCode={secretCode}
        setSecretCode={setSecretCode}
        showToast={showToast}
        triggerXpPopup={triggerXpPopup}
        claimMockReward={claimMockReward}
        unlockedCosmetics={unlockedCosmetics}
        handleShopPurchase={handleShopPurchase}
        hasOpenedBoxToday={hasOpenedBoxToday}
        handleClaimSurpriseBox={handleClaimSurpriseBox}
        handleBuyFrame={async () => { fetchUserProfile(); return true; }}
      />
    );
  };

  const renderLoginPage = () => {
    return (
      <Login
        loginForm={loginForm}
        setLoginForm={setLoginForm}
        authError={authError}
        handleLogin={handleLogin}
        setCurrentPage={setCurrentPage}
      />
    );
  };

  const renderRegisterPage = () => {
    return (
      <Register
        registerForm={registerForm}
        setRegisterForm={setRegisterForm}
        authError={authError}
        authSuccess={authSuccess}
        handleRegister={handleRegister}
        setCurrentPage={setCurrentPage}
      />
    );
  };

  const renderConfirmPage = () => {
    return (
      <Confirm
        confirmCode={confirmCode}
        setConfirmCode={setConfirmCode}
        authError={authError}
        authSuccess={authSuccess}
        handleConfirm={handleConfirm}
      />
    );
  };

  const renderForgotPasswordPage = () => {
    return (
      <ForgotPassword
        authError={authError}
        authSuccess={authSuccess}
        onSubmit={handleForgotPassword}
        setCurrentPage={setCurrentPage}
      />
    );
  };

  const renderResetPasswordPage = () => {
    return (
      <ResetPassword
        email={forgotEmail}
        authError={authError}
        authSuccess={authSuccess}
        onSubmit={handleResetPassword}
        setCurrentPage={setCurrentPage}
      />
    );
  };

  const renderAdminPage = () => {
    return (
      <Admin
        adminSection={adminSection}
        setAdminSection={setAdminSection}
        adminMessage={adminMessage}
        setAdminMessage={setAdminMessage}
        adminEpisodeForm={adminEpisodeForm}
        setAdminEpisodeForm={setAdminEpisodeForm}
        handleAdminCreateEpisode={handleAdminCreateEpisode}
        adminSubmitting={adminSubmitting}
        setAdminSubmitting={setAdminSubmitting}
        adminUsers={adminUsers}
        adminCodes={adminCodes}
        adminSuggestions={adminSuggestions}
        adminCodeForm={adminCodeForm}
        setAdminCodeForm={setAdminCodeForm}
        handleAdminCreateCode={handleAdminCreateCode}
        handleAdminToggleUserRole={handleAdminToggleUserRole}
        handleAdminUpdateSuggestionStatus={handleAdminUpdateSuggestionStatus}
        handleAdminDeleteCode={handleAdminDeleteCode}
        handleOpenModerationModal={handleOpenModerationModal}
        handleAdminDeleteUser={handleAdminDeleteUser}
        user={user}
        token={token}
        apiBase={API_BASE}
        fetchXpSettings={fetchXpSettings}
        episodes={episodes}
        fetchEpisodes={fetchEpisodes}
        showConfirm={showConfirm}
      />
    );
  };

  // Profile rings decoration generator
  const getAvatarFrameClass = () => {
    if (equippedFrame === 'gold-glow') return 'avatar-frame-gold-glow';
    if (equippedFrame === 'neon-ring') return 'avatar-frame-neon-ring';
    return '';
  };

  const unseenCount = currentPage === 'community' ? 0 : chatMessages.filter((msg: any) => Number(msg.id || 0) > lastSeenMessageId).length;

  const getFlameTier = (days: number) => {
    if (days >= 15) {
      return {
        name: "Supernova Blue",
        badge: "👑 تتابع سوبرنوفا إلهي!",
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
        badge: "🔮 تتابع بلازما أسطوري!",
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
        badge: "🌟 تتابع الدخول الذهبي!",
        outer: ["#b8860b", "#ffaa00", "#ffea80"],
        mid: ["#d4af37", "#ffdf00", "#ffffff"],
        inner: ["#ffdf00", "#ffffff", "#ffffff"],
        shadow: "drop-shadow-[0_0_65px_rgba(255,215,0,0.9)]",
        textClass: "text-yellow-400 drop-shadow-[0_0_15px_rgba(234,179,8,0.6)] font-black",
        particleColor: "from-yellow-500 to-amber-300",
        ambientGlow: "bg-yellow-500/20"
      };
    }
    // Default / 1-2 days (Starter Spark)
    return {
      name: "Starter Spark",
      badge: "⚡ تتابع دخولك اليومي",
      outer: ["#d90429", "#f77f00", "#fcbf49"],
      mid: ["#f77f00", "#fcbf49", "#eae2b7"],
      inner: ["#fcbf49", "#ffffff", "#ffffff"],
      shadow: "drop-shadow-[0_0_60px_rgba(255,106,0,0.85)]",
      textClass: "text-brand-orange drop-shadow-[0_0_15px_rgba(242,101,34,0.6)] font-black",
      particleColor: "from-brand-orange to-yellow-400",
      ambientGlow: "bg-brand-orange/20"
    };
  };

  return (
    <div className="app-layout">
      {/* Background Watermark/Reflections */}
      <div className="ambient-glow-bg"></div>

      {/* Floating XP Popups */}
      <XPPopup popups={xpPopups} />

      {/* Desktop Sticky Sidebar */}
      <Sidebar
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        setCommunityTab={setCommunityTab}
        unseenCount={unseenCount}
        user={user}
        equippedTitle={equippedTitle}
        getAvatarFrameClass={getAvatarFrameClass}
      />

      {/* Main Column Wrapper */}
      <div className="app-body-wrapper">
        {/* Mobile Header */}
        <MobileHeader
          setCurrentPage={setCurrentPage}
          user={user}
          getAvatarFrameClass={getAvatarFrameClass}
        />

        {/* Main Content Router */}
        <main className="app-main">
          {currentPage === 'home' && renderHome()}
          {currentPage === 'news' && renderNewsPage()}
          {currentPage === 'episodes' && renderEpisodesPage()}
          {currentPage === 'episode-detail' && renderEpisodeDetailPage()}
          {currentPage === 'community' && renderCommunityPage()}
          {currentPage === 'games' && renderGamesPage()}
          {currentPage === 'play-game' && renderPlayGamePage()}
          {currentPage === 'leaderboard' && renderLeaderboardPage()}
          {currentPage === 'rewards' && renderRewardsPage()}
          {currentPage === 'profile' && renderProfilePage()}
          {currentPage === 'login' && renderLoginPage()}
          {currentPage === 'register' && renderRegisterPage()}
          {currentPage === 'confirm' && renderConfirmPage()}
          {currentPage === 'forgot-password' && renderForgotPasswordPage()}
          {currentPage === 'reset-password' && renderResetPasswordPage()}
          {currentPage === 'admin' && renderAdminPage()}
        </main>

        {/* Mobile sticky bottom navigation */}
        <BottomNav
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          setCommunityTab={setCommunityTab}
          unseenCount={unseenCount}
          user={user}
        />
      </div>

      {/* Global alert/confirm overlay */}
      <CustomModal modal={customModal} />

      {/* Moderation Overlay Dialog */}
      {renderModerationModal()}

      {/* PWA Install Banner */}
      <AnimatePresence>
        {showInstallBanner && deferredPrompt && !isStandalone && (
          <motion.div
            initial={{ opacity: 0, y: 60, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.9 }}
            transition={{ type: 'spring', damping: 20, stiffness: 200 }}
            className="fixed bottom-20 md:bottom-6 right-4 left-4 md:left-auto md:w-[400px] z-[9999] rounded-2xl border border-brand-orange/25 bg-zinc-950/95 backdrop-blur-2xl p-5 shadow-[0_8px_40px_rgba(242,101,34,0.15)] flex flex-col gap-4 overflow-hidden"
          >
            {/* Subtle shimmer overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-brand-orange/[0.03] to-transparent animate-shimmer pointer-events-none" />

            <div className="flex items-start gap-3.5 relative z-10">
              {/* App Icon */}
              <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-brand-orange/30 shadow-lg shadow-brand-orange/10 shrink-0 bg-brand-orange">
                <img src="/favicon.svg" alt="Leh Physio" className="w-full h-full object-cover" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-black text-white leading-tight">Leh Physio League</h4>
                  <button 
                    onClick={dismissInstallBanner}
                    className="text-zinc-600 hover:text-zinc-300 cursor-pointer transition-colors p-0.5 -mt-1 -mr-1 shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-[11px] text-zinc-400 font-medium leading-relaxed mt-1">
                  ثبّت التطبيق على جهازك للوصول السريع والتنبيهات الفورية
                </p>
              </div>
            </div>

            <div className="flex gap-2.5 relative z-10">
              <button 
                onClick={handleInstallPWA}
                className="flex-1 bg-gradient-to-r from-brand-orange to-brand-amber text-black font-black text-xs py-3 rounded-xl cursor-pointer hover:shadow-orange-intense active:scale-[0.97] transition-all shadow-orange-glow flex items-center justify-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                <span>تثبيت التطبيق</span>
              </button>
              <button 
                onClick={dismissInstallBanner}
                className="border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/60 text-zinc-400 font-bold text-xs py-3 px-5 rounded-xl cursor-pointer transition-all active:scale-[0.97]"
              >
                لاحقاً
              </button>
            </div>
          </motion.div>
        )}

        {showIOSInstall && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 80, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="fixed bottom-20 md:bottom-6 right-4 left-4 md:left-auto md:w-[420px] z-[9999] rounded-3xl border border-white/10 bg-zinc-950/95 backdrop-blur-2xl p-6 shadow-[0_12px_45px_rgba(0,0,0,0.8)] flex flex-col gap-4 text-left font-sans"
          >
            <div className="flex items-start gap-4">
              {/* App Icon */}
              <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-brand-orange/30 shadow-lg shadow-brand-orange/10 shrink-0 bg-brand-orange">
                <img src="/favicon.svg" alt="LehPhysio" className="w-full h-full object-cover" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-black text-white leading-tight">LehPhysio? - ليه فيزيو؟</h4>
                  <button 
                    onClick={dismissIOSInstall}
                    className="text-zinc-500 hover:text-zinc-300 cursor-pointer transition-colors p-0.5 -mt-1 -mr-1 shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-[11px] text-zinc-400 font-bold leading-relaxed mt-1">
                  ثبّت التطبيق على هاتف الآيفون الخاص بك لتلقي الإشعارات الفورية وتصفح أسرع!
                </p>
              </div>
            </div>

            {/* Instruction Steps */}
            <div className="bg-zinc-900/60 rounded-2xl p-4 border border-zinc-800/60 space-y-3.5 text-xs text-zinc-200">
              <div className="flex items-center gap-3">
                <span className="w-5 h-5 rounded-full bg-brand-orange/15 border border-brand-orange/20 text-brand-orange text-[10px] font-black flex items-center justify-center shrink-0">1</span>
                <p className="leading-relaxed">
                  اضغط على زر المشاركة <span className="inline-flex items-center justify-center bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded-lg font-black shrink-0 mx-1"><i className="ti ti-share text-xs"></i></span> أسفل شاشة المتصفح Safari.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-5 h-5 rounded-full bg-brand-orange/15 border border-brand-orange/20 text-brand-orange text-[10px] font-black flex items-center justify-center shrink-0">2</span>
                <p className="leading-relaxed">
                  مرر القائمة لأسفل ثم اختر <strong className="text-white">"إضافة إلى الشاشة الرئيسية"</strong> أو <strong className="text-white">"Add to Home Screen"</strong> <span className="inline-flex items-center justify-center bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded-lg font-black shrink-0 mx-1"><i className="ti ti-square-plus text-xs"></i></span>.
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <button 
                onClick={dismissIOSInstall}
                className="flex-1 bg-gradient-to-r from-brand-orange to-brand-amber text-black font-black text-xs py-3 rounded-xl cursor-pointer hover:shadow-orange-intense active:scale-[0.97] transition-all shadow-orange-glow text-center"
              >
                فهمت ذلك
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>



      {/* TikTok-Style Daily Login & Streak Celebratory Overlay */}
      <AnimatePresence>
        {streakOverlay.show && (() => {
          const tier = getFlameTier(streakOverlay.days);
          return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[10000] flex flex-col items-center justify-center bg-black/90 backdrop-blur-xl overflow-hidden px-6"
            >
              {/* Abstract floating flame sparkles background */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {Array.from({ length: 15 }).map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ 
                      x: Math.random() * window.innerWidth, 
                      y: window.innerHeight + 100, 
                      scale: Math.random() * 0.8 + 0.4, 
                      opacity: Math.random() * 0.6 + 0.2 
                    }}
                    animate={{ 
                      y: -100, 
                      x: `calc(50% + ${Math.sin(i) * 100}px)`,
                      opacity: 0 
                    }}
                    transition={{ 
                      duration: Math.random() * 3 + 2, 
                      repeat: Infinity, 
                      delay: Math.random() * 2 
                    }}
                    className={`absolute w-5 h-5 rounded-full bg-gradient-to-t ${tier.particleColor} blur-[2px]`}
                  />
                ))}
              </div>

              {/* Glowing Aura reflection */}
              <div className={`w-80 h-80 rounded-full ${tier.ambientGlow} blur-[100px] absolute z-0 pointer-events-none animate-pulse`} />

              <div className="relative z-10 text-center flex flex-col items-center gap-6 max-w-sm">
                <span className={`text-[10px] font-black tracking-widest px-3.5 py-1.5 rounded-full uppercase border shadow-ambient ${
                  streakOverlay.days >= 15 ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/25' :
                  streakOverlay.days >= 7 ? 'bg-purple-500/20 text-purple-300 border-purple-500/25' :
                  streakOverlay.days >= 3 ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/25' :
                  'bg-brand-orange/20 text-brand-orange border-brand-orange/25'
                }`}>
                  {tier.badge}
                </span>

                {/* The Rising & Pulsing Realistic Flame */}
                <motion.div
                  initial={{ scale: 0.2, y: 180, opacity: 0 }}
                  animate={{ scale: 1, y: 0, opacity: 1 }}
                  transition={{ type: 'spring', damping: 12, stiffness: 100 }}
                  className={`w-48 h-48 filter ${tier.shadow} flex items-center justify-center relative select-none`}
                >
                  {/* 3D Multi-Layered SVG Flame */}
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    <defs>
                      {/* Gradients for extreme depth */}
                      <linearGradient id="outerFlame" x1="0%" y1="100%" x2="0%" y2="0%">
                        <stop offset="0%" stopColor={tier.outer[0]} stopOpacity="0.9" />
                        <stop offset="60%" stopColor={tier.outer[1]} stopOpacity="0.8" />
                        <stop offset="100%" stopColor={tier.outer[2]} stopOpacity="0" />
                      </linearGradient>
                      <linearGradient id="midFlame" x1="0%" y1="100%" x2="0%" y2="0%">
                        <stop offset="0%" stopColor={tier.mid[0]} stopOpacity="0.95" />
                        <stop offset="50%" stopColor={tier.mid[1]} stopOpacity="0.85" />
                        <stop offset="100%" stopColor={tier.mid[2]} stopOpacity="0" />
                      </linearGradient>
                      <linearGradient id="innerFlame" x1="0%" y1="100%" x2="0%" y2="0%">
                        <stop offset="0%" stopColor={tier.inner[0]} stopOpacity="1" />
                        <stop offset="50%" stopColor={tier.inner[1]} stopOpacity="0.9" />
                        <stop offset="100%" stopColor={tier.inner[2]} stopOpacity="0" />
                      </linearGradient>
                    </defs>

                    {/* 1. Outer Flame Tongue (Slower, heavy flow) */}
                    <motion.path
                      d="M50,95 C70,95 85,80 82,58 C80,38 65,30 50,2 C35,30 20,38 18,58 C15,80 30,95 50,95 Z"
                      fill="url(#outerFlame)"
                      animate={{
                        scaleY: [1, 1.08, 0.96, 1.05, 1],
                        scaleX: [1, 0.95, 1.05, 0.98, 1],
                        skewX: [0, -3, 3, -2, 0],
                        y: [0, -4, 2, -3, 0]
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                      style={{ transformOrigin: "50px 95px" }}
                    />

                    {/* 2. Middle Flame Tongue (Faster, flicking) */}
                    <motion.path
                      d="M50,90 C65,90 75,78 72,58 C70,40 60,32 50,15 C40,32 30,40 28,58 C25,78 35,90 50,90 Z"
                      fill="url(#midFlame)"
                      animate={{
                        scaleY: [1, 0.93, 1.1, 0.97, 1],
                        scaleX: [1, 1.08, 0.92, 1.03, 1],
                        skewX: [0, 4, -4, 2, 0],
                        y: [0, 3, -5, 2, 0]
                      }}
                      transition={{
                        duration: 2.2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                      style={{ transformOrigin: "50px 90px" }}
                    />

                    {/* 3. Inner Core Hot Flame (Rapid pulse, white hot) */}
                    <motion.path
                      d="M50,85 C60,85 68,75 66,58 C64,42 58,35 50,28 C42,35 36,42 34,58 C32,75 40,85 50,85 Z"
                      fill="url(#innerFlame)"
                      animate={{
                        scaleY: [1, 1.12, 0.9, 1.08, 1],
                        scaleX: [1, 0.9, 1.1, 0.95, 1],
                        y: [0, -2, 1, -1, 0]
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                      style={{ transformOrigin: "50px 85px" }}
                    />
                  </svg>
                </motion.div>

                {/* Streak Counter details */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4, type: 'spring' }}
                  className="space-y-1.5"
                >
                  <h1 className={`text-4xl ${tier.textClass} tracking-tighter leading-none select-none`}>
                    {streakOverlay.days} {streakOverlay.days > 10 ? 'يوماً' : 'أيام'} متتالية!
                  </h1>
                  <p className="text-sm font-bold text-zinc-400 select-none uppercase tracking-wide">
                    Your Current Active Streak
                  </p>
                </motion.div>

                {/* XP Awarded badge */}
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 shadow-lg text-white"
                >
                  <div className="w-5 h-5 rounded-full bg-green-500 text-black flex items-center justify-center font-black text-[10px]">✓</div>
                  <span className="text-xs font-black select-none">
                    كسبت <strong className="text-green-400">+{streakOverlay.xpEarned} XP</strong> بنجاح!
                  </span>
                </motion.div>

                {/* Celebratory claim button */}
                <motion.button
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.8 }}
                  onClick={() => {
                    setStreakOverlay(prev => ({ ...prev, show: false }));
                    triggerXpPopup(streakOverlay.xpEarned);
                  }}
                  className={`w-full font-black text-sm py-4 rounded-2xl cursor-pointer active:scale-97 transition-all mt-2.5 text-center flex items-center justify-center gap-2 ${
                    streakOverlay.days >= 15 ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-cyan-glow hover:shadow-cyan-intense' :
                    streakOverlay.days >= 7 ? 'bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-pink-glow hover:shadow-pink-intense' :
                    streakOverlay.days >= 3 ? 'bg-gradient-to-r from-yellow-600 to-amber-500 text-black shadow-yellow-glow hover:shadow-yellow-intense' :
                    'bg-gradient-to-r from-brand-orange to-brand-amber text-black shadow-orange-glow hover:shadow-orange-intense'
                  }`}
                >
                  <span>متابعة التحدي! 🔥</span>
                </motion.button>
              </div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* Toast Notification element */}
      <Toast message={toastMessage} />
    </div>
  );
}

export default App;
