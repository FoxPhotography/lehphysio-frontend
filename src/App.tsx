import React, { useState, useEffect, useRef } from 'react';
import { playChatSound, getNameColor, getLocalDateString } from './utils/helpers';
import { ShieldAlert } from 'lucide-react';

// Services
import { API_BASE } from './services/api';
import { authService } from './services/authService';
import { episodeService } from './services/episodeService';
import { communityService } from './services/communityService';
import { gameService } from './services/gameService';

// Context
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider, useSocket } from './context/SocketContext';

// Hooks
import { useChat } from './hooks/useChat';
import { useGames } from './hooks/useGames';

// Layout & Routing
import { MainLayout } from './layouts/MainLayout';
import { AppRouter } from './routes/router';

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
    setStreakOverlay
  } = useAuth();

  const socket = useSocket();

  // App Data
  const [episodes, setEpisodes] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [leaderboardTab, setLeaderboardTab] = useState('all-time');
  const [communityPosts, setCommunityPosts] = useState<any[]>([]);
  const [newsPosts, setNewsPosts] = useState<any[]>([]);
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

  // Polls Mock State
  const [pollVotes, setPollVotes] = useState<number[]>([42, 12, 8, 25]);
  const [hasVotedPoll, setHasVotedPoll] = useState(false);
  const [userVotedOption, setUserVotedOption] = useState<number | null>(null);

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
          }
        }, 400);
      }
    }
  }, [communityPosts]);

  useEffect(() => {
    if (currentPage === 'leaderboard') fetchLeaderboard();
  }, [currentPage, leaderboardTab]);

  const fetchEpisodes = async () => {
    try {
      const res = await episodeService.fetchEpisodes(token);
      const data = await res.json();
      if (res.ok) setEpisodes(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const res = await gameService.fetchLeaderboard(leaderboardTab, user?.batch);
      const data = await res.json();
      if (res.ok) setLeaderboard(data);
    } catch (e) {
      console.error(e);
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

  const handleAdminToggleUserRole = async (userId: number, currentRole: string) => {
    if (!token) return;
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    showConfirm(
      'Change User Role',
      `Are you sure you want to change this user's role to ${newRole === 'admin' ? 'Admin' : 'Student'}?`,
      async () => {
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
      }
    );
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

  const fetchCommunityPosts = async (beforeId?: string) => {
    if (beforeId) {
      setIsLoadingOlderPosts(true);
    }
    try {
      const res = await communityService.fetchCommunityPosts(beforeId, token);
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
      const res = await communityService.fetchNewsPosts(token);
      const data = await res.json();
      if (res.ok) {
        setNewsPosts(data);
      }
    } catch (e) {
      console.error(e);
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
    try {
      const res = await authService.login(loginForm);
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
      const res = await authService.register(registerForm);
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
      const res = await authService.confirmCode(confirmEmail, confirmCode);
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
      const res = await authService.forgotPassword(email);
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
      const res = await authService.resetPassword(forgotEmail, code, newPassword);
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

  const handlePollVote = async (optionIdx: number) => {
    if (!token) {
      showToast('Please login to vote 🔐');
      return;
    }
    if (hasVotedPoll) return;
    
    setHasVotedPoll(true);
    setUserVotedOption(optionIdx);
    setPollVotes(prev => prev.map((v, i) => i === optionIdx ? v + 1 : v));
    triggerXpPopup(30);

    try {
      const res = await fetch(`${API_BASE}/api/rewards/poll-vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ optionIndex: optionIdx })
      });
      if (res.ok) {
        fetchUserProfile();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreatePost = async (title: string, content: string, imageUrl: string, isNews: boolean = false) => {
    if (!token) return;
    try {
      const res = await communityService.createPost(title, content, imageUrl, isNews, token);
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || 'Post published! 🎉');
        triggerXpPopup(25);
        fetchCommunityPosts();
        fetchNewsPosts();
        fetchUserProfile();
      } else {
        showToast(data.error || 'Failed to create post.');
      }
    } catch (err) {
      showToast('Connection failed.');
    }
  };

  const handleEditPost = async (postId: number, content: string, imageUrl: string, title?: string | null) => {
    if (!token) return;
    try {
      const res = await communityService.editPost(postId, content, imageUrl, token);
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

  const handleDeletePost = async (postId: number) => {
    showConfirm(
      'Delete Post',
      'Are you sure you want to delete this post? This action cannot be undone.',
      async () => {
        if (!token) return;
        try {
          const res = await communityService.deletePost(postId, token);
          const data = await res.json();
          if (res.ok) {
            showToast(data.message || 'Post deleted successfully.');
            fetchCommunityPosts();
            fetchNewsPosts();
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

  const handleLikePost = async (postId: number) => {
    if (!token) return;
    playChatSound('react');
    const likeXp = 5;

    const currentPost = communityPosts.find((p: any) => p.id === postId) || newsPosts.find((p: any) => p.id === postId);
    const wasLiked = currentPost?.isLiked ?? false;
    const xpDelta = wasLiked ? -likeXp : likeXp;

    setCommunityPosts((prev: any[]) => prev.map((p: any) => {
      if (p.id !== postId) return p;
      return { ...p, isLiked: !p.isLiked, likes_count: p.likes_count + (p.isLiked ? -1 : 1) };
    }));
    setNewsPosts((prev: any[]) => prev.map((p: any) => {
      if (p.id !== postId) return p;
      return { ...p, isLiked: !p.isLiked, likes_count: p.likes_count + (p.isLiked ? -1 : 1) };
    }));

    setUser((prev: any) => prev ? { ...prev, total_xp: prev.total_xp + xpDelta, weekly_xp: (prev.weekly_xp || 0) + xpDelta } : prev);
    triggerXpPopup(xpDelta);

    try {
      const res = await communityService.likePost(postId, token);
      if (res.ok) {
        fetchUserProfile();
      } else {
        setUser((prev: any) => prev ? { ...prev, total_xp: prev.total_xp - xpDelta, weekly_xp: (prev.weekly_xp || 0) - xpDelta } : prev);
        fetchCommunityPosts();
        fetchNewsPosts();
      }
    } catch (e) {
      setUser((prev: any) => prev ? { ...prev, total_xp: prev.total_xp - xpDelta, weekly_xp: (prev.weekly_xp || 0) - xpDelta } : prev);
      fetchCommunityPosts();
      fetchNewsPosts();
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
        triggerXpPopup(data.xp_earned || 50);
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
        handleAdminToggleUserRole={handleAdminToggleUserRole}
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
        <InnerApp />
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
