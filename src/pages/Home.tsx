import React from 'react';

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
  communityPosts: any[];
  handleLikePost: (id: number) => void;
  handleDeletePost: (id: number) => void;
  handleSharePost: (id: number) => void;
  handleUploadImage: (file: File) => Promise<string | null>;
  usernames?: any[];
  showToast: (msg: string) => void;
  leaderboard?: any[];
}

const getFrameClass = (frame: string) => {
  if (frame === 'gold-glow') return 'avatar-frame-gold-glow';
  if (frame === 'neon-ring') return 'avatar-frame-neon-ring';
  return '';
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
  communityPosts,
  handleLikePost,
  handleDeletePost,
  handleSharePost,
  handleUploadImage,
  usernames = [],
  showToast,
  leaderboard = []
}) => {
  const activeStreak = user?.streak_count || 12;

  // Composer fields
  const [newPostTitle, setNewPostTitle] = React.useState('');
  const [uploadedImageUrl, setUploadedImageUrl] = React.useState('');
  const [isUploadingImage, setIsUploadingImage] = React.useState(false);

  // Expandable Comments panel states
  const [expandedComments, setExpandedComments] = React.useState<{[key: number]: any[]}>({});
  const [commentsLoading, setCommentsLoading] = React.useState<{[key: number]: boolean}>({});
  const [newCommentTexts, setNewCommentTexts] = React.useState<{[key: number]: string}>({});
  const [commentMentionSearch, setCommentMentionSearch] = React.useState<{[key: number]: string | null}>({});

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
    if (!newPostContent.trim()) return;
    await handleCreatePost(newPostTitle, newPostContent, uploadedImageUrl);
    setNewPostTitle('');
    setNewPostContent('');
    setUploadedImageUrl('');
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

  const submitComment = async (postId: number) => {
    const text = newCommentTexts[postId]?.trim();
    if (!text || !user) return;

    try {
      const res = await fetch(`${API_BASE}/api/community/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ content: text })
      });
      if (res.ok) {
        const comment = await res.json();
        setExpandedComments(prev => ({
          ...prev,
          [postId]: [...(prev[postId] || []), comment]
        }));
        setNewCommentTexts(prev => ({ ...prev, [postId]: '' }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const deleteComment = async (postId: number, commentId: number) => {
    try {
      const res = await fetch(`${API_BASE}/api/community/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (res.ok) {
        setExpandedComments(prev => ({
          ...prev,
          [postId]: (prev[postId] || []).filter(c => c.id !== commentId)
        }));
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

      {/* Hero podcast card */}
      <section className="home-hero-card glass-card">
        <div className="hero-thumbnail" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1590602847861-f357a9332bbc?q=80&w=600&auto=format&fit=crop')` }}>
          <div className="hero-thumbnail-overlay"></div>
          <i className="ti ti-microphone hero-mic-glow"></i>
        </div>
        <div className="hero-info-section">
          <div className="hero-badge-row">
            <span className="badge-tag">NEW EPISODE</span>
            <span className="badge-tag" style={{ background: 'rgba(255,255,255,0.06)', color: '#fff' }}>EP.23</span>
          </div>
          <h2 className="hero-title">SPASM</h2>
          <h3 className="hero-title" style={{ fontSize: '18px', fontWeight: 600, color: 'var(--orange)' }}>Upper Motor Neuron</h3>
          <p className="hero-desc">A detailed explanation of muscle spasticity resulting from central nervous system injuries and control mechanics.</p>
          <div className="hero-actions-row">
            <button className="btn-primary" onClick={() => navigateToEpisode(1)}>
              <i className="ti ti-player-play"></i> Watch Now
            </button>
            <button className="btn-outline" style={{ borderRadius: '50%', width: '42px', height: '42px', padding: 0 }}>
              <i className="ti ti-bookmark"></i>
            </button>
          </div>
        </div>
      </section>

      {/* Streak & Streak Panel */}
      <section className="streak-row-wrapper">
        <div className="streak-welcome-text">
          <h1>Leh Physio? 🔥</h1>
          <p>Listen. Learn. Elevate your level.</p>
        </div>
        <button className="streak-badge" onClick={() => setCurrentPage('profile')}>
          <i className="ti ti-flame" style={{ fontSize: '20px' }}></i>
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
            <div className="stat-badge-value">#87</div>
            <span style={{ fontSize: '11px', color: 'var(--orange)', fontWeight: 800 }}>Top 1%</span>
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
          {leaderboard && leaderboard.length >= 3 ? (
            <>
              {/* 2nd Place */}
              <div className="podium-column">
                <div className="podium-avatar-container">
                  <div className={`podium-avatar-ring second ${getFrameClass(leaderboard[1].equipped_frame)}`} style={{ position: 'relative' }}>
                    <div className="podium-avatar-inner" style={{ overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {leaderboard[1].avatar_url ? (
                        <img src={leaderboard[1].avatar_url} alt={leaderboard[1].username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        leaderboard[1].username.substring(0, 2).toUpperCase()
                      )}
                    </div>
                  </div>
                  <span className="podium-rank-badge">2</span>
                </div>
                <span className="podium-username">{leaderboard[1].username}</span>
                <span className="podium-xp">{leaderboard[1].xp} XP</span>
                <div className="podium-bar second">2</div>
              </div>
              {/* 1st Place */}
              <div className="podium-column">
                <div className="podium-avatar-container">
                  <div className={`podium-avatar-ring first ${getFrameClass(leaderboard[0].equipped_frame)}`} style={{ position: 'relative' }}>
                    <div className="podium-avatar-inner" style={{ overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {leaderboard[0].avatar_url ? (
                        <img src={leaderboard[0].avatar_url} alt={leaderboard[0].username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        leaderboard[0].username.substring(0, 2).toUpperCase()
                      )}
                    </div>
                  </div>
                  <span className="podium-rank-badge">1</span>
                </div>
                <span className="podium-username">{leaderboard[0].username}</span>
                <span className="podium-xp">{leaderboard[0].xp} XP</span>
                <div className="podium-bar first">1</div>
              </div>
              {/* 3rd Place */}
              <div className="podium-column">
                <div className="podium-avatar-container">
                  <div className={`podium-avatar-ring third ${getFrameClass(leaderboard[2].equipped_frame)}`} style={{ position: 'relative' }}>
                    <div className="podium-avatar-inner" style={{ overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {leaderboard[2].avatar_url ? (
                        <img src={leaderboard[2].avatar_url} alt={leaderboard[2].username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        leaderboard[2].username.substring(0, 2).toUpperCase()
                      )}
                    </div>
                  </div>
                  <span className="podium-rank-badge">3</span>
                </div>
                <span className="podium-username">{leaderboard[2].username}</span>
                <span className="podium-xp">{leaderboard[2].xp} XP</span>
                <div className="podium-bar third">3</div>
              </div>
            </>
          ) : (
            // Static Fallback
            <>
              {/* 2nd Place */}
              <div className="podium-column">
                <div className="podium-avatar-container">
                  <div className="podium-avatar-ring second">
                    <div className="podium-avatar-inner">OE</div>
                  </div>
                  <span className="podium-rank-badge">2</span>
                </div>
                <span className="podium-username">Omar Ashraf</span>
                <span className="podium-xp">12,540 XP</span>
                <div className="podium-bar second">2</div>
              </div>
              {/* 1st Place */}
              <div className="podium-column">
                <div className="podium-avatar-container">
                  <div className="podium-avatar-ring first">
                    <div className="podium-avatar-inner">MT</div>
                  </div>
                  <span className="podium-rank-badge">1</span>
                </div>
                <span className="podium-username">Mahmoud Tarek</span>
                <span className="podium-xp">15,670 XP</span>
                <div className="podium-bar first">1</div>
              </div>
              {/* 3rd Place */}
              <div className="podium-column">
                <div className="podium-avatar-container">
                  <div className="podium-avatar-ring third">
                    <div className="podium-avatar-inner">NE</div>
                  </div>
                  <span className="podium-rank-badge">3</span>
                </div>
                <span className="podium-username">Nourhan Emad</span>
                <span className="podium-xp">11,230 XP</span>
                <div className="podium-bar third">3</div>
              </div>
            </>
          )}
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
              <div className="feed-user-avatar" style={{ width: '38px', height: '38px', borderRadius: '50%', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--orange)', color: '#000', fontWeight: 'bold', fontSize: '14px', flexShrink: 0 }}>
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt={user.username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  user.username[0].toUpperCase()
                )}
              </div>
              <div className="composer-main" style={{ flex: 1 }}>
                <input
                  type="text"
                  className="pl-input"
                  placeholder="Post Title (optional)"
                  value={newPostTitle}
                  onChange={(e) => setNewPostTitle(e.target.value)}
                  style={{ marginBottom: '0.5rem', width: '100%', fontSize: '13px', padding: '8px 12px' }}
                />
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
                  <button type="submit" className="btn-primary mini" disabled={!newPostContent.trim() || isUploadingImage}>
                    Publish Post <i className="ti ti-send"></i>
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
              <div key={post.id} className="community-feed-item glass-card" style={{ marginBottom: '1.25rem', padding: '1.25rem' }}>
                <div className="feed-item-header">
                  <div className="feed-user-block" style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <div className={`mobile-avatar-ring ${getFrameClass(post.equipped_frame)}`} style={{ width: '38px', height: '38px', flexShrink: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.3)', cursor: 'default' }}>
                      <div className="mobile-avatar-inner" style={{ fontSize: '12px', background: 'var(--bg-secondary)' }}>
                        {post.avatar_url ? (
                          <img src={post.avatar_url} alt={post.username} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                        ) : (
                          post.username[0].toUpperCase()
                        )}
                      </div>
                    </div>
                    <div className="feed-user-details">
                      <div className="feed-username-row" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span className="feed-username" style={{ fontWeight: 800, color: '#fff' }}>{post.username}</span>
                        <span className="feed-badge-role" style={{ fontSize: '9px', background: 'rgba(255, 106, 0, 0.1)', color: 'var(--orange)', padding: '1px 6px', borderRadius: '4px' }}>{post.batch}</span>
                      </div>
                      <span className="feed-user-meta" style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                        {post.rank.emoji} {post.rank.name_en} · {new Date(post.created_at).toLocaleDateString('ar-EG')}
                      </span>
                    </div>
                  </div>
                </div>

                {post.title && (
                  <h3 style={{ fontSize: '16px', fontWeight: 900, color: '#fff', marginTop: '1rem', marginBottom: '0.5rem' }}>
                    {post.title}
                  </h3>
                )}

                <p className="feed-item-content" style={{ marginTop: post.title ? '0' : '0.75rem', fontSize: '13px', lineHeight: 1.5, color: 'rgba(255,255,255,0.9)' }}>
                  {post.content}
                </p>

                {post.image_url && (
                  <div style={{ marginTop: '0.75rem', marginBottom: '0.75rem', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--card-border)' }}>
                    <img src={post.image_url} alt="Post media" style={{ width: '100%', maxHeight: '360px', objectFit: 'cover' }} />
                  </div>
                )}

                <div className="feed-item-actions" style={{ display: 'flex', gap: '1rem', marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.75rem' }}>
                  <button className={`feed-action-btn ${post.isLiked ? 'active' : ''}`} onClick={() => handleLikePost(post.id)}>
                    <i className={post.isLiked ? 'ti ti-heart-filled' : 'ti ti-heart'}></i> {post.likes_count}
                  </button>
                  <button className="feed-action-btn" onClick={() => toggleComments(post.id)}>
                    <i className="ti ti-message-circle"></i> Comment ({post.comments_count || 0})
                  </button>
                  <button className="feed-action-btn" onClick={() => handleSharePost(post.id)}>
                    <i className="ti ti-share"></i> Share ({post.shares_count || 0})
                  </button>
                  {user && (user.role === 'admin' || user.role === 'owner') && (
                    <button className="feed-action-btn" onClick={() => handleDeletePost(post.id)} style={{ color: '#ff4d4d', marginRight: 'auto' }}>
                      <i className="ti ti-trash"></i> Delete
                    </button>
                  )}
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
                      <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '12px' }}>Loading comments...</div>
                    ) : (
                      <>
                        {expandedComments[post.id].length === 0 ? (
                          <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '11px', padding: '0.5rem 0' }}>No comments yet. Be the first to comment!</div>
                        ) : (
                          expandedComments[post.id].map((c: any) => (
                            <div key={c.id} style={{ display: 'flex', gap: '0.75rem', background: 'rgba(255,255,255,0.02)', padding: '8px 12px', borderRadius: '10px', alignItems: 'flex-start' }}>
                              <div className={`mobile-avatar-ring ${getFrameClass(c.equipped_frame)}`} style={{ width: '28px', height: '28px', flexShrink: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.2)', cursor: 'default' }}>
                                <div className="mobile-avatar-inner" style={{ fontSize: '10px', background: 'var(--bg-secondary)' }}>
                                  {c.avatar_url ? (
                                    <img src={c.avatar_url} alt={c.username} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                                  ) : (
                                    c.username[0].toUpperCase()
                                  )}
                                </div>
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--orange)' }}>@{c.username}</span>
                                    <span className="badge-tag" style={{ fontSize: '8px', padding: '1px 4px', margin: 0 }}>{c.batch}</span>
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontSize: '9px', color: 'var(--text-secondary)' }}>
                                      {new Date(c.created_at).toLocaleDateString('ar-EG')}
                                    </span>
                                    {user && (c.user_id === user.id || user.role === 'admin' || user.role === 'owner') && (
                                      <button 
                                        onClick={() => deleteComment(post.id, c.id)}
                                        style={{ background: 'transparent', border: 'none', color: '#ff4d4d', cursor: 'pointer', fontSize: '11px', padding: 0 }}
                                        title="Delete comment"
                                      >
                                        <i className="ti ti-trash"></i>
                                      </button>
                                    )}
                                  </div>
                                </div>
                                <p style={{ fontSize: '12.5px', color: '#eee', lineHeight: 1.4, margin: 0 }}>{renderTextWithMentions(c.content)}</p>
                              </div>
                            </div>
                          ))
                        )}
                        
                        {/* Comment compose form */}
                        {user ? (
                          <div style={{ position: 'relative', marginTop: '0.5rem' }}>
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
                                      <div className={`mobile-avatar-ring ${getFrameClass(u.equipped_frame)}`} style={{ width: '20px', height: '20px', cursor: 'default', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }}>
                                        <div className="mobile-avatar-inner" style={{ fontSize: '8px', background: 'var(--bg-secondary)' }}>
                                          {u.avatar_url ? <img src={u.avatar_url} alt={u.username} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : u.username[0].toUpperCase()}
                                        </div>
                                      </div>
                                      <span>@{u.username}</span>
                                    </div>
                                  ))}
                              </div>
                            )}
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <input
                                id={`comment-input-${post.id}`}
                                type="text"
                                className="pl-input"
                                placeholder="Write a comment..."
                                value={newCommentTexts[post.id] || ''}
                                onChange={(e) => handleCommentInputChange(post.id, e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && newCommentTexts[post.id]?.trim()) {
                                    submitComment(post.id);
                                  }
                                }}
                                style={{ fontSize: '12px', padding: '6px 12px' }}
                              />
                              <button 
                                className="btn-primary mini" 
                                onClick={() => submitComment(post.id)}
                                disabled={!newCommentTexts[post.id]?.trim()}
                              >
                                Comment
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textAlign: 'center' }}>
                            Please login to comment.
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
    </div>
  );
};
