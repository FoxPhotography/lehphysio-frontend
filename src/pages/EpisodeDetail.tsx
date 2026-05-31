import React from 'react';
import { getYoutubeEmbedUrl } from '../utils/helpers';
import { UserAvatar } from '../components/UserAvatar';

interface EpisodeDetailProps {
  episodeDetailLoading: boolean;
  episodeDetail: any;
  episodeInteracting: boolean;
  user: any;
  setCurrentPage: (page: string) => void;
  handleEpisodeInteract: (type: string, content?: string, parentId?: number) => void;
  handleQuizSubmit: (quizId: number) => void;
  redeemError: string;
  redeemSuccess: string;
  handleRedeem: (e: React.FormEvent) => void;
  secretCode: string;
  setSecretCode: (code: string) => void;
  quizAnswer: number | null;
  setQuizAnswer: (ans: number | null) => void;
  quizResult: any;
  setQuizResult: (res: any) => void;
  commentInput: string;
  setCommentInput: (val: string) => void;
  replyingToComment: any;
  setReplyingToComment: (cmt: any) => void;
  showToast: (msg: string) => void;
  handleOpenModerationModal: (username: string, userId: number) => void;
  handleDeleteComment: (commentId: number) => void;
  handleEditComment: (commentId: number, content: string) => void;
  usernames?: any[];
}

