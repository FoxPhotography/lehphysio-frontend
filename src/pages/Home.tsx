import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserAvatar } from '../components/UserAvatar';
import { 
  Gift, 
  Play, 
  Flame, 
  ChevronLeft, 
  Key, 
  MessageSquare, 
  Gamepad2, 
  Store, 
  Trophy, 
  ListVideo, 
  BarChart3, 
  Image as ImageIcon, 
  Loader2, 
  Send, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  Heart, 
  MessageCircle, 
  Share2, 
  X, 
  CornerUpLeft,
  Check,
  Zap,
  Sparkles,
  Crown,
  Medal,
  Star
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE || (
  window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname.startsWith('192.168.') 
    ? `http://${window.location.hostname}:5000` 
    : ''
);

interface HomeProps {
  user: any;
  loginReward: any;
  navigateToEpisode: (id: number) => void;
  setCurrentPage: (page: string) => void;
  setCommunityTab: (tab: 'feed' | 'chat') => void;
  pollVotes: number[];
  userVotedOption: number | null;
  hasVotedPoll: boolean;
  handlePollVote: (idx: number) => void;
  newPostContent: string;
  setNewPostContent: (content: string) => void;
  handleCreatePost: (title: string, content: string, imageUrl: string) => Promise<void>;
  handleEditPost: (id: number, content: string, imageUrl: string) => Promise<void>;
  communityPosts: any[];
  handleLikePost: (id: number) => void;
  handleDeletePost: (id: number) => void;
  handleSharePost: (id: number) => void;
  handleUploadImage: (file: File) => Promise<string | null>;
  usernames?: any[];
  showToast: (msg: string) => void;
  leaderboard?: any[];
  equippedFrame?: string;
  episodes?: any[];
  xpSettings?: any;
  newsPosts: any[];
  loadOlderPosts?: (beforeId: string) => void;
  isLoadingOlderPosts?: boolean;
  hasMorePosts?: boolean;
}

// Helper to strip emojis from text
const stripEmojis = (str: string) => {
  if (!str) return '';
  return str.replace(/[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]/g, '').trim();
};

export const Home: React.FC<HomeProps> = ({
  user,
  loginReward,
  navigateToEpisode,
  setCurrentPage,
  setCommunityTab,
  pollVotes,
  userVotedOption,
  hasVotedPoll,
  handlePollVote,
  newPostContent,
  setNewPostContent,
  handleCreatePost,
  handleEditPost,
  communityPosts,
  handleLikePost,
  handleDeletePost,
  handleSharePost,
  handleUploadImage,
  usernames,
  showToast,
  leaderboard = [],
  equippedFrame,
  episodes = [],
  triggerXpPopup,
  xpSettings = {},
  newsPosts = [],
  loadOlderPosts,
  isLoadingOlderPosts = false,
  hasMorePosts = true
}) => {
  const activeStreak = user?.streak_count || 0;
  const first = leaderboard[0];
  const second = leaderboard[1];
  const third = leaderboard[2];

  // Composer fields
  const [uploadedImageUrl, setUploadedImageUrl] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [isNewsPost, setIsNewsPost] = useState(false);

  // Post editing states
  const [editingPostId, setEditingPostId] = useState<number | null>(null);
  const [editPostContent, setEditPostContent] = useState('');
  const [editPostImageUrl, setEditPostImageUrl] = useState('');
  const [isUploadingEditImage, setIsUploadingEditImage] = useState(false);

  // 3-dot post menu
  const [openPostMenu, setOpenPostMenu] = useState<number | null>(null);

  // Expandable Comments panel states
  const [expandedComments, setExpandedComments] = useState<{[key: number]: any[]}>({});
  const [commentsLoading, setCommentsLoading] = useState<{[key: number]: boolean}>({});
  const [newCommentTexts, setNewCommentTexts] = useState<{[key: number]: string}>({});
  const [commentMentionSearch, setCommentMentionSearch] = useState<{[key: number]: string | null}>({});
  const [replyingToComment, setReplyingToComment] = useState<{[key: number]: any | null}>({});
  const [commentSubmitting, setCommentSubmitting] = useState<{[key: number]: boolean}>({});
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; commentId: number; content: string; postId: number; parentId?: number } | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editCommentText, setEditCommentText] = useState('');

  // Lightbox & image zoom state
  const [activeLightboxImg, setActiveLightboxImg] = useState<string | null>(null);

  // Click coordinator to avoid conflict between single tap (zoom) and double tap (like)
  const clickTimeoutRef = useRef<{[key: number]: any}>({});
  const lastClickTimeRef = useRef<{ [key: number]: number }>({});

  const handleImageClickCoord = (postId: number, imageUrl: string) => {
    const now = Date.now();
    const lastClick = lastClickTimeRef.current[postId] || 0;
    
    if (now - lastClick < 300) {
      // Double tap/click detected!
      lastClickTimeRef.current[postId] = 0; // Reset
      if (clickTimeoutRef.current[postId]) {
        clearTimeout(clickTimeoutRef.current[postId]);
        delete clickTimeoutRef.current[postId];
      }
      
      // Perform Like
      handleLikePost(postId);
      
      // Heart animation
      const hid = ++heartIdCounter.current;
      setFloatingHearts(prev => [...prev, { id: hid, postId }]);
      setTimeout(() => {
        setFloatingHearts(prev => prev.filter(h => h.id !== hid));
      }, 800);
    } else {
      // First tap/click
      lastClickTimeRef.current[postId] = now;
      
      // Clear any existing timeout for this post
      if (clickTimeoutRef.current[postId]) {
        clearTimeout(clickTimeoutRef.current[postId]);
      }
      
      clickTimeoutRef.current[postId] = setTimeout(() => {
        delete clickTimeoutRef.current[postId];
        // Perform Single tap action (expand/lightbox)
        setActiveLightboxImg(imageUrl);
      }, 250); // 250ms window
    }
  };

  useEffect(() => {
    if (contextMenu) {
      const close = () => setContextMenu(null);
      const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
      document.addEventListener('click', close);
      document.addEventListener('keydown', onKey);
      return () => {
        document.removeEventListener('click', close);
        document.removeEventListener('keydown', onKey);
      };
    }
  }, [contextMenu]);

  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop >=
        document.documentElement.offsetHeight - 200
      ) {
        if (!isLoadingOlderPosts && hasMorePosts && loadOlderPosts) {
          const oldestPost = communityPosts[communityPosts.length - 1];
          if (oldestPost) {
            loadOlderPosts(oldestPost.id);
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [communityPosts, isLoadingOlderPosts, hasMorePosts, loadOlderPosts]);

  // Double-tap to like
  const lastTapRef = useRef<{postId: number; time: number} | null>(null);
  const [floatingHearts, setFloatingHearts] = useState<{id: number; postId: number}[]>([]);
  const heartIdCounter = useRef(0);

  const handleDoubleTapLike = (postId: number) => {
    const now = Date.now();
    if (lastTapRef.current && lastTapRef.current.postId === postId && now - lastTapRef.current.time < 300) {
      lastTapRef.current = null;
      handleLikePost(postId);
      
      const hid = ++heartIdCounter.current;
      setFloatingHearts(prev => [...prev, { id: hid, postId }]);
      setTimeout(() => {
        setFloatingHearts(prev => prev.filter(h => h.id !== hid));
      }, 800);
    } else {
      lastTapRef.current = { postId, time: now };
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setIsUploadingImage(true);
    const url = await handleUploadImage(file);
    setIsUploadingImage(false);
    if (url) {
      setUploadedImageUrl(url);
    }
  };

  const handleSubmitPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim() || isPosting) return;
    setIsPosting(true);
    await handleCreatePost('', newPostContent, uploadedImageUrl);
    setNewPostContent('');
    setUploadedImageUrl('');
    setIsPosting(false);
  };

  const toggleComments = async (postId: number) => {
    if (expandedComments[postId] !== undefined) {
      setExpandedComments(prev => {
        const updated = { ...prev };
        delete updated[postId];
        return updated;
      });
      return;
    }

    setCommentsLoading(prev => ({ ...prev, [postId]: true }));
    try {
      const res = await fetch(`${API_BASE}/api/community/posts/${postId}/comments`);
      if (res.ok) {
        const data = await res.json();
        setExpandedComments(prev => ({ ...prev, [postId]: data }));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCommentsLoading(prev => ({ ...prev, [postId]: false }));
    }
  };

  const submitComment = async (postId: number, parentId?: number) => {
    const text = newCommentTexts[postId]?.trim();
    if (!text || !user) return;
    setCommentSubmitting(prev => ({ ...prev, [postId]: true }));

    try {
      const res = await fetch(`${API_BASE}/api/community/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ content: text, parent_id: parentId || null })
      });
      if (res.ok) {
        const comment = await res.json();
        if (comment.xp_earned) triggerXpPopup(comment.xp_earned);
        if (parentId) {
          setExpandedComments(prev => ({
            ...prev,
            [postId]: (prev[postId] || []).map((c: any) =>
              c.id === parentId ? { ...c, replies: [...(c.replies || []), comment] } : c
            )
          }));
        } else {
          setExpandedComments(prev => ({
            ...prev,
            [postId]: [...(prev[postId] || []), comment]
          }));
        }
        setNewCommentTexts(prev => ({ ...prev, [postId]: '' }));
        setReplyingToComment(prev => ({ ...prev, [postId]: null }));
      } else {
        const errData = await res.json().catch(() => ({}));
        showToast(errData.error || 'Failed to post comment');
      }
    } catch (e) {
      console.error(e);
      showToast('Network error: Failed to post comment');
    } finally {
      setCommentSubmitting(prev => ({ ...prev, [postId]: false }));
    }
  };

  const deleteComment = async (postId: number, commentId: number, isReply?: boolean, parentId?: number) => {
    try {
      const res = await fetch(`${API_BASE}/api/community/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (res.ok) {
        triggerXpPopup(-15);
        if (isReply && parentId) {
          setExpandedComments(prev => ({
            ...prev,
            [postId]: (prev[postId] || []).map((c: any) =>
              c.id === parentId ? { ...c, replies: (c.replies || []).filter((r: any) => r.id !== commentId) } : c
            )
          }));
        } else {
          setExpandedComments(prev => ({
            ...prev,
            [postId]: (prev[postId] || []).filter(c => c.id !== commentId)
          }));
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCommentLike = async (postId: number, commentId: number) => {
    if (!user) return;

    setExpandedComments(prev => ({
      ...prev,
      [postId]: (prev[postId] || []).map((c: any) => {
        if (c.id === commentId) {
          const newLiked = !c.has_liked;
          return { ...c, has_liked: newLiked, likes_count: c.likes_count + (newLiked ? 1 : -1) };
        }
        return { ...c, replies: (c.replies || []).map((r: any) =>
          r.id === commentId ? { ...r, has_liked: !r.has_liked, likes_count: r.likes_count + (!r.has_liked ? 1 : -1) } : r
        )};
      })
    }));

    try {
      const res = await fetch(`${API_BASE}/api/community/comments/${commentId}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!res.ok) {
        setExpandedComments(prev => ({
          ...prev,
          [postId]: (prev[postId] || []).map((c: any) => {
            if (c.id === commentId) {
              const reverted = !c.has_liked;
              return { ...c, has_liked: reverted, likes_count: c.likes_count + (reverted ? 1 : -1) };
            }
            return { ...c, replies: (c.replies || []).map((r: any) =>
              r.id === commentId ? { ...r, has_liked: !r.has_liked, likes_count: r.likes_count + (!r.has_liked ? 1 : -1) } : r
            )};
          })
        }));
      }
    } catch (e) {
      console.error(e);
      setExpandedComments(prev => ({
        ...prev,
        [postId]: (prev[postId] || []).map((c: any) => {
          if (c.id === commentId) {
            const reverted = !c.has_liked;
            return { ...c, has_liked: reverted, likes_count: c.likes_count + (reverted ? 1 : -1) };
          }
          return { ...c, replies: (c.replies || []).map((r: any) =>
            r.id === commentId ? { ...r, has_liked: !r.has_liked, likes_count: r.likes_count + (!r.has_liked ? 1 : -1) } : r
          )};
        })
      }));
    }
  };

  const handleEditCommunityComment = async (commentId: number, content: string) => {
    if (!content.trim()) return;
    try {
      const res = await fetch(`${API_BASE}/api/community/comments/${commentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ content: content.trim() })
      });
      if (res.ok) {
        setEditingCommentId(null);
        setEditCommentText('');
        Object.keys(expandedComments).forEach(async (pid) => {
          const postId = parseInt(pid);
          const dataRes = await fetch(`${API_BASE}/api/community/posts/${postId}/comments`);
          if (dataRes.ok) {
            const data = await dataRes.json();
            setExpandedComments(prev => ({ ...prev, [postId]: data }));
          }
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCommentInputChange = (postId: number, text: string) => {
    setNewCommentTexts(prev => ({ ...prev, [postId]: text }));
    const lastAtIdx = text.lastIndexOf('@');
    if (lastAtIdx !== -1) {
      const isStartOrAfterSpace = lastAtIdx === 0 || text[lastAtIdx - 1] === ' ' || text[lastAtIdx - 1] === '\n';
      const textAfterAt = text.substring(lastAtIdx + 1);
      if (isStartOrAfterSpace && !textAfterAt.includes(' ')) {
        setCommentMentionSearch(prev => ({ ...prev, [postId]: textAfterAt }));
        return;
      }
    }
    setCommentMentionSearch(prev => ({ ...prev, [postId]: null }));
  };

  const handleSelectCommentMention = (postId: number, targetUsername: string) => {
    const text = newCommentTexts[postId] || '';
    const lastAtIdx = text.lastIndexOf('@');
    if (lastAtIdx === -1) return;
    const beforeAt = text.substring(0, lastAtIdx);
    const updatedText = beforeAt + `@${targetUsername} `;
    setNewCommentTexts(prev => ({ ...prev, [postId]: updatedText }));
    setCommentMentionSearch(prev => ({ ...prev, [postId]: null }));
    setTimeout(() => {
      document.getElementById(`comment-input-${postId}`)?.focus();
    }, 50);
  };

  const renderTextWithMentions = (text: string) => {
    if (!text) return '';
    const parts = text.split(/(@\w+)/g);
    return parts.map((part, idx) => {
      if (part.startsWith('@')) {
        return (
          <span key={idx} className="text-yellow-400 font-extrabold">
            {part}
          </span>
        );
      }
      return part;
    });
  };

  return (
    <div className="space-y-10 pt-20 md:pt-6 pb-20 max-w-4xl mx-auto px-4">
      {/* Banner alerts */}
      {loginReward && loginReward.daily_login && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 px-5 py-4 bg-brand-orange/10 border border-brand-orange/20 text-white rounded-2xl shadow-ambient"
        >
          <Gift className="w-5 h-5 text-brand-orange shrink-0" />
          <span className="text-sm font-bold">
            Welcome back! You earned <strong className="text-brand-orange">+{xpSettings.daily_login || 10} XP</strong> for your daily login.
          </span>
        </motion.div>
      )}

      {/* Hero podcast card - latest episode */}
      <section className="glass-card p-6 md:p-8 hover:border-brand-orange/30 group relative overflow-hidden">
        {(() => {
          const sorted = [...episodes].sort((a: any, b: any) => b.id - a.id);
          const latestEp = sorted.length > 0 ? sorted[0] : null;
          return latestEp ? (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 md:gap-8 items-center relative z-10">
              <div 
                className="md:col-span-2 aspect-[16/9] w-full rounded-2xl bg-zinc-900 bg-cover bg-center relative shadow-2xl flex items-center justify-center overflow-hidden group-hover:scale-[1.01] transition-transform duration-500 border border-zinc-800/40" 
                style={{ backgroundImage: `url(${latestEp.thumbnail_url || 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?q=80&w=600&auto=format&fit=crop'})` }}
              >
                <div className="absolute inset-0 bg-black/40 bg-radial-gradient" />
                <Play className="w-16 h-16 text-brand-orange filter drop-shadow-[0_0_15px_rgba(255,106,0,0.6)] animate-float-mic relative z-10 shrink-0" />
              </div>
              <div className="md:col-span-3 flex flex-col gap-4 text-left">
                <div className="flex gap-2">
                  <span className="text-[10px] font-black tracking-wider bg-brand-orange/20 text-brand-orange px-2.5 py-1 rounded-md uppercase">
                    New Episode
                  </span>
                  <span className="text-[10px] font-bold tracking-wider bg-zinc-800 text-zinc-300 px-2.5 py-1 rounded-md uppercase">
                    EP.{latestEp.id}
                  </span>
                </div>
                <h2 className="text-xl md:text-2xl font-black text-white leading-tight">
                  {latestEp.title_ar || 'New Episode'}
                </h2>
                <p className="text-zinc-400 text-sm font-medium line-clamp-2 leading-relaxed">
                  {latestEp.description || ''}
                </p>
                <div className="mt-2">
                  <button 
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-brand-orange to-brand-amber text-black font-extrabold text-sm px-6 py-3 rounded-full cursor-pointer hover:shadow-orange-intense hover:scale-102 active:scale-98 transition-all shadow-orange-glow" 
                    onClick={() => navigateToEpisode(latestEp.id)}
                  >
                    <Play className="w-4 h-4 fill-current" /> Watch Now
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 md:gap-8 items-center relative z-10">
              <div 
                className="md:col-span-2 aspect-[16/9] w-full rounded-2xl bg-zinc-900 bg-cover bg-center relative shadow-2xl flex items-center justify-center overflow-hidden border border-zinc-800/40" 
                style={{ backgroundImage: `url('https://images.unsplash.com/photo-1590602847861-f357a9332bbc?q=80&w=600&auto=format&fit=crop')` }}
              >
                <div className="absolute inset-0 bg-black/40 bg-radial-gradient" />
                <Play className="w-16 h-16 text-brand-orange filter drop-shadow-[0_0_15px_rgba(255,106,0,0.6)] animate-float-mic relative z-10 shrink-0" />
              </div>
              <div className="md:col-span-3 flex flex-col gap-4 text-left">
                <div className="flex gap-2">
                  <span className="text-[10px] font-black tracking-wider bg-brand-orange/20 text-brand-orange px-2.5 py-1 rounded-md uppercase">
                    Podcast
                  </span>
                </div>
                <h2 className="text-xl md:text-2xl font-black text-white leading-tight">
                  Leh Physio?
                </h2>
                <p className="text-zinc-400 text-sm font-medium leading-relaxed">
                  Listen. Learn. Elevate your level.
                </p>
                <div className="mt-2">
                  <button 
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-brand-orange to-brand-amber text-black font-extrabold text-sm px-6 py-3 rounded-full cursor-pointer hover:shadow-orange-intense hover:scale-102 active:scale-98 transition-all shadow-orange-glow" 
                    onClick={() => setCurrentPage('episodes')}
                  >
                    <Play className="w-4 h-4 fill-current" /> Browse Episodes
                  </button>
                </div>
              </div>
            </div>
          );
        })()}
      </section>

      {/* Streak Panel */}
      <section className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="text-left">
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">Leh Physio?</h1>
          <p className="text-zinc-400 text-xs md:text-sm font-medium mt-1">Listen. Learn. Elevate your level.</p>
        </div>
        <button 
          className="self-start sm:self-auto flex items-center gap-2.5 px-5 py-2.5 rounded-2xl text-brand-amber font-extrabold text-sm border border-brand-orange/30 fire-glow-badge cursor-pointer transition-all duration-300 hover:scale-103 active:scale-97 group" 
          onClick={() => setCurrentPage('profile')}
        >
          <Flame className="w-5 h-5 text-brand-orange fill-current animate-fire-pulse" />
          <span>{activeStreak} Day Streak</span>
          <ChevronLeft className="w-4 h-4 text-zinc-500 group-hover:-translate-x-0.5 transition-transform" />
        </button>
      </section>

      {/* Quick XP actions grid */}
      <section className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        {[
          { label: 'Watch', xp: `+${xpSettings.quiz_solve || 150} XP`, icon: Play, onClick: () => setCurrentPage('episodes') },
          { label: 'Enter Code', xp: 'Custom', icon: Key, onClick: () => setCurrentPage('rewards') },
          { label: 'Comment', xp: `+${xpSettings.comment || 15} XP`, icon: MessageSquare, onClick: () => { setCurrentPage('community'); setCommunityTab('chat'); } },
          { label: 'Challenges', xp: `+${xpSettings.game_play || 50} XP`, icon: Gamepad2, onClick: () => setCurrentPage('games') },
          { label: 'Rewards Shop', xp: 'Shop', icon: Store, onClick: () => setCurrentPage('rewards') },
        ].map((act, i) => {
          const Icon = act.icon;
          return (
            <div 
              key={i} 
              className="glass-card p-4 flex flex-col items-center justify-center text-center gap-2 cursor-pointer hover:border-brand-orange/30 group"
              onClick={act.onClick}
            >
              <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 group-hover:text-brand-orange group-hover:border-brand-orange/20 transition-all">
                <Icon className="w-5 h-5 shrink-0" />
              </div>
              <span className="text-xs font-black text-white leading-tight">{act.label}</span>
              <span className="text-[10px] font-bold text-brand-orange bg-brand-orange/10 px-2 py-0.5 rounded-full mt-1">
                {act.xp}
              </span>
            </div>
          );
        })}
      </section>

      {/* Stats Grid */}
      {user && (
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass-card p-5 text-left relative overflow-hidden">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Total XP</span>
            <div className="text-2xl font-black text-white mt-1">{(user.total_xp || 0).toLocaleString()}</div>
            {/* Sparkline decoration */}
            <svg className="absolute bottom-0 right-0 w-24 h-10 text-brand-orange/15 stroke-current fill-none stroke-[2]" viewBox="0 0 100 20">
              <path d="M0,15 L10,12 L20,18 L30,10 L40,14 L50,8 L60,11 L70,5 L80,12 L90,6 L100,2" />
            </svg>
          </div>
          
          <div className="glass-card p-5 text-left">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Level</span>
            <div className="text-2xl font-black text-white mt-1">{Math.floor((user.total_xp || 0) / 1000) + 1}</div>
            <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden mt-3.5 border border-zinc-800/40">
              <div className="bg-gradient-to-r from-brand-orange to-brand-amber h-full" style={{ width: `${(user.total_xp % 1000) / 10}%` }}></div>
            </div>
            <div className="flex justify-between text-[9px] text-zinc-500 font-bold mt-1.5 uppercase">
              <span>{user.total_xp % 1000} XP</span>
              <span>1,000 XP</span>
            </div>
          </div>

          <div className="glass-card p-5 text-left flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Global Rank</span>
              {(() => {
                const rankNum = user?.global_rank;
                const totalRanked = user?.total_users || leaderboard.length || 1;
                const topPct = rankNum && totalRanked > 0 ? Math.ceil((rankNum / totalRanked) * 100) : null;
                return (
                  <>
                    <div className="text-2xl font-black text-white mt-1">{rankNum ? `#${rankNum}` : '—'}</div>
                    {topPct !== null && (
                      <span className="text-[10px] text-brand-orange font-extrabold mt-1 inline-block bg-brand-orange/10 px-2 py-0.5 rounded-md">
                        Top {topPct}%
                      </span>
                    )}
                  </>
                );
              })()}
            </div>
          </div>

          <div className="glass-card p-5 text-left flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Badges</span>
              <div className="flex flex-wrap gap-2 mt-2">
                <span className="w-7 h-7 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-xs shrink-0" title="Active Streak">
                  <Flame className="w-4 h-4 text-brand-orange fill-current" />
                </span>
                <span className="w-7 h-7 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-xs shrink-0" title="Top Performer">
                  <Trophy className="w-4 h-4 text-brand-amber fill-current" />
                </span>
                <span className="w-7 h-7 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-xs shrink-0" title="Quiz Solved">
                  <Sparkles className="w-4 h-4 text-yellow-300" />
                </span>
                <span className="h-7 px-2 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[10px] font-black text-zinc-400 select-none">
                  +12
                </span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Top 3 Podium Preview */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2.5 text-lg font-black text-white">
            <Trophy className="w-5 h-5 text-brand-orange" />
            <span>Leaderboard</span>
          </span>
          <button 
            className="flex items-center gap-1 text-xs font-bold text-brand-orange hover:text-brand-amber cursor-pointer transition-colors" 
            onClick={() => setCurrentPage('leaderboard')}
          >
            <span>View All</span>
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        <div className="glass-card p-6 mb-5">
          <div className="flex items-end justify-center gap-4 sm:gap-6">
            
            {/* 2nd Place */}
            <div className="flex flex-col items-center gap-1.5 order-1" style={{ opacity: second ? 1 : 0.4 }}>
              <div className="relative z-10">
                <div className="rounded-full relative z-10 ring-2 ring-zinc-400/40">
                  <UserAvatar 
                    username={second ? second.username : '—'} 
                    avatarUrl={second ? second.avatar_url : null} 
                    equippedFrame={second ? second.equipped_frame : 'none'} 
                    size={56} 
                  />
                </div>
                <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-zinc-400 text-black flex items-center justify-center shadow-lg z-20">
                  <Medal className="w-3.5 h-3.5" />
                </span>
              </div>
              <span className="text-[11px] font-bold text-white text-center max-w-[68px] truncate leading-tight">
                {second ? second.username : '—'}
              </span>
              <span className="text-[10px] text-zinc-500 font-medium">
                {second ? `${second.xp.toLocaleString()} XP` : '0 XP'}
              </span>
              <div className="w-16 sm:w-20 h-16 rounded-t-xl bg-gradient-to-t from-zinc-400 to-zinc-300 opacity-80 flex items-start justify-center pt-1.5">
                <span className="text-[11px] font-black text-black/70">2</span>
              </div>
            </div>

            {/* 1st Place */}
            <div className="flex flex-col items-center gap-1.5 order-2" style={{ opacity: first ? 1 : 0.4 }}>
              <div className="relative z-10 -top-3">
                <div className="rounded-full relative z-10 ring-2 ring-amber-400/50">
                  <UserAvatar 
                    username={first ? first.username : '—'} 
                    avatarUrl={first ? first.avatar_url : null} 
                    equippedFrame={first ? first.equipped_frame : 'none'} 
                    size={68} 
                  />
                </div>
                <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-amber-500 text-black flex items-center justify-center shadow-lg z-20">
                  <Crown className="w-3.5 h-3.5" />
                </span>
              </div>
              <span className="text-[11px] font-bold text-white text-center max-w-[68px] truncate leading-tight">
                {first ? first.username : '—'}
              </span>
              <span className="text-[10px] text-zinc-500 font-medium">
                {first ? `${first.xp.toLocaleString()} XP` : '0 XP'}
              </span>
              <div className="w-16 sm:w-20 h-24 rounded-t-xl bg-gradient-to-t from-amber-500 to-yellow-400 opacity-80 flex items-start justify-center pt-1.5">
                <span className="text-[11px] font-black text-black/70">1</span>
              </div>
            </div>

            {/* 3rd Place */}
            <div className="flex flex-col items-center gap-1.5 order-3" style={{ opacity: third ? 1 : 0.4 }}>
              <div className="relative z-10">
                <div className="rounded-full relative z-10 ring-2 ring-amber-700/40">
                  <UserAvatar 
                    username={third ? third.username : '—'} 
                    avatarUrl={third ? third.avatar_url : null} 
                    equippedFrame={third ? third.equipped_frame : 'none'} 
                    size={52} 
                  />
                </div>
                <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-amber-700 text-white flex items-center justify-center shadow-lg z-20">
                  <Star className="w-3.5 h-3.5" />
                </span>
              </div>
              <span className="text-[11px] font-bold text-white text-center max-w-[68px] truncate leading-tight">
                {third ? third.username : '—'}
              </span>
              <span className="text-[10px] text-zinc-500 font-medium">
                {third ? `${third.xp.toLocaleString()} XP` : '0 XP'}
              </span>
              <div className="w-16 sm:w-20 h-10 rounded-t-xl bg-gradient-to-t from-amber-700 to-amber-600 opacity-80 flex items-start justify-center pt-1.5">
                <span className="text-[11px] font-black text-black/70">3</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* All Episodes Slider */}
      <section className="space-y-4">
        <div className="flex items-center">
          <span className="flex items-center gap-2.5 text-lg font-black text-white">
            <ListVideo className="w-5 h-5 text-brand-orange" />
            <span>All Episodes</span>
          </span>
        </div>
        
        <div className="flex gap-4 overflow-x-auto pb-4 scroll-smooth snap-x snap-mandatory">
          {(episodes || []).slice(0, 6).map((ep: any) => (
            <div 
              key={ep.id} 
              className="min-w-64 max-w-64 snap-start glass-card p-4 hover:border-brand-orange/30 group flex flex-col gap-3 cursor-pointer"
              onClick={() => navigateToEpisode(ep.id)}
            >
              <div 
                className="w-full aspect-[16/9] rounded-xl bg-zinc-900 bg-cover bg-center relative overflow-hidden flex items-center justify-center border border-zinc-800/40" 
                style={{ backgroundImage: `url(${ep.thumbnail_url || 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?q=80&w=280&auto=format&fit=crop'})` }}
              >
                <div className="absolute inset-0 bg-black/30 bg-radial-gradient" />
                <button 
                  className="w-10 h-10 rounded-full bg-brand-orange text-black flex items-center justify-center hover:scale-110 active:scale-95 cursor-pointer relative z-10 transition-transform shadow-lg shrink-0" 
                  onClick={(e) => { e.stopPropagation(); navigateToEpisode(ep.id); }}
                >
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                </button>
              </div>
              <div className="text-left">
                <h4 className="text-sm font-black text-white truncate">{ep.title_ar}</h4>
                <div className="text-[10px] text-zinc-500 font-extrabold mt-1">Episode {ep.id}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Official News & Announcements Section */}
      <section className="space-y-4">
        <div className="flex flex-row items-center justify-between w-full gap-2">
          <span className="flex items-center gap-2 text-sm sm:text-lg font-black text-white shrink">
            <Sparkles className="w-4 h-4 sm:w-5 h-5 text-brand-orange animate-pulse shrink-0" />
            <span className="truncate">Official News & Announcements</span>
          </span>
          <button 
            onClick={() => setCurrentPage('news')} 
            className="text-[10px] sm:text-xs font-black text-brand-orange hover:text-brand-amber transition-colors flex items-center gap-1 cursor-pointer bg-brand-orange/5 px-2.5 py-1.5 rounded-xl border border-brand-orange/15 hover:border-brand-orange/30 shrink-0 whitespace-nowrap"
          >
            View All
          </button>
        </div>
        
        {newsPosts.length === 0 ? (
          <div className="glass-card p-6 text-center text-zinc-500 text-xs font-bold border border-dashed border-zinc-800">
            No official announcements yet. Stay tuned! 📢
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-4 scroll-smooth snap-x snap-mandatory">
            {newsPosts.slice(0, 3).map((post: any) => (
              <div 
                key={post.id} 
                className="min-w-[280px] max-w-[280px] snap-start glass-card p-4 hover:border-brand-orange/30 group flex flex-col justify-between gap-3 cursor-pointer relative overflow-hidden"
                onClick={() => setCurrentPage('news')}
              >
                {/* Visual Glow */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-brand-orange/5 blur-2xl rounded-full" />
                
                <div className="space-y-2 text-left relative z-10">
                  <div className="flex items-center justify-between text-[9px] font-black text-brand-orange uppercase tracking-wider">
                    <span>LehPhysio Official</span>
                    <span>{new Date(post.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                  </div>
                  <h4 className="text-xs font-extrabold text-white leading-relaxed line-clamp-2">
                    {post.title || post.content.substring(0, 40) + '...'}
                  </h4>
                  <p className="text-[11px] text-zinc-400 font-medium leading-relaxed line-clamp-3">
                    {post.content}
                  </p>
                </div>
                
                {post.image_url && (
                  <div className="w-full aspect-[2/1] rounded-lg overflow-hidden border border-zinc-800/40 relative shrink-0">
                    <img src={post.image_url} alt="News thumbnail" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  </div>
                )}
                
                <div className="flex items-center justify-between border-t border-white/5 pt-2 shrink-0">
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-full overflow-hidden border border-white/10 shrink-0">
                      <img src={post.avatar_url || '/icons/icon-192x192.png'} alt="LehPhysio" className="w-full h-full object-cover" />
                    </div>
                    <span className="text-[10px] font-black text-zinc-300 truncate max-w-[120px]">@{post.username}</span>
                  </div>
                  <span className="text-[10px] font-extrabold text-brand-orange group-hover:translate-x-1 transition-transform">Read Details →</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Community Feed */}
      <section className="space-y-4">
        <div className="flex items-center">
          <span className="flex items-center gap-2.5 text-lg font-black text-white">
            <MessageSquare className="w-5 h-5 text-brand-orange" />
            <span>Community Feed</span>
          </span>
        </div>

        {/* Interactive Poll of the Day */}
        <div className="glass-card p-5 text-left space-y-4 border border-brand-orange/20 relative overflow-hidden">
          <div className="flex gap-2 relative z-10">
            <span className="text-[10px] font-black tracking-wider bg-brand-orange/20 text-brand-orange px-2.5 py-1 rounded-md uppercase">
              Daily Poll
            </span>
          </div>
          <h3 className="text-base font-extrabold text-white leading-relaxed relative z-10">
            What is the nerve supplying the Deltoid muscle?
          </h3>
          <div className="flex flex-col gap-2.5 relative z-10">
            {['Axillary nerve', 'Radial nerve', 'Median nerve', 'Musculocutaneous nerve'].map((option, idx) => {
              const totalV = pollVotes.reduce((a,b) => a+b, 0);
              const pct = totalV > 0 ? Math.round((pollVotes[idx] / totalV) * 100) : 0;
              return (
                <button
                  key={idx}
                  className={`w-full text-left p-3.5 rounded-xl border font-bold text-xs relative overflow-hidden transition-all duration-200 group active:scale-99 ${
                    userVotedOption === idx 
                      ? 'border-brand-orange bg-brand-orange/5 text-brand-orange' 
                      : 'border-zinc-800 hover:border-zinc-700 bg-zinc-900/40 text-zinc-300'
                  } disabled:cursor-default`}
                  onClick={() => handlePollVote(idx)}
                  disabled={hasVotedPoll}
                >
                  <div className="flex justify-between items-center relative z-10">
                    <span>{option}</span>
                    {hasVotedPoll && (
                      <span className="font-extrabold text-xs ml-4">{pct}%</span>
                    )}
                  </div>
                  {hasVotedPoll && (
                    <div 
                      className="absolute inset-y-0 left-0 bg-brand-orange/10 z-0 transition-all duration-500" 
                      style={{ width: `${pct}%` }}
                    />
                  )}
                </button>
              );
            })}
          </div>
          {hasVotedPoll && (
            <p className="text-[10px] text-brand-amber font-extrabold flex items-center gap-1.5 uppercase tracking-wide">
              <Zap className="w-3.5 h-3.5 fill-current animate-fire-pulse" />
              <span>You earned +{xpSettings.poll_vote || 30} XP for participating in the interactive poll!</span>
            </p>
          )}
        </div>

        {/* Post Composer */}
        {user && (
          <form 
            onSubmit={handleSubmitPost} 
            className="glass-card p-5 flex gap-4 items-start text-left border border-zinc-900/60"
          >
            <UserAvatar
              username={user.username}
              avatarUrl={user.avatar_url}
              equippedFrame={user.equipped_frame}
              size={40}
            />
            <div className="flex-1 space-y-3">
              <textarea
                className="w-full bg-zinc-900/60 border border-zinc-800 focus:border-brand-orange focus:ring-1 focus:ring-brand-orange/30 text-white rounded-xl p-3.5 text-xs font-semibold placeholder-zinc-500 outline-none transition-all duration-200 resize-none min-h-[90px]"
                placeholder="What's on your mind today, champ? Share your question or achievement..."
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                maxLength={300}
                rows={3}
              />

              {uploadedImageUrl && (
                <div className="relative rounded-xl overflow-hidden max-w-[200px] border border-zinc-800">
                  <img src={uploadedImageUrl} alt="Upload preview" className="w-full max-h-[140px] object-cover" />
                  <button
                    type="button"
                    onClick={() => setUploadedImageUrl('')}
                    className="absolute top-2 right-2 bg-black/80 hover:bg-black/90 text-white border-none rounded-full w-6 h-6 flex items-center justify-center cursor-pointer transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <div className="flex justify-between items-center pt-2">
                <label className="border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/40 text-zinc-300 font-bold text-[10px] py-2 px-4 rounded-xl cursor-pointer active:scale-95 transition-all flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 shrink-0" />
                  <span>{isUploadingImage ? 'Uploading...' : 'Add Image'}</span>
                  <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" disabled={isUploadingImage} />
                </label>
                
                <button 
                  type="submit" 
                  className="bg-gradient-to-r from-brand-orange to-brand-amber text-black font-extrabold text-xs py-2 px-4 rounded-xl cursor-pointer hover:shadow-orange-intense active:scale-95 transition-all shadow-orange-glow flex items-center gap-1.5 disabled:opacity-50" 
                  disabled={!newPostContent.trim() || isUploadingImage || isPosting}
                >
                  {isPosting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Posting...</span>
                    </>
                  ) : (
                    <>
                      <span>Publish</span>
                      <Send className="w-3 h-3" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Posts feed */}
        <div className="space-y-4">
          {communityPosts.length === 0 ? (
            <p className="text-zinc-500 text-xs md:text-sm font-medium py-12 text-center">No posts available at the moment.</p>
          ) : (
            communityPosts.map((post: any) => (
              <div 
                key={post.id} 
                id={`post-${post.id}`} 
                className="glass-card p-5 text-left border border-zinc-900/60 relative"
              >
                <div className="flex justify-between items-start">
                  <div className="flex gap-3 items-center">
                    <UserAvatar
                      username={post.username}
                      avatarUrl={post.avatar_url}
                      equippedFrame={post.equipped_frame}
                      size={40}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-white">{post.username}</span>
                        <span className="text-[9px] font-bold bg-brand-orange/15 text-brand-orange px-2 py-0.5 rounded-full">
                          {post.batch}
                        </span>
                      </div>
                      <span className="text-[10px] text-zinc-500 font-semibold mt-0.5 block">
                        {stripEmojis(post.rank.name_en)} · {new Date(post.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                  
                  {/* 3-dot post options menu */}
                  {user && (post.user_id === user.id || post.username === user.username || user.role === 'admin' || user.role === 'owner') && (
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenPostMenu(openPostMenu === post.id ? null : post.id);
                        }}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-500 hover:text-white hover:bg-zinc-900/40 cursor-pointer transition-all"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      <AnimatePresence>
                        {openPostMenu === post.id && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -5 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95, y: -5 }}
                            className="absolute right-0 top-9 z-20 bg-zinc-950 border border-zinc-800 rounded-xl p-1.5 flex flex-col gap-1 min-w-[120px] shadow-2xl"
                          >
                            <button
                              onClick={() => {
                                setEditingPostId(post.id);
                                setEditPostContent(post.content);
                                setEditPostImageUrl(post.image_url || '');
                                setOpenPostMenu(null);
                              }}
                              className="w-full flex items-center gap-2 p-2.5 font-bold text-xs text-brand-amber rounded-lg cursor-pointer hover:bg-zinc-900/60 text-left transition-colors"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={() => {
                                handleDeletePost(post.id);
                                setOpenPostMenu(null);
                              }}
                              className="w-full flex items-center gap-2 p-2.5 font-bold text-xs text-red-500 rounded-lg cursor-pointer hover:bg-zinc-900/60 text-left transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete</span>
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </div>

                {editingPostId === post.id ? (
                  <div className="mt-4 space-y-3">
                    <textarea
                      className="w-full bg-zinc-900/60 border border-zinc-800 focus:border-brand-orange focus:ring-1 focus:ring-brand-orange/30 text-white rounded-xl p-3.5 text-xs font-semibold placeholder-zinc-500 outline-none transition-all duration-200 resize-none min-h-[90px]"
                      value={editPostContent}
                      onChange={(e) => {
                        setEditPostContent(e.target.value);
                      }}
                    />

                    {editPostImageUrl && (
                      <div className="relative rounded-xl overflow-hidden max-w-[200px] border border-zinc-800">
                        <img src={editPostImageUrl} alt="Edit preview" className="w-full max-h-[140px] object-cover" />
                        <button
                          type="button"
                          onClick={() => setEditPostImageUrl('')}
                          className="absolute top-2 right-2 bg-black/80 hover:bg-black/90 text-white border-none rounded-full w-6 h-6 flex items-center justify-center cursor-pointer transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    <div className="flex justify-between items-center">
                      <label className="border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/40 text-zinc-300 font-bold text-[10px] py-2 px-4 rounded-xl cursor-pointer active:scale-95 transition-all flex items-center gap-1.5">
                        <ImageIcon className="w-3.5 h-3.5 shrink-0" />
                        <span>{isUploadingEditImage ? 'Uploading...' : 'Change Image'}</span>
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={async (e) => {
                            if (!e.target.files || e.target.files.length === 0) return;
                            setIsUploadingEditImage(true);
                            const url = await handleUploadImage(e.target.files[0]);
                            setIsUploadingEditImage(false);
                            if (url) {
                              setEditPostImageUrl(url);
                            }
                          }} 
                          className="hidden" 
                          disabled={isUploadingEditImage} 
                        />
                      </label>

                      <div className="flex gap-2">
                        <button 
                          className="border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/40 text-zinc-300 font-bold text-[10px] py-2 px-4 rounded-xl cursor-pointer active:scale-95 transition-all" 
                          onClick={() => setEditingPostId(null)}
                        >
                          Cancel
                        </button>
                        <button 
                          className="bg-gradient-to-r from-brand-orange to-brand-amber text-black font-extrabold text-xs py-2 px-4 rounded-xl cursor-pointer hover:shadow-orange-intense active:scale-95 transition-all shadow-orange-glow" 
                          onClick={async () => {
                            if (!editPostContent.trim()) return;
                            await handleEditPost(post.id, editPostContent, editPostImageUrl);
                            setEditingPostId(null);
                          }}
                          disabled={!editPostContent.trim() || isUploadingEditImage}
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    onTouchEnd={() => handleDoubleTapLike(post.id)}
                    className="relative cursor-pointer select-none"
                  >
                    {post.title && (
                      <h3 className="text-sm font-black text-white mt-4 mb-2">
                        {post.title}
                      </h3>
                    )}

                    <p className="text-xs md:text-sm text-zinc-200 font-medium leading-relaxed mt-3 whitespace-pre-wrap">
                      {post.content}
                    </p>

                    {post.image_url && (
                      <div 
                        className="mt-4 rounded-xl overflow-hidden border border-zinc-900 bg-zinc-900/40 max-h-[300px] cursor-pointer relative group"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleImageClickCoord(post.id, post.image_url);
                        }}
                      >
                        <img 
                          src={post.image_url} 
                          alt="Post content" 
                          className="w-full h-full object-contain max-h-[300px] group-hover:scale-[1.01] transition-transform duration-300" 
                        />

                      </div>
                    )}

                    {/* Floating Heart Burst overlay */}
                    <AnimatePresence>
                      {floatingHearts.filter(h => h.postId === post.id).map(h => (
                        <motion.div 
                          key={h.id} 
                          initial={{ opacity: 0, scale: 0.3, y: 30 }}
                          animate={{ opacity: [0, 1, 1, 0], scale: [0.3, 1.4, 1.2, 0.9], y: -80 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.7, ease: "easeOut" }}
                          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-red-500 pointer-events-none z-30 filter drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]"
                        >
                          <Heart className="w-16 h-16 fill-current" />
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}

                {/* Actions row */}
                <div className="flex gap-6 mt-4 pt-3.5 border-t border-zinc-900/60">
                  <button 
                    className={`flex items-center gap-1.5 text-xs font-bold transition-colors cursor-pointer ${post.isLiked ? 'text-brand-orange' : 'text-zinc-500 hover:text-zinc-300'}`} 
                    onClick={() => handleLikePost(post.id)}
                  >
                    <Heart className={`w-4 h-4 ${post.isLiked ? 'fill-current' : ''}`} /> 
                    <span>{post.likes_count}</span>
                  </button>
                  <button 
                    className="flex items-center gap-1.5 text-xs font-bold text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer" 
                    onClick={() => toggleComments(post.id)}
                  >
                    <MessageCircle className="w-4 h-4" /> 
                    <span>{post.comments_count || 0}</span>
                  </button>
                  <button 
                    className="flex items-center gap-1.5 text-xs font-bold text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer" 
                    onClick={() => handleSharePost(post.id)}
                  >
                    <Share2 className="w-4 h-4" /> 
                    <span>{post.shares_count || 0}</span>
                  </button>
                </div>

                {/* Expandable comments thread list */}
                <AnimatePresence>
                  {expandedComments[post.id] !== undefined && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 pt-4 border-t border-zinc-900/60 flex flex-col gap-3.5 overflow-hidden text-left"
                    >
                      {commentsLoading[post.id] ? (
                        <div className="flex items-center justify-center py-4 text-xs text-zinc-500 gap-1.5">
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-orange" />
                          <span>Loading comments...</span>
                        </div>
                      ) : (
                        <>
                          {expandedComments[post.id].length === 0 ? (
                            <p className="text-zinc-500 text-[11px] font-medium py-3 text-center">No comments yet. Be the first to comment!</p>
                          ) : (
                            expandedComments[post.id].map((c: any) => (
                              <div 
                                key={c.id} 
                                className="bg-zinc-900/30 rounded-xl p-3.5 border border-zinc-900/40 relative group/comment"
                                onContextMenu={(e) => {
                                  if (user && (c.user_id === user.id || user.role === 'admin' || user.role === 'owner')) {
                                    e.preventDefault();
                                    setContextMenu({ x: e.clientX, y: e.clientY, commentId: c.id, content: c.content, postId: post.id });
                                  }
                                }}
                              >
                                <div className="flex gap-3 items-start">
                                  <UserAvatar username={c.username} avatarUrl={c.avatar_url} equippedFrame={c.equipped_frame} size={28} />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-center mb-1">
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-xs font-extrabold text-brand-orange">@{c.username}</span>
                                        <span className="text-[8px] font-bold bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded-md">{c.batch}</span>
                                      </div>
                                      
                                      <div className="flex items-center gap-3">
                                        <span className="text-[9px] text-zinc-500 font-semibold">
                                          {new Date(c.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                                        </span>
                                        {user && (c.user_id === user.id || user.role === 'admin' || user.role === 'owner') && (
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setContextMenu({ x: e.clientX, y: e.clientY, commentId: c.id, content: c.content, postId: post.id });
                                            }}
                                            className="text-zinc-500 hover:text-white cursor-pointer opacity-0 group-hover/comment:opacity-100 transition-opacity"
                                            title="More Options"
                                          >
                                            <MoreVertical className="w-3.5 h-3.5" />
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                    
                                    {editingCommentId === c.id ? (
                                      <div className="my-2 flex flex-col gap-2">
                                        <textarea
                                          className="w-full bg-zinc-950 border border-zinc-800 focus:border-brand-orange text-white rounded-lg p-2 text-xs outline-none resize-none"
                                          value={editCommentText}
                                          onChange={(e) => setEditCommentText(e.target.value)}
                                          rows={2}
                                          autoFocus
                                        />
                                        <div className="flex justify-end gap-1.5">
                                          <button className="border border-zinc-800 hover:bg-zinc-900 text-white font-bold text-[9px] py-1.5 px-3 rounded-lg cursor-pointer transition-all" onClick={() => setEditingCommentId(null)}>Cancel</button>
                                          <button className="bg-brand-orange text-black font-extrabold text-[9px] py-1.5 px-3 rounded-lg cursor-pointer transition-all shadow-md" onClick={() => handleEditCommunityComment(c.id, editCommentText)}>Save</button>
                                        </div>
                                      </div>
                                    ) : (
                                      <p className="text-xs text-zinc-200 font-medium leading-relaxed mb-2 pr-1">{renderTextWithMentions(c.content)}</p>
                                    )}

                                    <div className="flex gap-4 items-center">
                                      <button 
                                        className={`flex items-center gap-1 text-[10px] font-bold cursor-pointer transition-colors ${c.has_liked ? 'text-brand-orange' : 'text-zinc-500 hover:text-zinc-300'}`}
                                        onClick={() => handleCommentLike(post.id, c.id)}
                                      >
                                        <Heart className={`w-3 h-3 ${c.has_liked ? 'fill-current' : ''}`} /> 
                                        <span>{c.likes_count}</span>
                                      </button>
                                      <button 
                                        className="flex items-center gap-1 text-[10px] font-bold text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer" 
                                        onClick={() => {
                                          setReplyingToComment(prev => ({ ...prev, [post.id]: c }));
                                          document.getElementById(`comment-input-${post.id}`)?.focus();
                                        }}
                                      >
                                        <CornerUpLeft className="w-3 h-3" /> 
                                        <span>Reply</span>
                                      </button>
                                    </div>
                                  </div>
                                </div>

                                {/* Nested replies */}
                                {c.replies && c.replies.length > 0 && (
                                  <div className="border-l-2 border-zinc-800/80 pl-3 ml-3 mt-3.5 space-y-3.5 text-left">
                                    {c.replies.map((r: any) => (
                                      <div key={r.id} className="flex gap-2.5 items-start group/reply relative">
                                        <UserAvatar username={r.username} avatarUrl={r.avatar_url} equippedFrame={r.equipped_frame} size={22} />
                                        <div className="flex-1 min-w-0">
                                          <div className="flex justify-between items-center mb-0.5">
                                            <span className="text-[11px] font-bold text-zinc-400">@{r.username}</span>
                                            <div className="flex items-center gap-2">
                                              <span className="text-[8px] text-zinc-600 font-semibold">
                                                {new Date(r.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                                              </span>
                                              {user && (r.user_id === user.id || user.role === 'admin' || user.role === 'owner') && (
                                                <button
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    setContextMenu({ x: e.clientX, y: e.clientY, commentId: r.id, content: r.content, postId: post.id, parentId: c.id });
                                                  }}
                                                  className="text-zinc-600 hover:text-white cursor-pointer opacity-0 group-hover/reply:opacity-100 transition-opacity"
                                                  title="More"
                                                >
                                                  <MoreVertical className="w-3 h-3" />
                                                </button>
                                              )}
                                            </div>
                                          </div>

                                          {editingCommentId === r.id ? (
                                            <div className="my-1.5 flex flex-col gap-1.5">
                                              <textarea
                                                className="w-full bg-zinc-950 border border-zinc-800 focus:border-brand-orange text-white rounded-lg p-2 text-[11px] outline-none resize-none"
                                                value={editCommentText}
                                                onChange={(e) => setEditCommentText(e.target.value)}
                                                rows={2}
                                                autoFocus
                                              />
                                              <div className="flex justify-end gap-1.5">
                                                <button className="border border-zinc-800 text-white text-[8px] py-1 px-2.5 rounded-md cursor-pointer" onClick={() => setEditingCommentId(null)}>Cancel</button>
                                                <button className="bg-brand-orange text-black font-extrabold text-[8px] py-1 px-2.5 rounded-md cursor-pointer" onClick={() => handleEditCommunityComment(r.id, editCommentText)}>Save</button>
                                              </div>
                                            </div>
                                          ) : (
                                            <p className="text-xs text-zinc-300 font-medium leading-relaxed pr-1 mt-0.5">{renderTextWithMentions(r.content)}</p>
                                          )}

                                          <div className="flex gap-2 items-center mt-1">
                                            <button 
                                              className={`flex items-center gap-1 text-[9px] font-bold cursor-pointer transition-colors ${r.has_liked ? 'text-brand-orange' : 'text-zinc-500 hover:text-zinc-300'}`}
                                              onClick={() => handleCommentLike(post.id, r.id)}
                                            >
                                              <Heart className={`w-2.5 h-2.5 ${r.has_liked ? 'fill-current' : ''}`} /> 
                                              <span>{r.likes_count}</span>
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))
                          )}
                          
                          {/* Comment composer form */}
                          {user ? (
                            <div className="relative mt-2 border-t border-zinc-900/40 pt-3">
                              {replyingToComment[post.id] && (
                                <div className="flex items-center justify-between bg-brand-orange/5 border-l-2 border-brand-orange rounded-xl px-3 py-2 mb-3 text-xs font-bold text-brand-orange">
                                  <div className="flex items-center gap-1.5">
                                    <CornerUpLeft className="w-3.5 h-3.5 shrink-0" />
                                    <span>Replying to <strong>@{replyingToComment[post.id].username}</strong></span>
                                  </div>
                                  <button 
                                    onClick={() => setReplyingToComment(prev => ({ ...prev, [post.id]: null }))}
                                    className="text-zinc-500 hover:text-white cursor-pointer"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              )}
                              
                              {/* Mention suggestions */}
                              {commentMentionSearch[post.id] && usernames && usernames.length > 0 && (
                                <div className="absolute bottom-[calc(100%+8px)] left-0 right-0 max-h-[120px] overflow-y-auto z-10 bg-zinc-950 border border-zinc-800 rounded-xl p-1 shadow-2xl backdrop-blur-md">
                                  {usernames
                                    .filter((u: any) => u.username.toLowerCase().startsWith(commentMentionSearch[post.id]!.toLowerCase()) && u.username !== user.username)
                                    .map((u: any) => (
                                      <div
                                        key={u.username}
                                        onClick={() => handleSelectCommentMention(post.id, u.username)}
                                        className="flex items-center gap-2 p-2 hover:bg-brand-orange/10 cursor-pointer rounded-lg text-left text-xs font-bold text-white transition-colors"
                                      >
                                        <UserAvatar username={u.username} avatarUrl={u.avatar_url} equippedFrame={u.equipped_frame} size={20} />
                                        <span>@{u.username}</span>
                                      </div>
                                    ))}
                                </div>
                              )}

                              <div className="flex gap-2.5 items-end">
                                <textarea
                                  id={`comment-input-${post.id}`}
                                  className="w-full bg-zinc-900/60 border border-zinc-800 focus:border-brand-orange focus:ring-1 focus:ring-brand-orange/30 text-white rounded-xl px-3 py-2 text-xs font-semibold placeholder-zinc-500 outline-none transition-all duration-200 resize-none min-h-[34px] maxHeight-[120px]"
                                  placeholder={replyingToComment[post.id] ? `Reply to @${replyingToComment[post.id].username}...` : "Write a comment..."}
                                  value={newCommentTexts[post.id] || ''}
                                  onChange={(e) => {
                                    handleCommentInputChange(post.id, e.target.value);
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                      e.preventDefault();
                                      if (newCommentTexts[post.id]?.trim()) {
                                        submitComment(post.id, replyingToComment[post.id]?.id);
                                      }
                                    }
                                  }}
                                  rows={1}
                                />
                                <button 
                                  className="bg-gradient-to-r from-brand-orange to-brand-amber text-black font-extrabold text-[10px] h-[34px] px-4 rounded-xl cursor-pointer hover:opacity-90 active:scale-95 transition-all shadow-md shrink-0 flex items-center justify-center disabled:opacity-50"
                                  onClick={() => {
                                    submitComment(post.id, replyingToComment[post.id]?.id);
                                  }}
                                  disabled={!newCommentTexts[post.id]?.trim() || commentSubmitting[post.id]}
                                >
                                  {commentSubmitting[post.id] ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    replyingToComment[post.id] ? 'Reply' : 'Post'
                                  )}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="text-zinc-500 text-[10px] font-bold text-center py-2 uppercase tracking-wide">
                              Please login to post.
                            </div>
                          )}
                        </>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Context Menu for comments */}
      <AnimatePresence>
        {contextMenu && (
          <div className="fixed inset-0 z-[999]" onClick={() => setContextMenu(null)}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              style={{
                position: 'fixed',
                top: contextMenu.y,
                left: contextMenu.x,
              }}
              className="bg-zinc-950 border border-zinc-800 rounded-xl p-1 flex flex-col gap-0.5 min-w-[130px] shadow-2xl z-[1000]"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => {
                  setEditingCommentId(contextMenu.commentId);
                  setEditCommentText(contextMenu.content);
                  setContextMenu(null);
                }}
                className="w-full flex items-center gap-2 p-2.5 font-bold text-xs text-white rounded-lg cursor-pointer hover:bg-zinc-900/60 text-left transition-colors"
              >
                <Edit2 className="w-3.5 h-3.5 text-zinc-500" />
                <span>Edit Post</span>
              </button>
              <button
                onClick={() => {
                  deleteComment(contextMenu.postId, contextMenu.commentId, !!contextMenu.parentId, contextMenu.parentId);
                  setContextMenu(null);
                }}
                className="w-full flex items-center gap-2 p-2.5 font-bold text-xs text-red-500 rounded-lg cursor-pointer hover:bg-zinc-900/60 text-left transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-500" />
                <span>Delete Post</span>
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Bottom inline edit form overlay */}
      <AnimatePresence>
        {editingCommentId && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-0 left-0 right-0 bg-zinc-950 border-t border-zinc-850 p-4 z-[9000] shadow-2xl backdrop-blur-md flex gap-2.5 items-end"
          >
            <textarea
              className="flex-1 bg-zinc-900 border border-zinc-800 focus:border-brand-orange text-white rounded-xl p-3 text-xs outline-none resize-none"
              value={editCommentText}
              onChange={(e) => setEditCommentText(e.target.value)}
              rows={2}
              autoFocus
            />
            <button 
              className="border border-zinc-800 hover:bg-zinc-900 text-zinc-300 font-bold text-xs py-2.5 px-4 rounded-xl cursor-pointer active:scale-95 transition-all" 
              onClick={() => { setEditingCommentId(null); setEditCommentText(''); }}
            >
              Cancel
            </button>
            <button
              className="bg-gradient-to-r from-brand-orange to-brand-amber text-black font-extrabold text-xs py-2.5 px-4 rounded-xl cursor-pointer hover:opacity-90 active:scale-95 transition-all shadow-orange-glow"
              onClick={() => handleEditCommunityComment(editingCommentId, editCommentText)}
              disabled={!editCommentText.trim()}
            >
              Save
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Immersive Lightbox Modal */}
      <AnimatePresence>
        {activeLightboxImg && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActiveLightboxImg(null)}
            className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[99999] flex items-center justify-center p-4 cursor-zoom-out"
          >
            {/* Close button */}
            <button
              onClick={() => setActiveLightboxImg(null)}
              className="absolute top-6 right-6 w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 text-white flex items-center justify-center cursor-pointer transition-all hover:scale-105 hover:bg-zinc-800 active:scale-95 z-[999999]"
            >
              <X className="w-5 h-5" />
            </button>

            <motion.img
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              src={activeLightboxImg}
              alt="Expanded preview"
              className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl border border-zinc-800/40"
              onClick={(e) => e.stopPropagation()} // Stop closing on image click
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
