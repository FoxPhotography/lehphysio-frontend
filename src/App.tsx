import React, { useState, useEffect, useRef } from 'react';
import { playChatSound, getNameColor, getLocalDateString } from './utils/helpers';
import { ShieldAlert } from 'lucide-react';

// Services
import { API_BASE } from './services/api';
import { authService } from './services/authService';
import { episodeService } from './services/episodeService';
import { communityService } from './services/communityService';
import { gameService } from './services/gameService';
import { feedCacheService } from './services/feedCacheService';

// Context
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider, useSocket } from './context/SocketContext';
import { NotificationProvider } from './context/NotificationContext';

// Hooks
import { useChat } from './hooks/useChat';
import { useGames } from './hooks/useGames';

// Layout & Routing
import { MainLayout } from './layouts/MainLayout';
import { AppRouter } from './routes/router';

const getUserId = (user: any, token: string): string | null => {
  if (user?.id) return String(user.id);
  if (token && token.includes('.')) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload?.id) return String(payload.id);
    } catch (e) {}
  }
  return null;
};

const getClientRank = (xp: number) => {
  const score = xp || 0;
  if (score >= 6000) return { name_ar: 'أسطورة الريهاب', name_en: 'Rehab Legend', emoji: '👑', tier: 5 };
  if (score >= 3000) return { name_ar: 'النيوروچي', name_en: 'Neurogenic', emoji: '🧠', tier: 4 };
  if (score >= 1500) return { name_ar: 'سيد الأورثو', name_en: 'Ortho King', emoji: '🦴', tier: 3 };
  if (score >= 500) return { name_ar: 'أخصائي الألم', name_en: 'Pain Specialist', emoji: '⚡', tier: 2 };
  return { name_ar: 'طالب تشريح', name_en: 'Anatomy Rookie', emoji: '🧪', tier: 1 };
};

const mergePendingAndFresh = (pendingPosts: any[], freshData: any[]): any[] => {
  const remainingPending = pendingPosts.filter(pp => {
    return !freshData.some(fd => {
      if (String(pp.id) === String(fd.id)) return true;
      if (String(pp.id).startsWith('temp-') &&
          String(pp.user_id) === String(fd.user_id) &&
          (pp.content || '').trim() === (fd.content || '').trim() &&
          (pp.title || '').trim() === (fd.title || '').trim()) {
        return true;
      }
      return false;
    });
  });
  
  const filteredFresh = freshData.filter(fd => {
    return !remainingPending.some(pp => String(pp.id) === String(fd.id));
  });

  return [...remainingPending, ...filteredFresh];
};