export const EpisodeDetail: React.FC<EpisodeDetailProps> = ({
  episodeDetailLoading,
  episodeDetail,
  episodeInteracting,
  user,
  setCurrentPage,
  handleEpisodeInteract,
  handleQuizSubmit,
  redeemError,
  redeemSuccess,
  handleRedeem,
  secretCode,
  setSecretCode,
  quizAnswer,
  setQuizAnswer,
  quizResult,
  setQuizResult,
  commentInput,
  setCommentInput,
  replyingToComment,
  setReplyingToComment,
  showToast,
  handleOpenModerationModal,
  handleDeleteComment,
  handleEditComment,
  usernames = []
}) => {
  const [mentionSearchText, setMentionSearchText] = React.useState<string | null>(null);
  const [commentsExpanded, setCommentsExpanded] = React.useState(true);
  const [editingCommentId, setEditingCommentId] = React.useState<number | null>(null);
  const [editCommentText, setEditCommentText] = React.useState('');
  const [contextMenu, setContextMenu] = React.useState<{ x: number; y: number; commentId: number; content: string; isOwner: boolean } | null>(null);

  // Close context menu on outside click or Escape
  React.useEffect(() => {
    if (contextMenu) {
      const close = () => setContextMenu(null);
      const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setContextMenu(null); };
      document.addEventListener('click', close);
      document.addEventListener('keydown', onKey);
      return () => {
        document.removeEventListener('click', close);
        document.removeEventListener('keydown', onKey);
      };
    }
    return undefined;
  }, [contextMenu]);

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
  if (episodeDetailLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem 0' }}>
        <div className="skeleton-loader" style={{ width: '80px', height: '80px', borderRadius: '50%', margin: '0 auto' }}></div>
        <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Loading episode details...</p>
      </div>
    );
  }
  if (!episodeDetail) return null;

  const { episode, quiz, has_solved_quiz, likes_count, shares_count, has_liked, comments } = episodeDetail;
  const embedUrl = getYoutubeEmbedUrl(episode.youtube_url);

  return (
    <div className="episode-detail-panel animate-fade-in">
      <button className="btn-outline mini" onClick={() => setCurrentPage('episodes')} style={{ marginBottom: '1.5rem' }}>
        <i className="ti ti-arrow-right"></i> Back to Episodes List
      </button>

      <section className="cinematic-header">
        <div className="cinematic-banner-overlay"></div>
        <div className="cinematic-bg-img" style={{ backgroundImage: `url(${episode.thumbnail_url || 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?q=80&w=600&auto=format&fit=crop'})` }}></div>
        <div className="cinematic-content" style={{ width: '100%' }}>
          <span className="cinematic-ep-num">Episode {episode.id}</span>
          <div className="cinematic-title-row">
            <div className="cinematic-info">
              <h1 className="cinematic-title-ar">{episode.title_ar}</h1>
              <h2 className="cinematic-title-en">{episode.title_en}</h2>
            </div>
            <span style={{ background: 'rgba(255,255,255,0.06)', padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontFamily: 'sans-serif' }}>
              1:02:45
            </span>
          </div>

          {/* Integrated Likes & Shares buttons row inside episode card box */}
          <div className="cinematic-actions-row" style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', flexWrap: 'wrap' }}>
            <button 
              className={`btn-outline mini ${has_liked ? 'active' : ''}`} 
              onClick={() => handleEpisodeInteract('like')}
              style={{ 
                background: has_liked ? 'var(--gradient-main)' : 'rgba(255,255,255,0.08)', 
                color: has_liked ? '#000' : '#fff',
                border: '1px solid rgba(255,255,255,0.15)',
                backdropFilter: 'blur(5px)',
                padding: '6px 12px',
                borderRadius: '12px'
              }}
            >
              <i className={has_liked ? 'ti ti-heart-filled' : 'ti ti-heart'}></i> <span>{likes_count} Likes</span>
            </button>
            <button 
              className="btn-outline mini" 
              onClick={() => {
                setCommentsExpanded(true);
                setTimeout(() => {
                  document.querySelector('.comments-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 100);
              }}
              style={{ 
                background: 'rgba(255,255,255,0.04)', 
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.15)',
                backdropFilter: 'blur(5px)',
                padding: '6px 12px',
                borderRadius: '12px'
              }}
            >
              <i className="ti ti-message-circle"></i> <span>{comments.length} Comments</span>
            </button>
            <button 
              className="btn-outline mini" 
              onClick={() => {
                const refUrl = `${window.location.origin}${window.location.pathname}?ref=${encodeURIComponent(user ? user.username : '')}&episode=${episode.id}`;
                navigator.clipboard.writeText(refUrl);
                showToast('Your share link has been copied! Share it to earn XP when others join 🔗');
              }}
              style={{ 
                background: 'rgba(255,255,255,0.04)', 
                border: '1px solid rgba(255,255,255,0.15)',
                color: '#fff',
                backdropFilter: 'blur(5px)',
                padding: '6px 12px',
                borderRadius: '12px'
              }}
            >
              <i className="ti ti-share"></i> <span>{shares_count} Shares</span>
            </button>
          </div>
        </div>
      </section>

      {/* Embedded player */}
      <section className="audio-player-panel">
        {embedUrl ? (
          <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', borderRadius: '14px', marginBottom: '1rem' }}>
            <iframe
              src={embedUrl}
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              loading="lazy"
              title={`Episode ${episode.id}: ${episode.title_en}`}
            ></iframe>
          </div>
        ) : null}
      </section>

      {/* Code redeem & quiz widgets */}
      <section className="episode-widgets-row">
        <div className="glass-card">
          <h3 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '0.5rem' }}>🔑 Secret Episode Code</h3>
          <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '1rem' }}>Enter the secret code hidden in the specific minute to get XP.</p>
          {redeemError && <div className="pl-form-error">{redeemError}</div>}
          {redeemSuccess && <div className="pl-form-success">{redeemSuccess}</div>}
          <form onSubmit={handleRedeem} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <input
              type="text"
              className="pl-input"
              placeholder="e.g. EP1_SECRET"
              value={secretCode}
              onChange={(e) => setSecretCode(e.target.value)}
            />
            <button type="submit" className="btn-primary mini" style={{ width: '100%' }}>Redeem Code</button>
          </form>
        </div>

        <div className="glass-card">
          <h3 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '0.5rem' }}>🧠 Episode Quiz (+150 XP)</h3>
          {has_solved_quiz || quizResult ? (
            <div style={{ textAlign: 'center', padding: '1rem' }}>
              <span style={{ fontSize: '32px' }}>✅</span>
              <h4 style={{ color: 'var(--orange)', marginTop: '0.5rem' }}>Quiz solved successfully!</h4>
            </div>
          ) : quiz ? (
            <div>
              <h4 style={{ fontSize: '13px', color: '#fff', marginBottom: '0.75rem' }}>{quiz.question}</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {quiz.options.map((opt: string, idx: number) => (
                  <button
                    key={idx}
                    className={`poll-option-btn ${quizAnswer === idx ? 'selected' : ''}`}
                    onClick={() => setQuizAnswer(idx)}
                  >
                    {opt}
                  </button>
                ))}
              </div>
              <button
                className="btn-primary mini"
                style={{ width: '100%', marginTop: '1rem' }}
                onClick={() => handleQuizSubmit(quiz.id)}
                disabled={quizAnswer === null}
              >
                Submit Answer
              </button>
            </div>
          ) : (
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>No quiz available for this episode.</p>
          )}
        </div>
      </section>

      {/* Comments section */}
      <section className="comments-panel" style={{ marginTop: '2.5rem' }}>
        <div 
          onClick={() => setCommentsExpanded(prev => !prev)}
          style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
        >
          <h2 className="pl-section-h2" style={{ marginBottom: 0 }}>
            <span className="title-text">
              <i className="ti ti-message-circle"></i> Discussions & Posts ({comments.length})
            </span>
          </h2>
          <span style={{ color: 'var(--text-secondary)', fontSize: '13px', transition: 'transform 0.2s', transform: commentsExpanded ? 'rotate(0deg)' : 'rotate(-90deg)' }}>
            <i className="ti ti-chevron-down"></i>
          </span>
        </div>

        {!commentsExpanded ? null : (
          <>
            {user ? (
              <div className="composer-row glass-card" style={{ marginBottom: '1.5rem', position: 'relative' }}>
                <textarea
                  id="episode-comment-input"
                  className="pl-input"
                  placeholder={replyingToComment ? `Reply to @${replyingToComment.username}...` : "Add your medical insight here..."}
                  value={commentInput}
                  onChange={(e) => {
                    const text = e.target.value;
                    setCommentInput(text);
                    e.target.style.height = 'auto';
                    e.target.style.height = `${e.target.scrollHeight}px`;
                    
                    const cursor = e.target.selectionStart || 0;
                    const textBeforeCursor = text.slice(0, cursor);
                    const match = textBeforeCursor.match(/@(\w*)$/);
                    if (match) {
                      setMentionSearchText(match[1]);
                    } else {
                      setMentionSearchText(null);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      if (commentInput.trim()) {
                        handleEpisodeInteract('comment', commentInput, replyingToComment?.id);
                        e.currentTarget.style.height = 'auto';
                      }
                    }
                  }}
                  rows={1}
                  style={{ flex: 1, resize: 'none', minHeight: '38px', maxHeight: '120px', fontFamily: 'inherit', fontSize: '13px' }}
                />

                {mentionSearchText !== null && usernames.length > 0 && (
                  <div className="mention-autocomplete-dropdown" style={{
                    position: 'absolute',
                    bottom: '100%',
                    left: 0,
                    right: 0,
                    background: 'rgba(20, 20, 20, 0.95)',
                    border: '1px solid var(--orange)',
                    borderRadius: '8px',
                    maxHeight: '150px',
                    overflowY: 'auto',
                    zIndex: 100,
                    boxShadow: '0 -4px 10px rgba(0,0,0,0.3)',
                    padding: '4px'
                  }}>
                    {usernames
                      .filter(u => u.username.toLowerCase().startsWith(mentionSearchText.toLowerCase()))
                      .map(u => (
                        <div 
                          key={u.username} 
                          className="mention-autocomplete-item" 
                          onClick={() => {
                            const cursor = commentInput.length;
                            const before = commentInput.slice(0, cursor);
                            const after = commentInput.slice(cursor);
                            const replacedBefore = before.replace(/@\w*$/, `@${u.username} `);
                            setCommentInput(replacedBefore + after);
                            setMentionSearchText(null);
                            document.getElementById('episode-comment-input')?.focus();
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '6px 12px',
                            cursor: 'pointer',
                            borderRadius: '4px',
                            color: '#fff',
                            fontSize: '12px'
                          }}
                        >
                          {u.avatar_url ? (
                            <img src={u.avatar_url} alt={u.username} style={{ width: '20px', height: '20px', borderRadius: '50%', objectFit: 'cover' }} />
                          ) : (
                            <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'var(--orange)', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 'bold' }}>
                              {u.username.substring(0, 2).toUpperCase()}
                            </div>
                          )}
                          <span>@{u.username}</span>
                        </div>
                      ))
                    }
                  </div>
                )}

                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', justifyContent: 'flex-end' }}>
                  {replyingToComment && (
                    <button className="btn-outline mini" onClick={() => setReplyingToComment(null)}>Cancel</button>
                  )}
                  <button 
                    className="btn-primary mini" 
                    onClick={() => {
                      handleEpisodeInteract('comment', commentInput, replyingToComment?.id);
                      setMentionSearchText(null);
                      const el = document.getElementById('episode-comment-input');
                      if (el) el.style.height = 'auto';
                    }} 
                    disabled={!commentInput.trim() || episodeInteracting}
                  >
                    {episodeInteracting ? (
                      <><i className="ti ti-loader" style={{ animation: 'spin 1s linear infinite' }}></i> Posting...</>
                    ) : (
                      replyingToComment ? 'Reply' : 'Post'
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '1.5rem' }}>
                Please login to participate in discussions.
              </p>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {comments.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '1rem', fontSize: '13px' }}>
                  No posts yet. Start the discussion above!
                </p>
              ) : comments.map((c: any) => (
                <div key={c.id} className="glass-card" style={{ background: '#0D0D0D' }}
                  onContextMenu={(e) => {
                    if (user && (c.user_id === user.id || user.role === 'admin' || user.role === 'owner')) {
                      e.preventDefault();
                      setContextMenu({ x: e.clientX, y: e.clientY, commentId: c.id, content: c.content, isOwner: c.user_id === user.id });
                    }
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <UserAvatar 
                        username={c.username} 
                        avatarUrl={c.avatar_url} 
                        equippedFrame={c.equipped_frame} 
                        size={28} 
                        style={{ marginRight: '0.25rem' }}
                      />
                      <span style={{ fontWeight: 800, color: 'var(--orange)' }}>@{c.username}</span>
                      {user && ((user.role === 'admin' || user.role === 'owner') && c.user_id !== user.id) && (
                        <button 
                          onClick={() => handleOpenModerationModal(c.username, c.user_id)}
                          className="btn-outline mini"
                          style={{ fontSize: '9px', padding: '2px 6px', color: '#e67e22', borderColor: 'rgba(230,126,34,0.3)', background: 'transparent' }}
                        >
                          <i className="ti ti-shield"></i> Moderate
                        </button>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                        {new Date(c.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                      </span>
                      {user && (c.user_id === user.id || user.role === 'admin' || user.role === 'owner') && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setContextMenu({ x: e.clientX, y: e.clientY, commentId: c.id, content: c.content, isOwner: c.user_id === user.id });
                          }}
                          style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '14px', padding: '0 4px' }}
                          title="More"
                        >
                          <i className="ti ti-dots-vertical"></i>
                        </button>
                      )}
                    </div>
                  </div>
                  {editingCommentId === c.id ? (
                    <div style={{ marginTop: '0.5rem' }}>
                      <textarea
                        className="pl-input"
                        value={editCommentText}
                        onChange={(e) => setEditCommentText(e.target.value)}
                        style={{ width: '100%', resize: 'none', minHeight: '60px', fontFamily: 'inherit', fontSize: '13px', marginBottom: '0.5rem' }}
                      />
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <button className="btn-outline mini" onClick={() => setEditingCommentId(null)}>Cancel</button>
                        <button 
                          className="btn-primary mini" 
                          onClick={() => {
                            if (editCommentText.trim()) {
                              handleEditComment(c.id, editCommentText.trim());
                              setEditingCommentId(null);
                            }
                          }}
                          disabled={!editCommentText.trim()}
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p style={{ fontSize: '13px', color: '#fff', lineHeight: 1.5 }}>{renderTextWithMentions(c.content)}</p>
                  )}
                  
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                    <button 
                      className={`feed-action-btn ${c.has_liked ? 'active' : ''}`}
                      onClick={() => handleEpisodeInteract('comment_like', undefined, c.id)}
                      style={{ fontSize: '11px' }}
                    >
                      <i className={c.has_liked ? 'ti ti-heart-filled' : 'ti ti-heart'}></i> {c.likes_count} Likes
                    </button>
                    {user && (
                      <button className="feed-action-btn" onClick={() => setReplyingToComment(c)} style={{ fontSize: '11px' }}>
                        <i className="ti ti-arrow-back-up"></i> Reply
                      </button>
                    )}
                  </div>

                  {/* Nested replies */}
                  {c.replies && c.replies.length > 0 && (
                    <div style={{ borderRight: '2px solid rgba(255,255,255,0.06)', paddingRight: '1rem', marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {c.replies.map((r: any) => (
                        <div key={r.id} style={{ background: 'rgba(255,255,255,0.02)', padding: '0.5rem 0.75rem', borderRadius: '8px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <UserAvatar 
                                username={r.username} 
                                avatarUrl={r.avatar_url} 
                                equippedFrame={r.equipped_frame} 
                                size={24} 
                                style={{ marginRight: '0.25rem' }}
                              />
                              <span style={{ fontWeight: 800, color: 'var(--text-secondary)' }}>@{r.username}</span>
                              {user && ((user.role === 'admin' || user.role === 'owner') && r.user_id !== user.id) && (
                                <button 
                                  onClick={() => handleOpenModerationModal(r.username, r.user_id)}
                                  className="btn-outline mini"
                                  style={{ fontSize: '9px', padding: '2px 6px', color: '#e67e22', borderColor: 'rgba(230,126,34,0.3)', background: 'transparent' }}
                                >
                                  <i className="ti ti-shield"></i> Moderate
                                </button>
                              )}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontSize: '9px', color: 'var(--text-secondary)' }}>
                                {new Date(r.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                              </span>
                              {user && (r.user_id === user.id || user.role === 'admin' || user.role === 'owner') && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setContextMenu({ x: e.clientX, y: e.clientY, commentId: r.id, content: r.content, isOwner: r.user_id === user.id });
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
                            <div style={{ marginTop: '0.25rem' }}>
                              <textarea
                                className="pl-input"
                                value={editCommentText}
                                onChange={(e) => setEditCommentText(e.target.value)}
                                style={{ width: '100%', resize: 'none', minHeight: '40px', fontFamily: 'inherit', fontSize: '12px', marginBottom: '0.25rem' }}
                              />
                              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                <button className="btn-outline mini" onClick={() => setEditingCommentId(null)}>Cancel</button>
                                <button 
                                  className="btn-primary mini" 
                                  onClick={() => {
                                    if (editCommentText.trim()) {
                                      handleEditComment(r.id, editCommentText.trim());
                                      setEditingCommentId(null);
                                    }
                                  }}
                                  disabled={!editCommentText.trim()}
                                >
                                  Save
                                </button>
                              </div>
                            </div>
                          ) : (
                            <p style={{ fontSize: '12px', color: '#ccc' }}>{renderTextWithMentions(r.content)}</p>
                          )}
                          <button 
                            className={`feed-action-btn ${r.has_liked ? 'active' : ''}`}
                            onClick={() => handleEpisodeInteract('comment_like', undefined, r.id)}
                            style={{ fontSize: '10px', marginTop: '0.25rem' }}
                          >
                            <i className={r.has_liked ? 'ti ti-heart-filled' : 'ti ti-heart'}></i> {r.likes_count}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
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
              handleDeleteComment(contextMenu.commentId);
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
    </div>
  );
};
