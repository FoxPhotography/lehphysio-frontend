import React from 'react';
import { UserAvatar } from '../components/UserAvatar';

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
  triggerXpPopup: (amount: number) => void;
}

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
  leaderboard,
  equippedFrame,
  episodes,
  triggerXpPopup
}) => {
  const activeStreak = user?.streak_count || 12;
  const first = leaderboard[0];
  const second = leaderboard[1];
  const third = leaderboard[2];

  // Composer fields
  const [uploadedImageUrl, setUploadedImageUrl] = React.useState('');
  const [isUploadingImage, setIsUploadingImage] = React.useState(false);
  const [isPosting, setIsPosting] = React.useState(false);

  // Post editing states
  const [editingPostId, setEditingPostId] = React.useState<number | null>(null);
  const [editPostContent, setEditPostContent] = React.useState('');
  const [editPostImageUrl, setEditPostImageUrl] = React.useState('');
  const [isUploadingEditImage, setIsUploadingEditImage] = React.useState(false);

  // 3-dot post menu
  const [openPostMenu, setOpenPostMenu] = React.useState<number | null>(null);

  // Expandable Comments panel states
  const [expandedComments, setExpandedComments] = React.useState<{[key: number]: any[]}>({});
  const [commentsLoading, setCommentsLoading] = React.useState<{[key: number]: boolean}>({});
  const [newCommentTexts, setNewCommentTexts] = React.useState<{[key: number]: string}>({});
  const [commentMentionSearch, setCommentMentionSearch] = React.useState<{[key: number]: string | null}>({});
  const [replyingToComment, setReplyingToComment] = React.useState<{[key: number]: any | null}>({});
  const [commentSubmitting, setCommentSubmitting] = React.useState<{[key: number]: boolean}>({});
  const [contextMenu, setContextMenu] = React.useState<{ x: number; y: number; commentId: number; content: string; postId: number; parentId?: number } | null>(null);
  const [editingCommentId, setEditingCommentId] = React.useState<number | null>(null);
  const [editCommentText, setEditCommentText] = React.useState('');

  React.useEffect(() => {
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
    return undefined;
  }, [contextMenu]);

  // Double-tap to like
  const lastTapRef = React.useRef<{postId: number; time: number} | null>(null);
  const [floatingHearts, setFloatingHearts] = React.useState<{id: number; postId: number}[]>([]);
  let heartIdCounter = React.useRef(0);

  const handleDoubleTapLike = (postId: number) => {
    const now = Date.now();
    if (lastTapRef.current && lastTapRef.current.postId === postId && now - lastTapRef.current.time < 300) {
      lastTapRef.current = null;
      handleLikePost(postId);
      // Spawn floating heart
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
          // Add reply under its parent comment
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
      }
    } catch (e) {
      console.error(e);
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

    // Optimistic update
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
        // Revert on error
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
      // Revert on error
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
        // Refresh comments for all posts to reflect the edit
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
          <span key={idx} className="mention-tag" style={{ color: 'var(--orange)', fontWeight: 800 }}>
            {part}
          </span>
        );
      }
      return part;
    });
  };

  return (
    <div className="home-panel animate-fade-in">
      {/* Banner alerts */}
      {loginReward && loginReward.daily_login && (
        <div className="pl-banner">
          <i className="ti ti-gift"></i>
          <span>Welcome back! You earned <strong>+10 XP</strong> for your daily login.</span>
        </div>
      )}

      {/* Hero podcast card - latest episode */}
      <section className="home-hero-card glass-card">
        {(() => {
          const latestEp = episodes.length > 0 ? episodes[episodes.length - 1] : null;
          return latestEp ? (
            <>
              <div className="hero-thumbnail" style={{ backgroundImage: `url(${latestEp.thumbnail_url || 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?q=80&w=600&auto=format&fit=crop'})` }}>
                <div className="hero-thumbnail-overlay"></div>
                <i className="ti ti-microphone hero-mic-glow"></i>
              </div>
              <div className="hero-info-section">
                <div className="hero-badge-row">
                  <span className="badge-tag">NEW EPISODE</span>
                  <span className="badge-tag" style={{ background: 'rgba(255,255,255,0.06)', color: '#fff' }}>EP.{latestEp.id}</span>
                </div>
                <h2 className="hero-title">{latestEp.title_ar || 'New Episode'}</h2>
                <p className="hero-desc">{latestEp.description || ''}</p>
                <div className="hero-actions-row">
                  <button className="btn-primary" onClick={() => navigateToEpisode(latestEp.id)}>
                    <i className="ti ti-player-play"></i> Watch Now
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="hero-thumbnail" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1590602847861-f357a9332bbc?q=80&w=600&auto=format&fit=crop')` }}>
                <div className="hero-thumbnail-overlay"></div>
                <i className="ti ti-microphone hero-mic-glow"></i>
              </div>
              <div className="hero-info-section">
                <div className="hero-badge-row">
                  <span className="badge-tag">PODCAST</span>
                </div>
                <h2 className="hero-title">Leh Physio?</h2>
                <p className="hero-desc">Listen. Learn. Elevate your level.</p>
                <div className="hero-actions-row">
                  <button className="btn-primary" onClick={() => setCurrentPage('episodes')}>
                    <i className="ti ti-player-play"></i> Browse Episodes
                  </button>
                </div>
              </div>
            </>
          );
        })()}
      </section>

      {/* Streak & Streak Panel */}
      <section className="streak-row-wrapper">
        <div className="streak-welcome-text">
          <h1>Leh Physio? 🔥</h1>
          <p>Listen. Learn. Elevate your level.</p>
        </div>
        <button className="streak-badge" onClick={() => setCurrentPage('profile')}>
          <i className="ti ti-flame" style={{ fontSize: '20px', animation: 'firePulse 1s ease-in-out infinite alternate', filter: 'drop-shadow(0 0 6px rgba(255,106,0,0.8))' }}></i>
          <span>{activeStreak} Day Streak</span>
          <i className="ti ti-chevron-left" style={{ fontSize: '12px', marginRight: '4px' }}></i>
        </button>
      </section>

      {/* Quick XP actions grid */}
      <section className="quick-actions-row">
        <div className="quick-action-card" onClick={() => setCurrentPage('episodes')}>
          <div className="quick-action-icon"><i className="ti ti-player-play"></i></div>
          <span className="quick-action-name">Watch</span>
          <span className="quick-action-xp">+50 XP</span>
        </div>
        <div className="quick-action-card" onClick={() => setCurrentPage('rewards')}>
          <div className="quick-action-icon"><i className="ti ti-key"></i></div>
          <span className="quick-action-name">Enter Code</span>
          <span className="quick-action-xp">+100 XP</span>
        </div>
        <div className="quick-action-card" onClick={() => { setCurrentPage('community'); setCommunityTab('chat'); }}>
          <div className="quick-action-icon"><i className="ti ti-messages"></i></div>
          <span className="quick-action-name">Comment</span>
          <span className="quick-action-xp">+20 XP</span>
        </div>
        <div className="quick-action-card" onClick={() => setCurrentPage('games')}>
          <div className="quick-action-icon"><i className="ti ti-device-gamepad-2"></i></div>
          <span className="quick-action-name">Challenges</span>
          <span className="quick-action-xp">+30 XP</span>
        </div>
        <div className="quick-action-card" onClick={() => setCurrentPage('rewards')}>
          <div className="quick-action-icon"><i className="ti ti-building-store"></i></div>
          <span className="quick-action-name">Rewards Shop</span>
          <span className="quick-action-xp">Shop</span>
        </div>
      </section>

      {/* Stats Grid */}
      {user && (
        <section className="stats-badge-grid">
          <div className="stat-badge-card glass-card">
            <span className="stat-badge-label">Total XP</span>
            <div className="stat-badge-value">{user.total_xp.toLocaleString()}</div>
            {/* Sparkline decoration */}
            <svg className="stat-sparkline" viewBox="0 0 100 20">
              <path d="M0,15 L10,12 L20,18 L30,10 L40,14 L50,8 L60,11 L70,5 L80,12 L90,6 L100,2" />
            </svg>
          </div>
          <div className="stat-badge-card glass-card">
            <span className="stat-badge-label">Level</span>
            <div className="stat-badge-value">{Math.floor(user.total_xp / 1000) + 1}</div>
            <div className="stat-badge-progress-bar">
              <div className="stat-badge-progress-fill" style={{ width: `${(user.total_xp % 1000) / 10}%` }}></div>
            </div>
            <span style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              {(user.total_xp % 1000)} / 1,000 to next
            </span>
          </div>
          <div className="stat-badge-card glass-card">
            <span className="stat-badge-label">Global Rank</span>
            {(() => {
              const rankNum = user?.global_rank;
              const totalRanked = user?.total_users || leaderboard.length || 1;
              const topPct = rankNum && totalRanked > 0 ? Math.ceil((rankNum / totalRanked) * 100) : null;
              return (
                <>
                  <div className="stat-badge-value">{rankNum ? `#${rankNum}` : '—'}</div>
                  {topPct !== null && (
                    <span style={{ fontSize: '11px', color: 'var(--orange)', fontWeight: 800 }}>
                      Top {topPct}%
                    </span>
                  )}
                  {!rankNum && (
                    <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>Not ranked yet</span>
                  )}
                </>
              );
            })()}
          </div>
          <div className="stat-badge-card glass-card">
            <span className="stat-badge-label">Badges</span>
            <div className="badges-row">
              <span className="mini-badge" title="Active Streak">🔥</span>
              <span className="mini-badge" title="Rehab Legend">👑</span>
              <span className="mini-badge" title="Anatomy Champ">🧠</span>
              <span className="mini-badge mini-badge-more">+12</span>
            </div>
          </div>
        </section>
      )}

      {/* Top 3 Podium Preview */}
      <section className="leaderboard-podium-preview" style={{ marginBottom: '2.5rem' }}>
        <div className="pl-section-h2">
          <span className="title-text"><i className="ti ti-trophy"></i> Leaderboard</span>
          <button className="title-link" onClick={() => setCurrentPage('leaderboard')}>
            View All <i className="ti ti-chevron-left"></i>
          </button>
        </div>
        <div className="leaderboard-podium glass-card">
          {/* 2nd Place */}
          <div className="podium-column" style={{ opacity: second ? 1 : 0.4 }}>
            <div className="podium-avatar-container">
              <UserAvatar 
                username={second ? second.username : '—'} 
                avatarUrl={second ? second.avatar_url : null} 
                equippedFrame={second ? second.equipped_frame : 'none'} 
                size={54} 
              />
              <span className="podium-rank-badge">2</span>
            </div>
            <span className="podium-username">{second ? second.username : '—'}</span>
            <span className="podium-xp">{second ? `${second.xp} XP` : '0 XP'}</span>
            <div className="podium-bar second">2</div>
          </div>
          {/* 1st Place */}
          <div className="podium-column" style={{ opacity: first ? 1 : 0.4 }}>
            <div className="podium-avatar-container">
              <UserAvatar 
                username={first ? first.username : '—'} 
                avatarUrl={first ? first.avatar_url : null} 
                equippedFrame={first ? first.equipped_frame : 'none'} 
                size={64} 
              />
              <span className="podium-rank-badge">1</span>
            </div>
            <span className="podium-username">{first ? first.username : '—'}</span>
            <span className="podium-xp">{first ? `${first.xp} XP` : '0 XP'}</span>
            <div className="podium-bar first">1</div>
          </div>
          {/* 3rd Place */}
          <div className="podium-column" style={{ opacity: third ? 1 : 0.4 }}>
            <div className="podium-avatar-container">
              <UserAvatar 
                username={third ? third.username : '—'} 
                avatarUrl={third ? third.avatar_url : null} 
                equippedFrame={third ? third.equipped_frame : 'none'} 
                size={50} 
              />
              <span className="podium-rank-badge">3</span>
            </div>
            <span className="podium-username">{third ? third.username : '—'}</span>
            <span className="podium-xp">{third ? `${third.xp} XP` : '0 XP'}</span>
            <div className="podium-bar third">3</div>
          </div>
        </div>
      </section>

      {/* Continue Listening row */}
      <section className="continue-listening-section">
        <div className="pl-section-h2">
          <span className="title-text"><i className="ti ti-playlist"></i> Continue Listening</span>
          <button className="title-link" onClick={() => setCurrentPage('episodes')}>
            View All <i className="ti ti-chevron-left"></i>
          </button>
        </div>
        <div className="horizontal-slider">
          <div className="continue-card glass-card">
            <div className="continue-thumb" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1576091160550-2173dba999ef?q=80&w=280&auto=format&fit=crop')` }}>
              <button className="continue-play-btn" onClick={() => navigateToEpisode(1)}>
                <i className="ti ti-player-play"></i>
              </button>
            </div>
            <div className="continue-info">
              <h4 className="continue-title">SPASM</h4>
              <div className="continue-episode-num">Episode 23</div>
              <div className="continue-progress-container">
                <div className="progress-track"><div className="progress-fill" style={{ width: '62%' }}></div></div>
                <span>62%</span>
              </div>
            </div>
          </div>
          <div className="continue-card glass-card">
            <div className="continue-thumb" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=280&auto=format&fit=crop')` }}>
              <button className="continue-play-btn" onClick={() => navigateToEpisode(2)}>
                <i className="ti ti-player-play"></i>
              </button>
            </div>
            <div className="continue-info">
              <h4 className="continue-title">PAIN Mechanics</h4>
              <div className="continue-episode-num">Episode 22</div>
              <div className="continue-progress-container">
                <div className="progress-track"><div className="progress-fill" style={{ width: '40%' }}></div></div>
                <span>40%</span>
              </div>
            </div>
          </div>
          <div className="continue-card glass-card">
            <div className="continue-thumb" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=280&auto=format&fit=crop')` }}>
              <button className="continue-play-btn" onClick={() => navigateToEpisode(3)}>
                <i className="ti ti-player-play"></i>
              </button>
            </div>
            <div className="continue-info">
              <h4 className="continue-title">GAIT & Biomechanics</h4>
              <div className="continue-episode-num">Episode 21</div>
              <div className="continue-progress-container">
                <div className="progress-track"><div className="progress-fill" style={{ width: '75%' }}></div></div>
                <span>75%</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Community Feed */}
      <section className="community-preview-section">
        <div className="pl-section-h2" style={{ marginBottom: '1.5rem' }}>
          <span className="title-text"><i className="ti ti-news"></i> Leh Physio? Community Feed</span>
        </div>

        {/* Poll of the Day */}
        <div className="daily-poll-card" style={{ marginBottom: '1.5rem' }}>
          <h3 className="poll-question">📊 Interactive Medical Question of the Day: What is the nerve supplying the Deltoid muscle?</h3>
          <div className="poll-options-list">
            {['Axillary nerve', 'Radial nerve', 'Median nerve', 'Musculocutaneous nerve'].map((option, idx) => {
              const totalV = pollVotes.reduce((a,b) => a+b, 0);
              const pct = totalV > 0 ? Math.round((pollVotes[idx] / totalV) * 100) : 0;
              return (
                <button
                  key={idx}
                  className={`poll-option-btn ${userVotedOption === idx ? 'selected' : ''}`}
                  onClick={() => handlePollVote(idx)}
                  disabled={hasVotedPoll}
                >
                  <span>{option}</span>
                  {hasVotedPoll && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="poll-option-percentage">{pct}%</span>
                      <div className="poll-option-fill" style={{ width: `${pct}%` }}></div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
          {hasVotedPoll && (
            <p style={{ fontSize: '11px', color: 'var(--amber)', marginTop: '0.75rem', fontWeight: 800 }}>
              You earned +30 XP for participating in the interactive poll! ⚡
            </p>
          )}
        </div>

        {/* Post Composer */}
        {user && (
          <form onSubmit={handleSubmitPost} className="community-composer-card" style={{ marginBottom: '1.5rem', background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--card-border)' }}>
            <div className="composer-row" style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
              <UserAvatar
                username={user.username}
                avatarUrl={user.avatar_url}
                equippedFrame={user.equipped_frame}
                size={38}
              />
              <div className="composer-main" style={{ flex: 1 }}>
                <textarea
                  className="composer-textarea"
                  placeholder="What's on your mind today, champ? Share your question or achievement..."
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  maxLength={300}
                  rows={3}
                  style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#fff', padding: '10px', fontSize: '13px', fontFamily: 'inherit', resize: 'none' }}
                ></textarea>

                {uploadedImageUrl && (
                  <div style={{ position: 'relative', marginTop: '0.75rem', borderRadius: '8px', overflow: 'hidden', maxWidth: '240px', border: '1px solid var(--card-border)' }}>
                    <img src={uploadedImageUrl} alt="Upload preview" style={{ width: '100%', maxHeight: '160px', objectFit: 'cover' }} />
                    <button
                      type="button"
                      onClick={() => setUploadedImageUrl('')}
                      style={{
                        position: 'absolute',
                        top: '4px',
                        right: '4px',
                        background: 'rgba(0,0,0,0.8)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '50%',
                        width: '24px',
                        height: '24px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'background 0.2s'
                      }}
                    >
                      <i className="ti ti-x" style={{ fontSize: '12px' }}></i>
                    </button>
                  </div>
                )}

                <div className="composer-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem' }}>
                  <label className="btn-outline mini" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', margin: 0, padding: '4px 10px', fontSize: '11px' }}>
                    <i className="ti ti-photo" style={{ fontSize: '14px' }}></i>
                    <span>{isUploadingImage ? 'Uploading...' : 'Add Image'}</span>
                    <input type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} disabled={isUploadingImage} />
                  </label>
                  <button type="submit" className="btn-primary mini" disabled={!newPostContent.trim() || isUploadingImage || isPosting}>
                    {isPosting ? (
                      <><i className="ti ti-loader" style={{ animation: 'spin 1s linear infinite' }}></i> Posting...</>
                    ) : (
                      <>Publish Post <i className="ti ti-send"></i></>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </form>
        )}

        {/* Posts feed */}
        <div className="leaderboard-list-container">
          {communityPosts.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem 0' }}>No posts available at the moment.</p>
          ) : (
            communityPosts.map((post: any) => (
              <div key={post.id} className="community-feed-item glass-card" style={{ marginBottom: '1.25rem', padding: '1.25rem', position: 'relative' }}>
                <div className="feed-item-header">
                  <div className="feed-user-block" style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flex: 1 }}>
                    <UserAvatar
                      username={post.username}
                      avatarUrl={post.avatar_url}
                      equippedFrame={post.equipped_frame}
                      size={38}
                    />
                    <div className="feed-user-details">
                      <div className="feed-username-row" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span className="feed-username" style={{ fontWeight: 800, color: '#fff' }}>{post.username}</span>
                        <span className="feed-badge-role" style={{ fontSize: '9px', background: 'rgba(255, 106, 0, 0.1)', color: 'var(--orange)', padding: '1px 6px', borderRadius: '4px' }}>{post.batch}</span>
                      </div>
                      <span className="feed-user-meta" style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                        {post.rank.emoji} {post.rank.name_en} · {new Date(post.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                  {/* 3-dot menu */}
                  {user && (post.user_id === user.id || user.role === 'admin' || user.role === 'owner') && (
                    <div style={{ position: 'relative' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenPostMenu(openPostMenu === post.id ? null : post.id);
                        }}
                        style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px', fontSize: '18px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <i className="ti ti-dots-vertical"></i>
                      </button>
                      {openPostMenu === post.id && (
                        <div
                          style={{
                            position: 'absolute',
                            top: '100%',
                            right: 0,
                            zIndex: 100,
                            background: '#1a1a1a',
                            border: '1px solid var(--card-border)',
                            borderRadius: '10px',
                            padding: '4px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '2px',
                            minWidth: '120px',
                            boxShadow: '0 4px 16px rgba(0,0,0,0.4)'
                          }}
                        >
                          <button
                            onClick={() => {
                              setEditingPostId(post.id);
                              setEditPostContent(post.content);
                              setEditPostImageUrl(post.image_url || '');
                              setOpenPostMenu(null);
                            }}
                            style={{ background: 'transparent', border: 'none', color: 'var(--amber)', cursor: 'pointer', padding: '8px 12px', fontSize: '12px', textAlign: 'left', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}
                          >
                            <i className="ti ti-edit"></i> Edit
                          </button>
                          <button
                            onClick={() => {
                              handleDeletePost(post.id);
                              setOpenPostMenu(null);
                            }}
                            style={{ background: 'transparent', border: 'none', color: '#ff4d4d', cursor: 'pointer', padding: '8px 12px', fontSize: '12px', textAlign: 'left', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}
                          >
                            <i className="ti ti-trash"></i> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {editingPostId === post.id ? (
                  <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <textarea
                      className="composer-textarea"
                      value={editPostContent}
                      onChange={(e) => {
                        setEditPostContent(e.target.value);
                        e.target.style.height = 'auto';
                        e.target.style.height = `${e.target.scrollHeight}px`;
                      }}
                      style={{ 
                        width: '100%', 
                        background: 'rgba(0,0,0,0.2)', 
                        border: '1px solid rgba(255,255,255,0.08)', 
                        borderRadius: '8px', 
                        color: '#fff', 
                        padding: '10px', 
                        fontSize: '13px', 
                        fontFamily: 'inherit',
                        minHeight: '80px',
                        resize: 'none'
                      }}
                    />

                    {editPostImageUrl && (
                      <div style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', maxWidth: '240px', border: '1px solid var(--card-border)' }}>
                        <img src={editPostImageUrl} alt="Edit preview" style={{ width: '100%', maxHeight: '160px', objectFit: 'cover' }} />
                        <button
                          type="button"
                          onClick={() => setEditPostImageUrl('')}
                          style={{
                            position: 'absolute',
                            top: '4px',
                            right: '4px',
                            background: 'rgba(0,0,0,0.8)',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '50%',
                            width: '24px',
                            height: '24px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <i className="ti ti-x" style={{ fontSize: '12px' }}></i>
                        </button>
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label className="btn-outline mini" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', margin: 0, padding: '4px 10px', fontSize: '11px' }}>
                        <i className="ti ti-photo" style={{ fontSize: '14px' }}></i>
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
                          style={{ display: 'none' }} 
                          disabled={isUploadingEditImage} 
                        />
                      </label>

                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button 
                          className="btn-outline mini" 
                          onClick={() => setEditingPostId(null)}
                        >
                          Cancel
                        </button>
                        <button 
                          className="btn-primary mini" 
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
                    onClick={() => handleDoubleTapLike(post.id)}
                    style={{ position: 'relative' }}
                  >
                    {post.title && (
                      <h3 style={{ fontSize: '16px', fontWeight: 900, color: '#fff', marginTop: '1rem', marginBottom: '0.5rem' }}>
                        {post.title}
                      </h3>
                    )}

                    <p className="feed-item-content" style={{ marginTop: post.title ? '0' : '0.75rem', fontSize: '13px', lineHeight: 1.5, color: 'rgba(255,255,255,0.9)', whiteSpace: 'pre-wrap' }}>
                      {post.content}
                    </p>

                    {post.image_url && (
                      <div style={{ marginTop: '0.75rem', marginBottom: '0.75rem', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--card-border)' }}>
                        <img src={post.image_url} alt="Post media" style={{ width: '100%', height: 'auto', maxHeight: '400px', objectFit: 'contain' }} />
                      </div>
                    )}

                    {/* Floating heart on double-tap */}
                    {floatingHearts.filter(h => h.postId === post.id).map(h => (
                      <div key={h.id} className="floating-heart">❤️</div>
                    ))}
                  </div>
                )}

                <div className="feed-item-actions" style={{ display: 'flex', gap: '1.25rem', marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.75rem' }}>
                  <button className={`feed-action-btn ${post.isLiked ? 'active' : ''}`} onClick={() => handleLikePost(post.id)}>
                    <i className={post.isLiked ? 'ti ti-heart-filled' : 'ti ti-heart'}></i> {post.likes_count}
                  </button>
                  <button className="feed-action-btn" onClick={() => toggleComments(post.id)}>
                    <i className="ti ti-message-circle"></i> {post.comments_count || 0}
                  </button>
                  <button className="feed-action-btn" onClick={() => handleSharePost(post.id)}>
                    <i className="ti ti-share"></i> {post.shares_count || 0}
                  </button>
                </div>

                {/* Expandable comments list */}
                {expandedComments[post.id] !== undefined && (
                  <div style={{ 
                    marginTop: '1rem', 
                    paddingTop: '1rem', 
                    borderTop: '1px solid rgba(255,255,255,0.06)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem' 
                  }}>
                    {commentsLoading[post.id] ? (
                      <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '12px' }}>Loading posts...</div>
                    ) : (
                      <>
                        {expandedComments[post.id].length === 0 ? (
                          <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '11px', padding: '0.5rem 0' }}>No posts yet. Be the first to post!</div>
                        ) : (
                          expandedComments[post.id].map((c: any) => (
                            <div key={c.id} style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '10px', padding: '8px 12px' }}
                              onContextMenu={(e) => {
                                if (user && (c.user_id === user.id || user.role === 'admin' || user.role === 'owner')) {
                                  e.preventDefault();
                                  setContextMenu({ x: e.clientX, y: e.clientY, commentId: c.id, content: c.content, postId: post.id });
                                }
                              }}
                            >
                              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                                <UserAvatar username={c.username} avatarUrl={c.avatar_url} equippedFrame={c.equipped_frame} size={28} />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                      <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--orange)' }}>@{c.username}</span>
                                      <span className="badge-tag" style={{ fontSize: '8px', padding: '1px 4px', margin: 0 }}>{c.batch}</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                      <span style={{ fontSize: '9px', color: 'var(--text-secondary)' }}>
                                        {new Date(c.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                                      </span>
                                      {user && (c.user_id === user.id || user.role === 'admin' || user.role === 'owner') && (
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setContextMenu({ x: e.clientX, y: e.clientY, commentId: c.id, content: c.content, postId: post.id });
                                          }}
                                          style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '13px', padding: '0 2px' }}
                                          title="More"
                                        >
                                          <i className="ti ti-dots-vertical"></i>
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                  {editingCommentId === c.id ? (
                                    <textarea
                                      className="pl-input"
                                      value={editCommentText}
                                      onChange={(e) => setEditCommentText(e.target.value)}
                                      rows={2}
                                      style={{ width: '100%', resize: 'none', fontFamily: 'inherit', fontSize: '12px', marginBottom: '0.5rem' }}
                                      autoFocus
                                    />
                                  ) : (
                                    <p style={{ fontSize: '12.5px', color: '#eee', lineHeight: 1.4, margin: '0 0 4px 0' }}>{renderTextWithMentions(c.content)}</p>
                                  )}
                                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                    <button 
                                      className={`feed-action-btn ${c.has_liked ? 'active' : ''}`}
                                      onClick={() => handleCommentLike(post.id, c.id)}
                                      style={{ fontSize: '11px' }}
                                    >
                                      <i className={c.has_liked ? 'ti ti-heart-filled' : 'ti ti-heart'}></i> {c.likes_count}
                                    </button>
                                    <button 
                                      className="feed-action-btn" 
                                      onClick={() => {
                                        setReplyingToComment(prev => ({ ...prev, [post.id]: c }));
                                        document.getElementById(`comment-input-${post.id}`)?.focus();
                                      }}
                                      style={{ fontSize: '11px' }}
                                    >
                                      <i className="ti ti-arrow-back-up"></i> Reply
                                    </button>
                                  </div>
                                </div>
                              </div>
                              {/* Nested replies */}
                              {c.replies && c.replies.length > 0 && (
                                <div style={{ borderRight: '2px solid rgba(255,255,255,0.06)', paddingRight: '0.75rem', marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                  {c.replies.map((r: any) => (
                                    <div key={r.id} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', paddingLeft: '0.5rem' }}>
                                      <UserAvatar username={r.username} avatarUrl={r.avatar_url} equippedFrame={r.equipped_frame} size={22} />
                                      <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)' }}>@{r.username}</span>
                                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <span style={{ fontSize: '8px', color: 'var(--text-secondary)' }}>
                                              {new Date(r.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                                            </span>
                                            {user && (r.user_id === user.id || user.role === 'admin' || user.role === 'owner') && (
                                              <button
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  setContextMenu({ x: e.clientX, y: e.clientY, commentId: r.id, content: r.content, postId: post.id, parentId: c.id });
                                                }}
                                                style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '11px', padding: '0 2px' }}
                                                title="More"
                                              >
                                                <i className="ti ti-dots-vertical"></i>
                                              </button>
                                            )}
                                          </div>
                                        </div>
                                        {editingCommentId === r.id ? (
                                          <textarea
                                            className="pl-input"
                                            value={editCommentText}
                                            onChange={(e) => setEditCommentText(e.target.value)}
                                            rows={2}
                                            style={{ width: '100%', resize: 'none', fontFamily: 'inherit', fontSize: '11px', marginTop: '2px' }}
                                            autoFocus
                                          />
                                        ) : (
                                          <p style={{ fontSize: '11.5px', color: '#ccc', lineHeight: 1.3, margin: '2px 0 0 0' }}>{renderTextWithMentions(r.content)}</p>
                                        )}
                                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginTop: '0.25rem' }}>
                                          <button 
                                            className={`feed-action-btn ${r.has_liked ? 'active' : ''}`}
                                            onClick={() => handleCommentLike(post.id, r.id)}
                                            style={{ fontSize: '10px' }}
                                          >
                                            <i className={r.has_liked ? 'ti ti-heart-filled' : 'ti ti-heart'}></i> {r.likes_count}
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
                        
                        {/* Comment compose form */}
                        {user ? (
                          <div style={{ position: 'relative', marginTop: '0.5rem' }}>
                            {replyingToComment[post.id] && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontSize: '11px', color: 'var(--orange)' }}>
                                <i className="ti ti-arrow-back-up"></i>
                                <span>Replying to <strong>@{replyingToComment[post.id].username}</strong></span>
                                <button 
                                  onClick={() => setReplyingToComment(prev => ({ ...prev, [post.id]: null }))}
                                  style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '13px', padding: 0, marginLeft: 'auto' }}
                                >
                                  <i className="ti ti-x"></i>
                                </button>
                              </div>
                            )}
                            {/* Mention suggestions */}
                            {commentMentionSearch[post.id] && usernames && usernames.length > 0 && (
                              <div 
                                className="glass-card"
                                style={{
                                  position: 'absolute',
                                  bottom: '100%',
                                  left: 0,
                                  right: 0,
                                  maxHeight: '120px',
                                  overflowY: 'auto',
                                  zIndex: 10,
                                  background: 'rgba(15, 15, 15, 0.95)',
                                  border: '1px solid var(--orange)',
                                  borderRadius: '8px',
                                  padding: '4px'
                                }}
                              >
                                {usernames
                                  .filter((u: any) => u.username.toLowerCase().startsWith(commentMentionSearch[post.id]!.toLowerCase()) && u.username !== user.username)
                                  .map((u: any) => (
                                    <div
                                      key={u.username}
                                      onClick={() => handleSelectCommentMention(post.id, u.username)}
                                      style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        padding: '4px 8px',
                                        cursor: 'pointer',
                                        borderRadius: '4px',
                                        fontSize: '11.5px',
                                        color: '#fff'
                                      }}
                                      className="mention-autocomplete-item"
                                    >
                                      <UserAvatar username={u.username} avatarUrl={u.avatar_url} equippedFrame={u.equipped_frame} size={20} />
                                      <span>@{u.username}</span>
                                    </div>
                                  ))}
                              </div>
                            )}
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
                              <textarea
                                id={`comment-input-${post.id}`}
                                className="pl-input"
                                placeholder={replyingToComment[post.id] ? `Reply to @${replyingToComment[post.id].username}...` : "Write a post..."}
                                value={newCommentTexts[post.id] || ''}
                                onChange={(e) => {
                                  handleCommentInputChange(post.id, e.target.value);
                                  e.target.style.height = 'auto';
                                  e.target.style.height = `${e.target.scrollHeight}px`;
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    if (newCommentTexts[post.id]?.trim()) {
                                      submitComment(post.id, replyingToComment[post.id]?.id);
                                      e.currentTarget.style.height = 'auto';
                                    }
                                  }
                                }}
                                rows={1}
                                style={{ flex: 1, resize: 'none', minHeight: '34px', maxHeight: '120px', fontFamily: 'inherit', fontSize: '12px', padding: '6px 12px' }}
                              />
                              <button 
                                className="btn-primary mini" 
                                onClick={() => {
                                  submitComment(post.id, replyingToComment[post.id]?.id);
                                  const el = document.getElementById(`comment-input-${post.id}`);
                                  if (el) el.style.height = 'auto';
                                }}
                                disabled={!newCommentTexts[post.id]?.trim() || commentSubmitting[post.id]}
                              >
                    {commentSubmitting[post.id] ? (
                      <><i className="ti ti-loader" style={{ animation: 'spin 1s linear infinite' }}></i> Posting...</>
                    ) : (
                      replyingToComment[post.id] ? 'Reply' : 'Post'
                    )}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textAlign: 'center' }}>
                            Please login to post.
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </section>

      {contextMenu && (
        <div style={{
          position: 'fixed',
          top: contextMenu.y,
          left: contextMenu.x,
          background: '#1a1a1a',
          border: '1px solid var(--card-border)',
          borderRadius: '10px',
          padding: '0.35rem',
          zIndex: 10000,
          minWidth: '130px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
          display: 'flex',
          flexDirection: 'column',
          gap: '2px'
        }}>
          <button
            onClick={() => {
              setEditingCommentId(contextMenu.commentId);
              setEditCommentText(contextMenu.content);
              setContextMenu(null);
            }}
            style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '12px', padding: '8px 12px', borderRadius: '8px', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '8px' }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <i className="ti ti-pencil" style={{ color: 'var(--text-secondary)' }}></i> Edit Post
          </button>
          <button
            onClick={() => {
              deleteComment(contextMenu.postId, contextMenu.commentId, !!contextMenu.parentId, contextMenu.parentId);
              setContextMenu(null);
            }}
            style={{ background: 'transparent', border: 'none', color: '#ff4d4d', cursor: 'pointer', fontSize: '12px', padding: '8px 12px', borderRadius: '8px', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '8px' }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,77,77,0.08)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <i className="ti ti-trash" style={{ color: '#ff4d4d' }}></i> Delete Post
          </button>
        </div>
      )}

      {/* Inline edit form */}
      {editingCommentId && (
        <div style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: '#1a1a1a',
          borderTop: '1px solid var(--card-border)',
          padding: '1rem',
          zIndex: 10000,
          boxShadow: '0 -8px 32px rgba(0,0,0,0.6)'
        }}>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
            <textarea
              className="pl-input"
              value={editCommentText}
              onChange={(e) => setEditCommentText(e.target.value)}
              rows={2}
              style={{ flex: 1, resize: 'none', fontFamily: 'inherit', fontSize: '13px' }}
              autoFocus
            />
            <button className="btn-outline mini" onClick={() => { setEditingCommentId(null); setEditCommentText(''); }}>
              Cancel
            </button>
            <button
              className="btn-primary mini"
              onClick={() => handleEditCommunityComment(editingCommentId, editCommentText)}
              disabled={!editCommentText.trim()}
            >
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