function InnerApp() {
  const {
    token,
    user,
    setUser,
    setToken,
    currentPage,
    setCurrentPage,
    changePage,
    showToast,
    showConfirm,
    triggerXpPopup,
    fetchUserProfile,
    fetchUsernamesDirectory,
    usernamesDirectory,
    equippedFrame,
    equippedTitle,
    xpSettings,
    setStreakOverlay,
    confirmEmail,
    setConfirmEmail,
    forgotEmail,
    setForgotEmail
  } = useAuth();

  const socket = useSocket();
  const inProgressRequests = useRef<Record<string, boolean>>({});

  // App Data
  const [episodes, setEpisodes] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [leaderboardTab, setLeaderboardTab] = useState('all-time');
  const [communityPosts, setCommunityPosts] = useState<any[]>([]);
  const [newsPosts, setNewsPosts] = useState<any[]>([]);
  const [isRefreshingFeed, setIsRefreshingFeed] = useState(false);
  const [isLoadingOlderPosts, setIsLoadingOlderPosts] = useState(false);
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const [newPostContent, setNewPostContent] = useState('');

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



  // Question of the Day State
  const [dailyQuestion, setDailyQuestion] = useState<{
    active: boolean;
    has_answered: boolean;
    question?: {
      id: number;
      question: string;
      options: string[];
      correct_answer?: number;
      publish_at: string;
      status: string;
    };
    user_answer?: {
      selected_answer: number;
      is_correct: boolean;
      xp_awarded: number;
      answered_at: string;
    };
  } | null>(null);

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

  // Hooks bindings
  const [communityTab, setCommunityTab] = useState<'feed' | 'chat'>('feed');
  const chatHook = useChat(communityTab);
  const gamesHook = useGames();

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
      setCurrentPage('home');
    } else if (path === '/chat') {
      setCurrentPage('community');
      setCommunityTab('chat');
    } else if (path === '/episodes') {
      setCurrentPage('episodes');
    } else if (path.startsWith('/episodes/')) {
      const idStr = path.substring('/episodes/'.length);
      const id = parseInt(idStr);
      if (!isNaN(id)) {
        setSelectedEpisodeId(id);
        setCurrentPage('episode-detail');
        setEpisodeDetailLoading(true);
        fetchEpisodeDetail(id);
      } else {
        setCurrentPage('episodes');
      }
    } else if (path.startsWith('/post/')) {
      setCurrentPage('home');
    } else if (path === '/games') {
      setCurrentPage('games');
    } else if (path.startsWith('/game/')) {
      const roomCode = path.substring('/game/'.length).toUpperCase();
      const activeToken = localStorage.getItem('token') || token;
      if (activeToken) {
        if (gamesHook.activeGameRoom && gamesHook.activeGameRoom.code === roomCode) {
          setCurrentPage('play-game');
        } else {
          gamesHook.handleJoinGameRoom(roomCode);
        }
      } else {
        sessionStorage.setItem('pendingGameCode', roomCode);
        setCurrentPage('login');
        showToast('Please log in to join the game room! 🔐');
      }
    } else if (path === '/leaderboard') {
      setCurrentPage('leaderboard');
    } else if (path === '/rewards') {
      setCurrentPage('rewards');
    } else if (path === '/profile') {
      setCurrentPage('profile');
    } else if (path === '/login') {
      setCurrentPage('login');
    } else if (path === '/register') {
      setCurrentPage('register');
    } else if (path === '/confirm') {
      setCurrentPage('confirm');
    } else if (path === '/forgot-password') {
      setCurrentPage('forgot-password');
    } else if (path === '/reset-password') {
      setCurrentPage('reset-password');
    } else if (path === '/admin') {
      setCurrentPage('admin');
    } else if (path === '/moderation') {
      setCurrentPage('moderator-dashboard');
    } else {
      setCurrentPage('home');
    }
  };

  // Initial Fetching & Routing Setup
  useEffect(() => {
    fetchEpisodes();
    fetchCommunityPosts();
    fetchNewsPosts();
    fetchLeaderboard();
    fetchPublicSuggestions();

    handleUrlRouting();
    const onPopState = () => {
      handleUrlRouting();
    };
    window.addEventListener('popstate', onPopState);
    return () => {
      window.removeEventListener('popstate', onPopState);
    };
  }, [token]);

  // Load cached posts list immediately on user availability or token presence
  useEffect(() => {
    const userId = getUserId(user, token);
    if (userId) {
      feedCacheService.get(`feed_${userId}`).then(cache => {
        if (cache && cache.data) {
          setCommunityPosts(cache.data);
        }
      });
      feedCacheService.get(`news_${userId}`).then(cache => {
        if (cache && cache.data) {
          setNewsPosts(cache.data);
        }
      });
      feedCacheService.get(`episodes_${userId}`).then(cache => {
        if (cache && cache.data) {
          setEpisodes(cache.data);
        }
      });
    } else {
      setCommunityPosts([]);
      setNewsPosts([]);
      setEpisodes([]);
    }
  }, [user?.id, token]);

  // Load cached leaderboard immediately on tab/batch changes
  useEffect(() => {
    const userId = getUserId(user, token);
    if (userId) {
      const cacheKey = `leaderboard_${userId}_${leaderboardTab}_${user?.batch || ''}`;
      feedCacheService.get(cacheKey).then(cache => {
        if (cache && cache.data) {
          setLeaderboard(cache.data);
        }
      });
    } else {
      setLeaderboard([]);
    }
  }, [user?.batch, leaderboardTab, token, user?.id]);

  // Sync communityTab and currentPage states
  useEffect(() => {
    if (currentPage === 'community') {
      setCommunityTab('chat');
    } else if (currentPage === 'home') {
      setCommunityTab('feed');
    }
  }, [currentPage]);

  // Sync fresh data when app comes back online
  useEffect(() => {
    const handleOnlineSync = () => {
      fetchEpisodes();
      fetchCommunityPosts();
      fetchNewsPosts();
      fetchLeaderboard();
      fetchPublicSuggestions();
    };
    window.addEventListener('app_online', handleOnlineSync);
    return () => window.removeEventListener('app_online', handleOnlineSync);
  }, [token]);

  useEffect(() => {
    const handleNewsPublished = () => {
      fetchNewsPosts();
      fetchCommunityPosts();
    };
    window.addEventListener('news_published', handleNewsPublished);
    return () => window.removeEventListener('news_published', handleNewsPublished);
  }, [token]);

  // Handle auto-joining pending game code
  useEffect(() => {
    if (token) {
      const pendingCode = sessionStorage.getItem('pendingGameCode');
      if (pendingCode) {
        sessionStorage.removeItem('pendingGameCode');
        gamesHook.handleJoinGameRoom(pendingCode);
      }
    }
  }, [token]);

  // Socket listeners for real-time feed, news, and episode updates
  useEffect(() => {
    if (!socket) return () => {};

    const handlePostCreated = (newPost: any) => {
      console.log('[Socket] post_created received:', newPost);
      const userId = getUserId(user, token);
      setCommunityPosts(prev => {
        const isMatch = (p: any) => {
          if (String(p.id) === String(newPost.id)) return true;
          if (String(p.id).startsWith('temp-') && 
              String(p.user_id) === String(newPost.user_id) && 
              (p.content || '').trim() === (newPost.content || '').trim() && 
              (p.title || '').trim() === (newPost.title || '').trim()) {
            return true;
          }
          return false;
        };
        const exists = prev.some(isMatch);
        let updated;
        if (exists) {
          updated = prev.map(p => isMatch(p) ? { ...p, ...newPost, pending: false } : p);
          console.log('[Socket] post_created matched existing post, updated in place.');
        } else {
          updated = [newPost, ...prev];
          console.log('[Socket] post_created did not match, prepended to feed.');
        }
        console.log('[Socket] post_created final array:', updated);
        if (userId) feedCacheService.set(`feed_${userId}`, updated);
        return updated;
      });
    };

    const handlePostUpdated = (updatedPost: any) => {
      const userId = getUserId(user, token);
      setCommunityPosts(prev => {
        const updated = prev.map(p => p.id === updatedPost.id ? { ...p, ...updatedPost } : p);
        if (userId) feedCacheService.set(`feed_${userId}`, updated);
        return updated;
      });
    };

    const handlePostDeleted = (data: { id: number }) => {
      const userId = getUserId(user, token);
      setCommunityPosts(prev => {
        const updated = prev.filter(p => p.id !== data.id);
        if (userId) feedCacheService.set(`feed_${userId}`, updated);
        return updated;
      });
    };

    const handleAnnouncementCreated = (newAnn: any) => {
      console.log('[Socket] announcement_created received:', newAnn);
      const userId = getUserId(user, token);
      setNewsPosts(prev => {
        const isMatch = (p: any) => {
          if (String(p.id) === String(newAnn.id)) return true;
          if (String(p.id).startsWith('temp-') && 
              String(p.user_id) === String(newAnn.user_id) && 
              (p.content || '').trim() === (newAnn.content || '').trim() && 
              (p.title || '').trim() === (newAnn.title || '').trim()) {
            return true;
          }
          return false;
        };
        const exists = prev.some(isMatch);
        let updated;
        if (exists) {
          updated = prev.map(p => isMatch(p) ? { ...p, ...newAnn, pending: false } : p);
          console.log('[Socket] announcement_created matched existing announcement, updated in-place.');
        } else {
          updated = [newAnn, ...prev];
          console.log('[Socket] announcement_created did not match, prepended to news list.');
        }
        console.log('[Socket] announcement_created final array:', updated);
        if (userId) feedCacheService.set(`news_${userId}`, updated);
        return updated;
      });
    };

    const handleAnnouncementUpdated = (updatedAnn: any) => {
      const userId = getUserId(user, token);
      setNewsPosts(prev => {
        const updated = prev.map(p => p.id === updatedAnn.id ? { ...p, ...updatedAnn } : p);
        if (userId) feedCacheService.set(`news_${userId}`, updated);
        return updated;
      });
    };

    const handleAnnouncementDeleted = (data: { id: number }) => {
      const userId = getUserId(user, token);
      setNewsPosts(prev => {
        const updated = prev.filter(p => p.id !== data.id);
        if (userId) feedCacheService.set(`news_${userId}`, updated);
        return updated;
      });
    };

    const handleEpisodeCreated = (newEp: any) => {
      const userId = getUserId(user, token);
      setEpisodes(prev => {
        if (prev.some((e: any) => e.id === newEp.id)) return prev;
        const updated = [newEp, ...prev];
        if (userId) feedCacheService.set(`episodes_${userId}`, updated);
        return updated;
      });
    };

    const handleEpisodeUpdated = (updatedEp: any) => {
      const userId = getUserId(user, token);
      setEpisodes(prev => {
        const updated = prev.map((e: any) => e.id === updatedEp.id ? { ...e, ...updatedEp } : e);
        if (userId) feedCacheService.set(`episodes_${userId}`, updated);
        return updated;
      });
    };

    const handleEpisodeDeleted = (data: { id: number }) => {
      const userId = getUserId(user, token);
      setEpisodes(prev => {
        const updated = prev.filter((e: any) => e.id !== data.id);
        if (userId) feedCacheService.set(`episodes_${userId}`, updated);
        return updated;
      });
    };

    socket.on('post_created', handlePostCreated);
    socket.on('post_updated', handlePostUpdated);
    socket.on('post_deleted', handlePostDeleted);
    socket.on('announcement_created', handleAnnouncementCreated);
    socket.on('announcement_updated', handleAnnouncementUpdated);
    socket.on('announcement_deleted', handleAnnouncementDeleted);
    socket.on('episode_created', handleEpisodeCreated);
    socket.on('episode_updated', handleEpisodeUpdated);
    socket.on('episode_deleted', handleEpisodeDeleted);

    return () => {
      socket.off('post_created', handlePostCreated);
      socket.off('post_updated', handlePostUpdated);
      socket.off('post_deleted', handlePostDeleted);
      socket.off('announcement_created', handleAnnouncementCreated);
      socket.off('announcement_updated', handleAnnouncementUpdated);
      socket.off('announcement_deleted', handleAnnouncementDeleted);
      socket.off('episode_created', handleEpisodeCreated);
      socket.off('episode_updated', handleEpisodeUpdated);
      socket.off('episode_deleted', handleEpisodeDeleted);
    };
  }, [socket, user, token]);

  // Socket listeners for real-time hero cards and XP/level/rank updates
  useEffect(() => {
    if (!socket || !user) return () => {};

    const handleXpUpdated = (data: { userId: number, total_xp: number, weekly_xp: number, xp_earned?: number }) => {
      const currentId = getUserId(user, token);
      if (String(data.userId) === String(currentId)) {
        setUser((prev: any) => {
          if (!prev) return null;
          const updated = {
            ...prev,
            total_xp: data.total_xp,
            weekly_xp: data.weekly_xp,
            rank: getClientRank(data.total_xp)
          };
          feedCacheService.set(`user_profile_${currentId}`, updated);
          return updated;
        });
        if (data.xp_earned) {
          triggerXpPopup(data.xp_earned, true);
        }
      }
    };

    const handleLevelUpdated = (data: { userId: number, level: number }) => {
      const currentId = getUserId(user, token);
      if (String(data.userId) === String(currentId)) {
        showToast(`🎉 Level Up! You reached level ${data.level}!`);
        playChatSound('success');
      }
    };

    const handleRankUpdated = (data: { userId: number, rank: any }) => {
      const currentId = getUserId(user, token);
      if (String(data.userId) === String(currentId)) {
        showToast(`🏆 New Rank unlocked: ${data.rank.name_en} ${data.rank.emoji}!`);
        playChatSound('success');
        setUser((prev: any) => {
          if (!prev) return null;
          const updated = { ...prev, rank: data.rank };
          feedCacheService.set(`user_profile_${currentId}`, updated);
          return updated;
        });
      }
    };

    const handleBadgeUnlocked = (data: { userId: number, badge: string }) => {
      const currentId = getUserId(user, token);
      if (String(data.userId) === String(currentId)) {
        showToast(`🏅 Badge unlocked: ${data.badge}!`);
        playChatSound('success');
      }
    };



    const handleQuestionPublished = (question: any) => {
      setDailyQuestion({
        active: true,
        has_answered: false,
        question
      });
      showToast('⚡ Question of the Day is now live!');
      playChatSound('success');
    };

    const handleQuestionExpired = (data: { question_id: number }) => {
      setDailyQuestion(prev => {
        if (prev && prev.question && prev.question.id === data.question_id) {
          return { ...prev, active: false };
        }
        return prev;
      });
    };

    const handleQuestionAnswered = () => {
      fetchDailyQuestion();
    };

    socket.on('xp_updated', handleXpUpdated);
    socket.on('level_updated', handleLevelUpdated);
    socket.on('rank_updated', handleRankUpdated);
    socket.on('badge_unlocked', handleBadgeUnlocked);
    socket.on('question:published', handleQuestionPublished);
    socket.on('question:expired', handleQuestionExpired);
    socket.on('question:answered', handleQuestionAnswered);

    return () => {
      socket.off('xp_updated', handleXpUpdated);
      socket.off('level_updated', handleLevelUpdated);
      socket.off('rank_updated', handleRankUpdated);
      socket.off('badge_unlocked', handleBadgeUnlocked);
      socket.off('question:published', handleQuestionPublished);
      socket.off('question:expired', handleQuestionExpired);
      socket.off('question:answered', handleQuestionAnswered);
    };
  }, [socket, user, token]);

  // Socket listener for real-time leaderboard update
  useEffect(() => {
    if (!socket) return () => {};

    const handleLeaderboardUpdated = (data: {
      userId: number;
      username: string;
      batch: string;
      total_xp: number;
      weekly_xp: number;
      streak_count: number;
      equipped_frame: string;
      avatar_url: string | null;
    } | Array<{
      userId: number;
      username: string;
      batch: string;
      total_xp: number;
      weekly_xp: number;
      streak_count: number;
      equipped_frame: string;
      avatar_url: string | null;
    }>) => {
      const userId = getUserId(user, token);
      setLeaderboard(prev => {
        const updates = Array.isArray(data) ? data : [data];
        let updatedList = [...prev];
        let changed = false;

        for (const item of updates) {
          if (!item || !item.username) continue;
          changed = true;

          const exists = updatedList.some((u: any) => u.username === item.username);
          const newXp = leaderboardTab === 'weekly' ? item.weekly_xp : item.total_xp;

          if (leaderboardTab === 'batch' && user?.batch && item.batch !== user.batch) {
            updatedList = updatedList.filter((u: any) => u.username !== item.username);
            continue;
          }

          const updatedUserObj = {
            username: item.username,
            batch: item.batch,
            xp: newXp,
            streak_count: item.streak_count,
            rank: getClientRank(item.total_xp),
            equipped_frame: item.equipped_frame || 'none',
            avatar_url: item.avatar_url || null
          };

          if (exists) {
            updatedList = updatedList.map((u: any) => u.username === item.username ? { ...u, ...updatedUserObj } : u);
          } else {
            if (updatedList.length < 100 || (updatedList.length > 0 && newXp > updatedList[updatedList.length - 1].xp)) {
              updatedList.push(updatedUserObj);
            }
          }
        }

        if (!changed) {
          return prev;
        }

        updatedList.sort((a: any, b: any) => {
          if (b.xp !== a.xp) {
            return b.xp - a.xp;
          }
          return a.username.localeCompare(b.username);
        });

        if (updatedList.length > 100) {
          updatedList = updatedList.slice(0, 100);
        }

        const finalSorted = updatedList.map((u: any, idx) => ({
          ...u,
          rank_num: idx + 1
        }));

        if (userId) {
          const cacheKey = `leaderboard_${userId}_${leaderboardTab}_${user?.batch || ''}`;
          feedCacheService.set(cacheKey, finalSorted);
        }

        return finalSorted;
      });
    };

    socket.on('leaderboard_updated', handleLeaderboardUpdated);

    return () => {
      socket.off('leaderboard_updated', handleLeaderboardUpdated);
    };
  }, [socket, user, token, leaderboardTab]);

  // Handle reconnect background validation and safe updates
  useEffect(() => {
    const handleReconnectSync = () => {
      showToast('Real-time connection restored. Syncing...');
      fetchEpisodes(true);
      fetchCommunityPosts(undefined, true);
      fetchNewsPosts(true);
      fetchLeaderboard(true);
      fetchPublicSuggestions();
    };
    window.addEventListener('socket_reconnect', handleReconnectSync);
    return () => window.removeEventListener('socket_reconnect', handleReconnectSync);
  }, [token, user?.batch, leaderboardTab]);

  // Scroll to targeted community post
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
            window.history.replaceState({}, '', '/');
          }
        }, 400);
      }
    }
  }, [communityPosts]);



  const fetchDailyQuestion = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/api/questions/daily`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setDailyQuestion(data);
      }
    } catch (e) {
      console.error('Failed to fetch daily question:', e);
    }
  };

  const handleAnswerQuestion = async (questionId: number, selectedAnswer: number) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/api/questions/daily/answer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ question_id: questionId, selected_answer: selectedAnswer })
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.is_correct ? `✅ Correct Answer! +${data.xp_awarded} XP ⚡` : `❌ Wrong Answer! +${data.xp_awarded} XP ⚡`);
        playChatSound(data.is_correct ? 'win' : 'error');
        fetchDailyQuestion();
        fetchUserProfile();
      } else {
        showToast(data.error || 'Failed to submit answer.');
        playChatSound('error');
      }
    } catch (err) {
      showToast('Connection error.');
      playChatSound('error');
    }
  };

  useEffect(() => {
    if (currentPage === 'home') {
      fetchUserProfile();
      fetchEpisodes();
      fetchCommunityPosts();
      fetchNewsPosts();
      fetchLeaderboard();
      fetchDailyQuestion();
    } else if (currentPage === 'episodes') {
      fetchEpisodes();
    } else if (currentPage === 'news') {
      fetchNewsPosts();
    }
  }, [currentPage, token]);

  // Reset auth errors/success on navigation to prevent carrying over
  useEffect(() => {
    setAuthError('');
    setAuthSuccess('');
  }, [currentPage]);

  // Revalidate leaderboard when batch or tab changes
  useEffect(() => {
    if (currentPage === 'home' || currentPage === 'leaderboard') {
      fetchLeaderboard();
    }
  }, [user?.batch, leaderboardTab, currentPage]);

  const fetchEpisodes = async (forceRefresh: boolean = false) => {
    const reqKey = 'episodes';
    if (inProgressRequests.current[reqKey]) return;
    inProgressRequests.current[reqKey] = true;

    const userId = getUserId(user, token);
    let showSpinner = true;
    try {
      if (userId) {
        const cache = await feedCacheService.get(`episodes_${userId}`);
        if (cache && cache.data && cache.data.length > 0) {
          setEpisodes(cache.data);
          const cacheAge = Date.now() - cache.cachedAt;
          const ttl = 5 * 60 * 1000;
          if (cacheAge < ttl && !forceRefresh) {
            showSpinner = false;
          }
        }
      }

      const res = await episodeService.fetchEpisodes(token);
      if (res.ok) {
        const data = await res.json();
        setEpisodes(prev => {
          if (JSON.stringify(prev) !== JSON.stringify(data)) {
            if (userId) {
              feedCacheService.set(`episodes_${userId}`, data);
            }
            return data;
          }
          return prev;
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      inProgressRequests.current[reqKey] = false;
    }
  };

  const fetchLeaderboard = async (forceRefresh: boolean = false) => {
    const userId = getUserId(user, token);
    const cacheKey = `leaderboard_${userId}_${leaderboardTab}_${user?.batch || ''}`;
    const reqKey = `leaderboard_${leaderboardTab}_${user?.batch || ''}`;
    if (inProgressRequests.current[reqKey]) return;
    inProgressRequests.current[reqKey] = true;

    try {
      if (userId) {
        const cache = await feedCacheService.get(cacheKey);
        if (cache && cache.data && cache.data.length > 0) {
          setLeaderboard(cache.data);
        }
      }

      const res = await gameService.fetchLeaderboard(leaderboardTab, user?.batch);
      if (res.ok) {
        const data = await res.json();
        setLeaderboard(prev => {
          if (JSON.stringify(prev) !== JSON.stringify(data)) {
            if (userId) {
              feedCacheService.set(cacheKey, data);
            }
            return data;
          }
          return prev;
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      inProgressRequests.current[reqKey] = false;
    }
  };

  const fetchAdminUsers = async () => {
    if (!token) return;
    try {
      const res = await authService.fetchAdminUsers(token);
      const data = await res.json();
      if (res.ok) setAdminUsers(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAdminCodes = async () => {
    if (!token) return;
    try {
      const res = await gameService.fetchAdminCodes(token);
      const data = await res.json();
      if (res.ok) setAdminCodes(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAdminSuggestions = async () => {
    if (!token) return;
    try {
      const res = await communityService.fetchAdminSuggestions(token);
      const data = await res.json();
      if (res.ok) setAdminSuggestions(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchPublicSuggestions = async () => {
    try {
      const res = await communityService.fetchSuggestions(token);
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
      const res = await gameService.adminCreateCode({
        code: adminCodeForm.code,
        xp_reward: Number(adminCodeForm.xp_reward),
        type: adminCodeForm.type,
        max_uses: Number(adminCodeForm.max_uses),
        expiry_date: adminCodeForm.expiry_date || null
      }, token);
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

  const handleAdminUpdateUserRole = async (userId: number, newRole: string) => {
    if (!token) return;
    try {
      const res = await authService.toggleUserRole(userId, newRole, token);
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
  };

  const handleAdminUpdateSuggestionStatus = async (suggestionId: number, status: 'approved' | 'rejected') => {
    if (!token) return;
    try {
      const res = await communityService.updateSuggestionStatus(suggestionId, status, token);
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
      const res = await communityService.createSuggestion(title, content, token);
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
      const res = await communityService.upvoteSuggestion(suggestionId, token);
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

  const fetchCommunityPosts = async (beforeId?: string, forceRefresh: boolean = false) => {
    const userId = getUserId(user, token);

    if (beforeId) {
      setIsLoadingOlderPosts(true);
      try {
        const res = await communityService.fetchCommunityPosts(beforeId, token);
        const data = await res.json();
        if (res.ok) {
          setCommunityPosts(prev => {
            const existingIds = new Set(prev.map(p => String(p.id)));
            const pendingPosts = prev.filter(p => p.pending);
            const newPosts = data.filter((p: any) => {
              if (existingIds.has(String(p.id))) return false;
              if (pendingPosts.some(pp => 
                String(pp.user_id) === String(p.user_id) && 
                pp.content === p.content && 
                pp.title === p.title
              )) {
                return false;
              }
              return true;
            });
            if (newPosts.length === 0) {
              setHasMorePosts(false);
            }
            const updated = [...prev, ...newPosts];
            console.log('[FetchPosts] Loaded older posts count:', newPosts.length, 'total count:', updated.length);
            return updated;
          });
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoadingOlderPosts(false);
      }
      return;
    }

    const reqKey = 'feed_main';
    if (inProgressRequests.current[reqKey]) return;
    inProgressRequests.current[reqKey] = true;

    let showSpinner = true;
    if (userId) {
      const cache = await feedCacheService.get(`feed_${userId}`);
      if (cache && cache.data && cache.data.length > 0) {
        setCommunityPosts(prev => {
          const pendingPosts = prev.filter(p => p.pending);
          const merged = mergePendingAndFresh(pendingPosts, cache.data);
          console.log('[FetchPosts] Loaded feed from cache. Count:', merged.length);
          return merged;
        });

        const cacheAge = Date.now() - cache.cachedAt;
        const ttl = 5 * 60 * 1000;
        if (cacheAge < ttl && !forceRefresh) {
          showSpinner = false;
        }
      }
    }

    if (showSpinner) {
      setIsRefreshingFeed(true);
    }

    try {
      const res = await communityService.fetchCommunityPosts(undefined, token);
      if (res.ok) {
        const data = await res.json();
        setCommunityPosts(prev => {
          const pendingPosts = prev.filter(p => p.pending);
          const freshData = data || [];
          const merged = mergePendingAndFresh(pendingPosts, freshData);
          console.log('[FetchPosts] Fresh feed from API count:', freshData.length, 'merged count:', merged.length);
          if (userId) {
            feedCacheService.set(`feed_${userId}`, merged);
          }
          setHasMorePosts(freshData.length >= 10);
          return merged;
        });
      } else if (showSpinner) {
        showToast('Offline: showing cached feed.');
      }
    } catch (e) {
      console.error(e);
      if (showSpinner) {
        showToast('Offline: showing cached feed.');
      }
    } finally {
      if (showSpinner) {
        setIsRefreshingFeed(false);
      }
      inProgressRequests.current[reqKey] = false;
    }
  };

  const fetchNewsPosts = async (forceRefresh: boolean = false) => {
    const reqKey = 'news';
    if (inProgressRequests.current[reqKey]) return;
    inProgressRequests.current[reqKey] = true;

    const userId = getUserId(user, token);
    let showSpinner = true;
    try {
      if (userId) {
        const cache = await feedCacheService.get(`news_${userId}`);
        if (cache && cache.data && cache.data.length > 0) {
          setNewsPosts(prev => {
            const pending = prev.filter(p => p.pending);
            const merged = mergePendingAndFresh(pending, cache.data);
            console.log('[FetchNews] Loaded news from cache. Count:', merged.length);
            return merged;
          });
          const cacheAge = Date.now() - cache.cachedAt;
          const ttl = 5 * 60 * 1000;
          if (cacheAge < ttl && !forceRefresh) {
            showSpinner = false;
          }
        }
      }

      const res = await communityService.fetchNewsPosts(token);
      const data = await res.json();
      if (res.ok) {
        setNewsPosts(prev => {
          const pending = prev.filter(p => p.pending);
          const freshData = data || [];
          const merged = mergePendingAndFresh(pending, freshData);
          console.log('[FetchNews] Fresh news from API count:', freshData.length, 'merged count:', merged.length);
          if (userId) {
            feedCacheService.set(`news_${userId}`, merged);
          }
          return merged;
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      inProgressRequests.current[reqKey] = false;
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
      const res = await gameService.redeemXpCode(secretCode, token);
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

  // Auth Operations
  const handleLogin = async (e: any) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');
    try {
      const res = await authService.login(loginForm);
      const data = await res.json();
      if (res.ok) {
        setAuthError('');
        setAuthSuccess('');
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
        setAuthSuccess('');
        setAuthError(data.error);
      }
    } catch (err) {
      setAuthSuccess('');
      setAuthError('Connection error occurred.');
    }
  };

  const handleRegister = async (e: any) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');
    if (import.meta.env.DEV) {
      console.log('handleRegister: Submitting registration form');
    }
    try {
      const res = await authService.register(registerForm);
      const data = await res.json();
      if (import.meta.env.DEV) {
        console.log('handleRegister: Received response from register API', {
          status: res.status,
          ok: res.ok
        });
      }
      if (res.ok) {
        setAuthError('');
        setAuthSuccess(data.message);
        setConfirmEmail(registerForm.email);
        localStorage.setItem('confirmEmail', registerForm.email);
        if (import.meta.env.DEV) {
          console.log('handleRegister: Registration successful');
        }
        setTimeout(() => {
          if (import.meta.env.DEV) {
            console.log('handleRegister: Redirecting user to confirmation page');
          }
          setCurrentPage('confirm');
          setAuthSuccess('');
        }, 1500);
      } else {
        setAuthSuccess('');
        setAuthError(data.error || 'Failed to register.');
      }
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('handleRegister: Error submitting form', err);
      }
      setAuthSuccess('');
      setAuthError('Connection error occurred.');
    }
  };

  const handleConfirm = async (e: any) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');
    if (import.meta.env.DEV) {
      console.log('handleConfirm: Submitting verification code');
    }
    try {
      const res = await authService.confirmCode(confirmEmail, confirmCode);
      const data = await res.json();
      if (import.meta.env.DEV) {
        console.log('handleConfirm: Received response from verify API', {
          status: res.status,
          ok: res.ok
        });
      }
      if (res.ok) {
        localStorage.removeItem('confirmEmail');
        setAuthError('');
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
        setAuthSuccess('');
        setAuthError(data.error);
      }
    } catch (e) {
      setAuthSuccess('');
      setAuthError('Failed to activate account.');
    }
  };

  const handleForgotPassword = async (email: string) => {
    setAuthError('');
    setAuthSuccess('');
    try {
      const res = await authService.forgotPassword(email);
      const data = await res.json();
      if (res.ok) {
        setAuthError('');
        setAuthSuccess(data.message);
        setForgotEmail(email);
        setTimeout(() => {
          setCurrentPage('reset-password');
          setAuthSuccess('');
        }, 1500);
      } else {
        setAuthSuccess('');
        setAuthError(data.error);
      }
    } catch (e) {
      setAuthSuccess('');
      setAuthError('Connection error occurred.');
    }
  };

  const handleResetPassword = async (code: string, newPassword: string) => {
    setAuthError('');
    setAuthSuccess('');
    try {
      const res = await authService.resetPassword(forgotEmail, code, newPassword);
      const data = await res.json();
      if (res.ok) {
        setAuthError('');
        setAuthSuccess(data.message);
        setTimeout(() => {
          setCurrentPage('login');
          setAuthSuccess('');
        }, 2000);
      } else {
        setAuthSuccess('');
        setAuthError(data.error);
      }
    } catch (e) {
      setAuthSuccess('');
      setAuthError('Connection error occurred.');
    }
  };

  const navigateToEpisode = (id: number) => {
    setSelectedEpisodeId(id);
    changePage('episode-detail', { id });
    setEpisodeDetailLoading(true);
    fetchEpisodeDetail(id);
  };

  const fetchEpisodeDetail = async (id: number) => {
    try {
      const res = await episodeService.fetchEpisodeDetail(id, token);
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
    let wasCommentLiked = false;
    if (type === 'comment_like' && episodeDetail && episodeDetail.episode?.id === selectedEpisodeId && parentId) {
      for (const c of episodeDetail.comments || []) {
        if (c.id === parentId) { wasCommentLiked = c.has_liked; break; }
        const reply = (c.replies || []).find((r: any) => r.id === parentId);
        if (reply) { wasCommentLiked = reply.has_liked; break; }
      }
    }

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
    }

    const xpDelta = wasCommentLiked ? -commentLikeXp : commentLikeXp;
    if (type === 'comment_like') {
      setUser((prev: any) => prev ? { ...prev, total_xp: prev.total_xp + xpDelta, weekly_xp: (prev.weekly_xp || 0) + xpDelta } : prev);
      triggerXpPopup(xpDelta);
    }

    try {
      if (type === 'like') {
        await handleLikeEpisode(selectedEpisodeId);
      } else if (type === 'comment') {
        const res = await episodeService.addComment(selectedEpisodeId, content || '', parentId, token);
        const data = await res.json();
        if (res.ok) {
          triggerXpPopup(data.xp_earned || 15);
          setCommentInput('');
          setReplyingToComment(null);
          fetchEpisodeDetail(selectedEpisodeId);
          fetchUserProfile();
        }
      } else if (type === 'comment_like' && parentId) {
        const res = await fetch(`${API_BASE}/api/community/comments/${parentId}/like`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          fetchUserProfile();
        } else {
          setUser((prev: any) => prev ? { ...prev, total_xp: prev.total_xp - xpDelta, weekly_xp: (prev.weekly_xp || 0) - xpDelta } : prev);
          fetchEpisodeDetail(selectedEpisodeId);
        }
      }
    } catch (e) {
      if (type === 'comment_like') {
        setUser((prev: any) => prev ? { ...prev, total_xp: prev.total_xp - xpDelta, weekly_xp: (prev.weekly_xp || 0) - xpDelta } : prev);
      }
      console.error(e);
    } finally {
      setEpisodeInteracting(false);
    }
  };

  const handleLikeEpisode = async (episodeId: number) => {
    if (!token) {
      showToast('Please login to like episodes.');
      return;
    }
    playChatSound('react');
    const likeXp = 5;
    const currentEp = (episodes as any[]).find((ep: any) => ep.id === episodeId);
    const wasLiked = currentEp?.isLiked ?? (episodeDetail?.episode?.id === episodeId ? episodeDetail.has_liked : false);
    
    setEpisodes((prev: any) => prev.map((ep: any) => {
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

    const xpDelta = wasLiked ? -likeXp : likeXp;
    setUser((prev: any) => prev ? { ...prev, total_xp: prev.total_xp + xpDelta, weekly_xp: (prev.weekly_xp || 0) + xpDelta } : prev);
    triggerXpPopup(xpDelta);

    try {
      const res = await episodeService.likeEpisode(episodeId, token);
      if (res.ok) {
        fetchUserProfile();
      } else {
        setUser((prev: any) => prev ? { ...prev, total_xp: prev.total_xp - xpDelta, weekly_xp: (prev.weekly_xp || 0) - xpDelta } : prev);
        fetchEpisodes();
      }
    } catch (e) {
      setUser((prev: any) => prev ? { ...prev, total_xp: prev.total_xp - xpDelta, weekly_xp: (prev.weekly_xp || 0) - xpDelta } : prev);
      fetchEpisodes();
    }
  };

  const handleShareEpisode = async (episodeId: number) => {
    const ref = user ? user.username : '';
    const shareLink = `${window.location.origin}/episodes/${episodeId}${ref ? '?ref=' + ref : ''}`;
    navigator.clipboard.writeText(shareLink).catch(() => {});
    showToast('Episode link copied to clipboard! 🔗');
  };

  const handleQuizSubmit = async (quizId: number) => {
    if (quizAnswer === null || !token || !selectedEpisodeId) return;
    try {
      const res = await episodeService.submitQuiz(selectedEpisodeId, quizAnswer, token);
      const data = await res.json();
      if (res.ok) {
        setQuizResult(data);
        if (data.isCorrect) {
          playChatSound('win');
          triggerXpPopup(data.xp_earned || 150);
        } else {
          playChatSound('error');
        }
        fetchUserProfile();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    try {
      const res = await episodeService.deleteComment(commentId, token);
      if (res.ok) {
        triggerXpPopup(-15);
        if (selectedEpisodeId) fetchEpisodeDetail(selectedEpisodeId);
        fetchUserProfile();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleEditComment = async (commentId: number, content: string) => {
    if (!content.trim()) return;
    try {
      const res = await episodeService.editComment(commentId, content, token);
      if (res.ok) {
        if (selectedEpisodeId) fetchEpisodeDetail(selectedEpisodeId);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleQuizSubmitRedirect = async (quizId: number) => {
    handleQuizSubmit(quizId);
  };



  const handleCreatePost = async (title: string, content: string, imageUrl: string, isNews: boolean = false) => {
    if (!token || !user) return;
    const userId = getUserId(user, token);

    const ROLE_WEIGHTS = { user: 0, moderator: 1, admin: 2, owner: 3 };
    const userWeight = ROLE_WEIGHTS[user.role as keyof typeof ROLE_WEIGHTS] || 0;
    const isApprovedStaff = userWeight >= 1;

    // Create local pending post object
    const tempId = `temp-${Date.now()}`;
    const pendingPost = {
      id: tempId,
      user_id: user.id,
      username: user.username,
      avatar_url: user.avatar_url,
      equipped_frame: user.equipped_frame || 'none',
      batch: user.batch || '',
      rank: getClientRank(user.total_xp || 0),
      title: title || null,
      content: content,
      image_url: imageUrl || null,
      likes_count: 0,
      shares_count: 0,
      comments_count: 0,
      created_at: new Date().toISOString(),
      status: isApprovedStaff ? 'approved' : 'pending',
      pending: !isApprovedStaff,
      isLiked: false,
      is_news: isNews
    };

    // Insert the post immediately into the current feed and save it to the cache
    console.log('[CreatePost] Optimistically inserting pending post:', pendingPost);
    if (isNews) {
      setNewsPosts(prev => {
        const updated = [pendingPost, ...prev];
        console.log('[CreatePost] News posts after optimistic insert count:', updated.length);
        if (userId) feedCacheService.set(`news_${userId}`, updated);
        return updated;
      });
    } else {
      setCommunityPosts(prev => {
        const updated = [pendingPost, ...prev];
        console.log('[CreatePost] Community posts after optimistic insert count:', updated.length);
        if (userId) feedCacheService.set(`feed_${userId}`, updated);
        return updated;
      });
    }

    try {
      const res = await communityService.createPost(title, content, imageUrl, isNews, token);
      const data = await res.json();
      console.log('[CreatePost] API response status:', res.status, 'data:', data);

      if (res.ok) {
        showToast(data.message || 'Post published! 🎉');
        fetchUserProfile();

        if (isNews) {
          setNewsPosts(prev => {
            const updated = prev.map(p => {
              if (p.id === tempId) {
                return {
                  ...p,
                  id: data.id,
                  status: data.status,
                  pending: data.status === 'pending'
                };
              }
              return p;
            });
            console.log('[CreatePost] News posts after updating temp ID:', updated);
            if (userId) feedCacheService.set(`news_${userId}`, updated);
            return updated;
          });
          fetchNewsPosts(true);
        } else {
          setCommunityPosts(prev => {
            const updated = prev.map(p => {
              if (p.id === tempId) {
                return {
                  ...p,
                  id: data.id,
                  status: data.status,
                  pending: data.status === 'pending'
                };
              }
              return p;
            });
            console.log('[CreatePost] Community posts after updating temp ID:', updated);
            if (userId) feedCacheService.set(`feed_${userId}`, updated);
            return updated;
          });
          fetchCommunityPosts(undefined, true);
        }
      } else {
        showToast(data.error || 'Failed to create post.');
        if (isNews) {
          setNewsPosts(prev => {
            const updated = prev.filter(p => p.id !== tempId);
            if (userId) feedCacheService.set(`news_${userId}`, updated);
            return updated;
          });
        } else {
          setCommunityPosts(prev => {
            const updated = prev.filter(p => p.id !== tempId);
            if (userId) feedCacheService.set(`feed_${userId}`, updated);
            return updated;
          });
        }
      }
    } catch (err) {
      showToast('Connection failed.');
      if (isNews) {
        setNewsPosts(prev => {
          const updated = prev.filter(p => p.id !== tempId);
          if (userId) feedCacheService.set(`news_${userId}`, updated);
          return updated;
        });
      } else {
        setCommunityPosts(prev => {
          const updated = prev.filter(p => p.id !== tempId);
          if (userId) feedCacheService.set(`feed_${userId}`, updated);
          return updated;
        });
      }
    }
  };

  const handleEditPost = async (postId: number, content: string, imageUrl: string, title?: string | null) => {
    if (!token || !user) return;
    const userId = getUserId(user, token);
    try {
      const res = await communityService.editPost(postId, content, imageUrl, token);
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || 'Post updated successfully!');
        
        setCommunityPosts(prev => {
          const updated = prev.map(p => {
            if (p.id === postId) {
              return {
                ...p,
                content,
                image_url: imageUrl,
                status: data.status || p.status
              };
            }
            return p;
          });
          if (userId) feedCacheService.set(`feed_${userId}`, updated);
          return updated;
        });

        setNewsPosts(prev => {
          const updated = prev.map(p => {
            if (p.id === postId) {
              return {
                ...p,
                content,
                image_url: imageUrl,
                status: data.status || p.status
              };
            }
            return p;
          });
          if (userId) feedCacheService.set(`news_${userId}`, updated);
          return updated;
        });

        fetchCommunityPosts(undefined, true);
        fetchNewsPosts(true);
      } else {
        showToast(data.error || 'Failed to update post.');
      }
    } catch (err) {
      showToast('Connection error.');
    }
  };

  const handleDeletePost = async (postId: number) => {
    showConfirm(
      'Delete Post',
      'Are you sure you want to delete this post? This action cannot be undone.',
      async () => {
        if (!token || !user) return;
        const userId = getUserId(user, token);
        try {
          const res = await communityService.deletePost(postId, token);
          const data = await res.json();
          if (res.ok) {
            showToast(data.message || 'Post deleted successfully.');
            
            setCommunityPosts(prev => {
              const updated = prev.filter(p => p.id !== postId);
              if (userId) feedCacheService.set(`feed_${userId}`, updated);
              return updated;
            });
            setNewsPosts(prev => {
              const updated = prev.filter(p => p.id !== postId);
              if (userId) feedCacheService.set(`news_${userId}`, updated);
              return updated;
            });

            fetchCommunityPosts(undefined, true);
            fetchNewsPosts(true);
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

  const handleCancelPostRevision = async (postId: number) => {
    showConfirm(
      'Cancel Pending Revision',
      'Are you sure you want to discard your pending edit draft? This will revert the post to the live approved version.',
      async () => {
        if (!token || !user) return;
        const userId = getUserId(user, token);
        try {
          const res = await fetch(`${API_BASE}/api/community/posts/${postId}/revision`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const data = await res.json();
          if (res.ok) {
            showToast(data.message || 'Pending revision discarded.');
            
            setCommunityPosts(prev => {
              const updated = prev.map(p => {
                if (p.id === postId) {
                  return { ...p, edit_draft: null };
                }
                return p;
              });
              if (userId) feedCacheService.set(`feed_${userId}`, updated);
              return updated;
            });

            fetchCommunityPosts(undefined, true);
          } else {
            showToast(data.error || 'Failed to cancel revision.');
          }
        } catch (err) {
          showToast('Connection error.');
        }
      },
      undefined, 'Discard', 'Cancel', 'warning'
    );
  };

  const handleLikePost = async (postId: number) => {
    if (!token || !user) return;
    const userId = getUserId(user, token);
    playChatSound('react');
    const likeXp = 5;

    const currentPost = communityPosts.find((p: any) => p.id === postId) || newsPosts.find((p: any) => p.id === postId);
    const wasLiked = currentPost?.isLiked ?? false;
    const xpDelta = wasLiked ? -likeXp : likeXp;

    setCommunityPosts((prev: any[]) => {
      const updated = prev.map((p: any) => {
        if (p.id !== postId) return p;
        return { ...p, isLiked: !p.isLiked, likes_count: p.likes_count + (p.isLiked ? -1 : 1) };
      });
      if (userId) feedCacheService.set(`feed_${userId}`, updated);
      return updated;
    });
    setNewsPosts((prev: any[]) => {
      const updated = prev.map((p: any) => {
        if (p.id !== postId) return p;
        return { ...p, isLiked: !p.isLiked, likes_count: p.likes_count + (p.isLiked ? -1 : 1) };
      });
      if (userId) feedCacheService.set(`news_${userId}`, updated);
      return updated;
    });

    setUser((prev: any) => prev ? { ...prev, total_xp: prev.total_xp + xpDelta, weekly_xp: (prev.weekly_xp || 0) + xpDelta } : prev);
    triggerXpPopup(xpDelta);

    try {
      const res = await communityService.likePost(postId, token);
      if (res.ok) {
        fetchUserProfile();
      } else {
        setUser((prev: any) => prev ? { ...prev, total_xp: prev.total_xp - xpDelta, weekly_xp: (prev.weekly_xp || 0) - xpDelta } : prev);
        
        setCommunityPosts((prev: any[]) => {
          const updated = prev.map((p: any) => {
            if (p.id !== postId) return p;
            return { ...p, isLiked: !p.isLiked, likes_count: p.likes_count + (p.isLiked ? -1 : 1) };
          });
          if (userId) feedCacheService.set(`feed_${userId}`, updated);
          return updated;
        });
        setNewsPosts((prev: any[]) => {
          const updated = prev.map((p: any) => {
            if (p.id !== postId) return p;
            return { ...p, isLiked: !p.isLiked, likes_count: p.likes_count + (p.isLiked ? -1 : 1) };
          });
          if (userId) feedCacheService.set(`news_${userId}`, updated);
          return updated;
        });
      }
    } catch (e) {
      setUser((prev: any) => prev ? { ...prev, total_xp: prev.total_xp - xpDelta, weekly_xp: (prev.weekly_xp || 0) - xpDelta } : prev);
      
      setCommunityPosts((prev: any[]) => {
        const updated = prev.map((p: any) => {
          if (p.id !== postId) return p;
          return { ...p, isLiked: !p.isLiked, likes_count: p.likes_count + (p.isLiked ? -1 : 1) };
        });
        if (userId) feedCacheService.set(`feed_${userId}`, updated);
        return updated;
      });
      setNewsPosts((prev: any[]) => {
        const updated = prev.map((p: any) => {
          if (p.id !== postId) return p;
          return { ...p, isLiked: !p.isLiked, likes_count: p.likes_count + (p.isLiked ? -1 : 1) };
        });
        if (userId) feedCacheService.set(`news_${userId}`, updated);
        return updated;
      });
      console.error(e);
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

  const handleAdminDeleteCode = (codeId: number, codeName: string) => {
    showConfirm(
      'Delete XP Code',
      `Are you sure you want to delete the XP Code "${codeName}"? This action cannot be undone.`,
      async () => {
        if (!token) return;
        try {
          const res = await gameService.adminDeleteCode(codeId, token);
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
        showToast(data.message || 'Action applied!');
        setModerationUser(null);
        fetchAdminUsers();
      } else {
        showToast(data.error || 'Failed to apply action.');
      }
    } catch (err) {
      showToast('Connection failed.');
    }
  };

  const handleAdminCreateEpisode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setAdminSubmitting(true);
    setAdminMessage('');
    try {
      const res = await fetch(`${API_BASE}/api/admin/episodes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(adminEpisodeForm)
      });
      const data = await res.json();
      setAdminMessage(data.message || data.error);
      if (res.ok) {
        showToast('Episode created successfully! 🎬');
        fetchEpisodes();
        setAdminEpisodeForm({
          title_ar: '', title_en: '', description: '', thumbnail_url: '', youtube_url: '',
          quiz_question: '', quiz_options: ['', '', '', ''], quiz_correct: 0,
          code: '', code_max_uses: 200, code_expiry: ''
        });
      }
    } catch (err) {
      setAdminMessage('Failed to connect to the server.');
    } finally {
      setAdminSubmitting(false);
    }
  };

  const handleShopPurchase = async (item: any): Promise<boolean> => {
    if (!token) {
      showToast('Please login to buy cosmetics.');
      return false;
    }
    try {
      const res = await fetch(`${API_BASE}/api/rewards/buy-cosmetic`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ name: item.id, cost: item.cost, type: item.type })
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || 'Purchased successfully! 🛍️');
        playChatSound('win');
        fetchUserProfile();
        return true;
      } else {
        showToast(data.error || 'Failed to purchase item.');
        playChatSound('error');
        return false;
      }
    } catch (err) {
      showToast('Connection error.');
      return false;
    }
  };

  const handleClaimSurpriseBox = async () => {
    if (!token) return;
    const todayStr = getLocalDateString();
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
        playChatSound('win');
        fetchUserProfile();
      } else {
        showToast(data.error || 'Failed to claim daily surprise box.');
        playChatSound('error');
      }
    } catch (err) {
      showToast('Connection error.');
    }
  };

  const renderModerationModal = () => {
    if (!moderationUser) return null;
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-[99999] animate-fade-in">
        <div className="glass-card w-full max-w-md p-6 relative flex flex-col gap-5 border border-red-500/25 shadow-red-glow">
          <div className="flex items-center gap-3 text-red-500">
            <ShieldAlert className="w-6 h-6 shrink-0" />
            <h3 className="text-lg font-black tracking-tight">إجراء رقابي ضد @{moderationUser.username}</h3>
          </div>
          
          <div className="flex flex-col gap-4 text-left">
            <div>
              <label className="text-[11px] font-black text-zinc-400 uppercase tracking-wider">الإجراء</label>
              <select 
                value={moderationAction} 
                onChange={(e) => setModerationAction(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-sm text-white font-bold mt-1.5 focus:border-red-500/50 outline-none"
              >
                <option value="mute">كتم الصوت (Mute)</option>
                <option value="unmute">إلغاء الكتم (Unmute)</option>
                <option value="ban">حظر المستخدم (Ban)</option>
                <option value="unban">إلغاء الحظر (Unban)</option>
              </select>
            </div>

            {['mute', 'ban'].includes(moderationAction) && (
              <div>
                <label className="text-[11px] font-black text-zinc-400 uppercase tracking-wider">المدة</label>
                <select 
                  value={moderationDuration} 
                  onChange={(e) => setModerationDuration(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-sm text-white font-bold mt-1.5 focus:border-red-500/50 outline-none"
                >
                  <option value="1h">ساعة واحدة</option>
                  <option value="1d">يوم واحد</option>
                  <option value="7d">7 أيام</option>
                  <option value="permanent">أبدي (Permanent)</option>
                </select>
              </div>
            )}
          </div>

          <div className="flex gap-3 mt-2">
            <button 
              onClick={handleAdminModerateUser}
              className="flex-1 bg-red-600 hover:bg-red-500 text-white font-black text-xs py-3 rounded-xl cursor-pointer transition-all active:scale-97"
            >
              تأكيد الإجراء
            </button>
            <button 
              onClick={() => setModerationUser(null)}
              className="border border-zinc-800 hover:bg-zinc-900 text-zinc-400 font-bold text-xs py-3 px-5 rounded-xl cursor-pointer transition-all"
            >
              إلغاء
            </button>
          </div>
        </div>
      </div>
    );
  };

  const unseenCount = currentPage === 'community' ? 0 : chatHook.chatMessages.filter((msg: any) => Number(msg.id || 0) > chatHook.lastSeenMessageId).length;

  return (
    <MainLayout
      unseenCount={unseenCount}
      setCommunityTab={setCommunityTab}
    >
      <AppRouter
        loginReward={loginReward}
        dailyQuestion={dailyQuestion}
        handleAnswerQuestion={handleAnswerQuestion}
        newPostContent={newPostContent}
        setNewPostContent={setNewPostContent}
        handleCreatePost={handleCreatePost}
        handleEditPost={handleEditPost}
        communityPosts={communityPosts}
        handleLikePost={handleLikePost}
        handleDeletePost={handleDeletePost}
        handleCancelPostRevision={handleCancelPostRevision}
        episodes={episodes}
        handleLikeEpisode={handleLikeEpisode}
        handleShareEpisode={handleShareEpisode}
        navigateToEpisode={navigateToEpisode}

        episodeDetailLoading={episodeDetailLoading}
        episodeDetail={episodeDetail}
        episodeInteracting={episodeInteracting}
        handleEpisodeInteract={handleEpisodeInteract}
        handleQuizSubmit={handleQuizSubmitRedirect}
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
        handleDeleteComment={handleDeleteComment}
        handleEditComment={handleEditComment}

        chatHook={chatHook}
        suggestions={suggestions}
        handleCreateSuggestion={handleCreateSuggestion}
        handleUpvoteSuggestion={handleUpvoteSuggestion}
        handleDeleteSuggestion={handleDeleteSuggestion}
        handleOpenModerationModal={handleOpenModerationModal}

        gamesHook={gamesHook}
        newsPosts={newsPosts}
        isLoadingOlderPosts={isLoadingOlderPosts}
        hasMorePosts={hasMorePosts}
        fetchCommunityPosts={fetchCommunityPosts}
        isRefreshingFeed={isRefreshingFeed}

        leaderboard={leaderboard}
        leaderboardTab={leaderboardTab}
        setLeaderboardTab={setLeaderboardTab}

        handleShopPurchase={handleShopPurchase}
        handleClaimSurpriseBox={handleClaimSurpriseBox}
        handleBuyFrame={async () => { fetchUserProfile(); return true; }}

        loginForm={loginForm}
        setLoginForm={setLoginForm}
        authError={authError}
        handleLogin={handleLogin}
        registerForm={registerForm}
        setRegisterForm={setRegisterForm}
        authSuccess={authSuccess}
        handleRegister={handleRegister}
        confirmCode={confirmCode}
        setConfirmCode={setConfirmCode}
        handleConfirm={handleConfirm}
        handleForgotPassword={handleForgotPassword}
        handleResetPassword={handleResetPassword}

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
        handleAdminUpdateUserRole={handleAdminUpdateUserRole}
        handleAdminUpdateSuggestionStatus={handleAdminUpdateSuggestionStatus}
        handleAdminDeleteCode={handleAdminDeleteCode}
        handleAdminDeleteUser={handleAdminDeleteUser}
        apiBase={API_BASE}
      />
      {renderModerationModal()}
    </MainLayout>
  );
}

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <NotificationProvider>
          <InnerApp />
        </NotificationProvider>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
