import React from 'react';
import { getYoutubeEmbedUrl } from '../utils/helpers';

interface EpisodeDetailProps {
  episodeDetailLoading: boolean;
  episodeDetail: any;
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
  usernames?: any[];
}

export const EpisodeDetail: React.FC<EpisodeDetailProps> = ({
  episodeDetailLoading,
  episodeDetail,
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
  usernames = []
}) => {
  const [mentionSearchText, setMentionSearchText] = React.useState<string | null>(null);

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
        <h2 className="pl-section-h2">
          <span className="title-text">
            <i className="ti ti-message-circle"></i> Discussions & Comments ({comments.length})
          </span>
        </h2>
        
        {user ? (
          <div className="composer-row glass-card" style={{ marginBottom: '1.5rem', position: 'relative' }}>
            <input
              id="episode-comment-input"
              type="text"
              className="pl-input"
              placeholder={replyingToComment ? `Reply to @${replyingToComment.username}...` : "Add your medical comment here..."}
              value={commentInput}
              onChange={(e) => {
                const text = e.target.value;
                setCommentInput(text);
                
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
                if (e.key === 'Enter' && commentInput.trim()) {
                  handleEpisodeInteract('comment', commentInput, replyingToComment?.id);
                }
              }}
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
                }} 
                disabled={!commentInput.trim()}
              >
                {replyingToComment ? 'Reply' : 'Comment'}
              </button>
            </div>
          </div>
        ) : (
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '1.5rem' }}>
            Please login to participate in discussions.
          </p>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {comments.map((c: any) => (
            <div key={c.id} className="glass-card" style={{ background: '#0D0D0D' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', overflow: 'hidden', border: '1px solid var(--card-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {c.avatar_url ? (
                      <img src={c.avatar_url} alt={c.username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255, 106, 0, 0.15)', color: 'var(--orange)', fontSize: '11px', fontWeight: 'bold' }}>
                        {c.username.substring(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <span style={{ fontWeight: 800, color: 'var(--orange)' }}>@{c.username}</span>
                  {user && (user.role === 'admin' || user.role === 'owner') && c.user_id !== user.id && (
                    <button 
                      onClick={() => handleOpenModerationModal(c.username, c.user_id)}
                      className="btn-outline mini"
                      style={{ fontSize: '9px', padding: '2px 6px', color: '#e67e22', borderColor: 'rgba(230,126,34,0.3)', background: 'transparent' }}
                    >
                      <i className="ti ti-shield"></i> Moderate
                    </button>
                  )}
                </div>
                <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                  {new Date(c.created_at).toLocaleDateString('ar-EG')}
                </span>
              </div>
              <p style={{ fontSize: '13px', color: '#fff', lineHeight: 1.5 }}>{renderTextWithMentions(c.content)}</p>
              
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
                          <div style={{ width: '24px', height: '24px', borderRadius: '50%', overflow: 'hidden', border: '1px solid var(--card-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {r.avatar_url ? (
                              <img src={r.avatar_url} alt={r.username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.06)', color: 'var(--text-secondary)', fontSize: '10px', fontWeight: 'bold' }}>
                                {r.username.substring(0, 2).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <span style={{ fontWeight: 800, color: 'var(--text-secondary)' }}>@{r.username}</span>
                          {user && (user.role === 'admin' || user.role === 'owner') && r.user_id !== user.id && (
                            <button 
                              onClick={() => handleOpenModerationModal(r.username, r.user_id)}
                              className="btn-outline mini"
                              style={{ fontSize: '9px', padding: '2px 6px', color: '#e67e22', borderColor: 'rgba(230,126,34,0.3)', background: 'transparent' }}
                            >
                              <i className="ti ti-shield"></i> Moderate
                            </button>
                          )}
                        </div>
                        <span style={{ fontSize: '9px', color: 'var(--text-secondary)' }}>
                          {new Date(r.created_at).toLocaleDateString('ar-EG')}
                        </span>
                      </div>
                      <p style={{ fontSize: '12px', color: '#ccc' }}>{renderTextWithMentions(r.content)}</p>
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
      </section>
    </div>
  );
};
