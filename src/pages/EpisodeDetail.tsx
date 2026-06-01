import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getYoutubeEmbedUrl, copyToClipboard } from '../utils/helpers';
import { UserAvatar } from '../components/UserAvatar';
import { 
  ArrowLeft, 
  Heart, 
  MessageCircle, 
  Share2, 
  ChevronDown, 
  ShieldAlert, 
  MoreVertical, 
  Loader2, 
  X, 
  Edit2, 
  Trash2, 
  CornerUpLeft,
  Key,
  Brain,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

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

// Helper to strip emojis
const stripEmojis = (str: string) => {
  if (!str) return '';
  return str.replace(/[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]/g, '').trim();
};

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
  const [mentionSearchText, setMentionSearchText] = useState<string | null>(null);
  const [commentsExpanded, setCommentsExpanded] = useState(true);
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editCommentText, setEditCommentText] = useState('');
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; commentId: number; content: string; isOwner: boolean } | null>(null);

  // Close context menu on outside click or Escape
  useEffect(() => {
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
          <span key={idx} className="text-yellow-400 font-extrabold">
            {part}
          </span>
        );
      }
      return part;
    });
  };

  if (episodeDetailLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-12 h-12 text-brand-orange animate-spin mb-4" />
        <p className="text-zinc-500 text-sm font-semibold">Loading episode details...</p>
      </div>
    );
  }

  if (!episodeDetail) return null;

  const { episode, quiz, has_solved_quiz, likes_count, shares_count, has_liked, comments } = episodeDetail;
  const embedUrl = getYoutubeEmbedUrl(episode.youtube_url);

  return (
    <div className="space-y-6 py-6 max-w-4xl mx-auto px-4 pb-20 text-left">
      <button 
        className="flex items-center gap-2 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/40 text-zinc-300 font-bold text-xs py-2.5 px-4 rounded-xl cursor-pointer active:scale-95 transition-all" 
        onClick={() => setCurrentPage('episodes')}
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Episodes</span>
      </button>

      {/* Cinematic header card */}
      <section className="glass-card overflow-hidden relative p-6 md:p-8 flex flex-col justify-end min-h-60 group">
        <div className="absolute inset-0 bg-black/60 bg-radial-gradient z-10" />
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-40 group-hover:scale-102 transition-transform duration-700" 
          style={{ backgroundImage: `url(${episode.thumbnail_url || 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?q=80&w=600&auto=format&fit=crop'})` }}
        />
        
        <div className="relative z-20 space-y-4">
          <span className="text-[10px] font-black tracking-wider bg-brand-orange/20 text-brand-orange px-2.5 py-1 rounded-md uppercase border border-brand-orange/10 self-start inline-block">
            Episode {episode.id}
          </span>
          <div className="space-y-1">
            <h1 className="text-xl md:text-2xl font-black text-white leading-tight">{episode.title_ar}</h1>
            <h2 className="text-xs md:text-sm font-semibold text-zinc-400 tracking-wide uppercase">{episode.title_en}</h2>
          </div>

          <div className="flex gap-4 pt-2">
            <button 
              className={`flex items-center gap-1.5 text-xs font-bold transition-all ${has_liked ? 'text-brand-orange' : 'text-zinc-500 hover:text-zinc-300'}`} 
              onClick={() => handleEpisodeInteract('like')}
            >
              <Heart className={`w-4 h-4 ${has_liked ? 'fill-current' : ''}`} /> 
              <span>{likes_count} Likes</span>
            </button>
            <button 
              className="flex items-center gap-1.5 text-xs font-bold text-zinc-500 hover:text-zinc-300 transition-all" 
              onClick={() => {
                setCommentsExpanded(true);
                setTimeout(() => {
                  document.querySelector('.comments-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 100);
              }}
            >
              <MessageCircle className="w-4 h-4" /> 
              <span>{comments.length} Comments</span>
            </button>
            <button 
              className="flex items-center gap-1.5 text-xs font-bold text-zinc-500 hover:text-zinc-300 transition-all" 
              onClick={() => {
                const ref = user ? user.username : '';
                const shareLink = `${window.location.origin}/episodes/${episode.id}${ref ? '?ref=' + ref : ''}`;
                copyToClipboard(shareLink);
                showToast('Your share link has been copied! Share it to earn XP when others join 🔗');
              }}
            >
              <Share2 className="w-4 h-4" /> 
              <span>{shares_count} Shares</span>
            </button>
          </div>
        </div>
      </section>

      {/* Embedded video player */}
      {embedUrl ? (
        <section className="glass-card p-2 overflow-hidden">
          <div className="relative pb-[56.25%] h-0 rounded-xl overflow-hidden border border-zinc-900/60 bg-zinc-950">
            <iframe
              src={embedUrl}
              className="absolute inset-0 w-full h-full border-none z-10"
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              loading="lazy"
              title={`Episode ${episode.id}: ${episode.title_en}`}
            />
          </div>
        </section>
      ) : null}

      {/* Code redeem & quiz widgets */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Code redeem card */}
        <div className="glass-card p-5 text-left flex flex-col justify-between gap-4">
          <div>
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <Key className="w-4 h-4 text-brand-orange" />
              <span>Secret Episode Code</span>
            </h3>
            <p className="text-[10px] text-zinc-500 font-semibold mt-1">Enter the secret code hidden in the specific minute to get XP.</p>
          </div>

          <form onSubmit={handleRedeem} className="space-y-3.5">
            {redeemError && (
              <div className="text-xs font-bold text-red-400 bg-red-500/10 border border-red-500/20 p-2.5 rounded-xl flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{redeemError}</span>
              </div>
            )}
            {redeemSuccess && (
              <div className="text-xs font-bold text-green-400 bg-green-500/10 border border-green-500/20 p-2.5 rounded-xl flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>{redeemSuccess}</span>
              </div>
            )}
            <div className="flex flex-col gap-2.5">
              <input
                type="text"
                className="w-full bg-zinc-900/60 border border-zinc-800 focus:border-brand-orange focus:ring-1 focus:ring-brand-orange/30 text-white rounded-xl px-4 py-3 text-xs font-semibold placeholder-zinc-500 outline-none transition-all duration-200"
                placeholder="e.g. EP1_SECRET"
                value={secretCode}
                onChange={(e) => setSecretCode(e.target.value)}
              />
              <button 
                type="submit" 
                className="w-full bg-gradient-to-r from-brand-orange to-brand-amber text-black font-extrabold text-xs py-3 rounded-xl cursor-pointer hover:shadow-orange-intense active:scale-95 transition-all shadow-orange-glow"
              >
                Redeem Code
              </button>
            </div>
          </form>
        </div>

        {/* Quiz solver card */}
        <div className="glass-card p-5 text-left flex flex-col justify-between gap-4">
          <div>
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <Brain className="w-4 h-4 text-brand-orange" />
              <span>Episode Quiz (+150 XP)</span>
            </h3>
          </div>

          <div>
            {has_solved_quiz || quizResult ? (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <CheckCircle className="w-10 h-10 text-green-500 fill-green-500/10" />
                <h4 className="text-brand-orange font-black text-sm mt-3.5">Quiz solved successfully!</h4>
              </div>
            ) : quiz ? (
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-zinc-300 leading-relaxed">{quiz.question}</h4>
                <div className="flex flex-col gap-2">
                  {quiz.options.map((opt: string, idx: number) => (
                    <button
                      key={idx}
                      className={`w-full text-left p-3.5 rounded-xl border font-bold text-xs transition-all duration-200 cursor-pointer active:scale-99 ${
                        quizAnswer === idx 
                          ? 'border-brand-orange bg-brand-orange/5 text-brand-orange' 
                          : 'border-zinc-800 hover:border-zinc-700 bg-zinc-900/40 text-zinc-300'
                      }`}
                      onClick={() => setQuizAnswer(idx)}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
                <button
                  className="w-full bg-gradient-to-r from-brand-orange to-brand-amber text-black font-extrabold text-xs py-3 rounded-xl cursor-pointer hover:shadow-orange-intense active:scale-95 transition-all shadow-orange-glow disabled:opacity-50"
                  onClick={() => handleQuizSubmit(quiz.id)}
                  disabled={quizAnswer === null}
                >
                  Submit Answer
                </button>
              </div>
            ) : (
              <p className="text-xs text-zinc-500 font-semibold py-8 text-center">No quiz available for this episode.</p>
            )}
          </div>
        </div>
      </section>

      {/* Discussions / Comments panel */}
      <section className="comments-panel space-y-4 pt-6">
        <div 
          onClick={() => setCommentsExpanded(prev => !prev)}
          className="flex justify-between items-center cursor-pointer select-none group"
        >
          <span className="flex items-center gap-2.5 text-lg font-black text-white">
            <MessageCircle className="w-5 h-5 text-brand-orange" />
            <span>Discussions & Posts ({comments.length})</span>
          </span>
          <ChevronDown className={`w-5 h-5 text-zinc-500 group-hover:text-zinc-300 transition-transform duration-300 ${commentsExpanded ? 'rotate-0' : '-rotate-90'}`} />
        </div>

        <AnimatePresence>
          {commentsExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4 overflow-hidden"
            >
              {user ? (
                <div className="glass-card p-5 relative border border-zinc-900/60 flex flex-col gap-3">
                  <textarea
                    id="episode-comment-input"
                    className="w-full bg-zinc-900/60 border border-zinc-800 focus:border-brand-orange focus:ring-1 focus:ring-brand-orange/30 text-white rounded-xl p-3.5 text-xs font-semibold placeholder-zinc-500 outline-none transition-all duration-200 resize-none min-h-[50px] maxHeight-[120px]"
                    placeholder={replyingToComment ? `Reply to @${replyingToComment.username}...` : "Add your medical insight here..."}
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
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        if (commentInput.trim()) {
                          handleEpisodeInteract('comment', commentInput, replyingToComment?.id);
                        }
                      }
                    }}
                    rows={1}
                  />

                  {mentionSearchText !== null && usernames.length > 0 && (
                    <div className="absolute bottom-[calc(100%+8px)] left-0 right-0 max-h-[140px] overflow-y-auto z-[90] bg-zinc-950 border border-zinc-850 rounded-xl p-1 shadow-2xl backdrop-blur-md">
                      {usernames
                        .filter(u => u.username.toLowerCase().startsWith(mentionSearchText.toLowerCase()) && u.username !== user.username)
                        .map(u => (
                          <div 
                            key={u.username} 
                            onClick={() => {
                              const cursor = commentInput.length;
                              const before = commentInput.slice(0, cursor);
                              const after = commentInput.slice(cursor);
                              const replacedBefore = before.replace(/@\w*$/, `@${u.username} `);
                              setCommentInput(replacedBefore + after);
                              setMentionSearchText(null);
                              document.getElementById('episode-comment-input')?.focus();
                            }}
                            className="flex items-center gap-2.5 p-2 hover:bg-brand-orange/10 cursor-pointer rounded-lg text-left text-xs font-bold text-white transition-colors"
                          >
                            <UserAvatar username={u.username} avatarUrl={u.avatar_url} equippedFrame={u.equipped_frame} size={20} />
                            <span>@{u.username}</span>
                          </div>
                        ))
                      }
                    </div>
                  )}

                  <div className="flex justify-end gap-2 items-center">
                    {replyingToComment && (
                      <button className="border border-zinc-800 hover:bg-zinc-900 text-zinc-300 font-bold text-[10px] py-2 px-4 rounded-xl cursor-pointer transition-all" onClick={() => setReplyingToComment(null)}>Cancel</button>
                    )}
                    <button 
                      className="bg-gradient-to-r from-brand-orange to-brand-amber text-black font-extrabold text-[10px] py-2 px-4 rounded-xl cursor-pointer hover:opacity-90 active:scale-95 transition-all shadow-md disabled:opacity-50"
                      onClick={() => {
                        handleEpisodeInteract('comment', commentInput, replyingToComment?.id);
                        setMentionSearchText(null);
                        const el = document.getElementById('episode-comment-input');
                        if (el) el.style.height = 'auto';
                      }} 
                      disabled={!commentInput.trim() || episodeInteracting}
                    >
                      {episodeInteracting ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        replyingToComment ? 'Reply' : 'Post'
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-zinc-500 text-xs md:text-sm font-semibold py-6 text-center">
                  Please login to participate in discussions.
                </p>
              )}

              <div className="space-y-4 pt-2">
                {comments.length === 0 ? (
                  <p className="text-zinc-500 text-xs md:text-sm font-medium py-10 text-center">
                    No posts yet. Start the discussion above!
                  </p>
                ) : (
                  comments.map((c: any) => (
                    <div 
                      key={c.id} 
                      className="glass-card p-5 text-left border border-zinc-900/60 relative group/comment"
                      onContextMenu={(e) => {
                        if (user && (c.user_id === user.id || c.username === user.username || user.role === 'admin' || user.role === 'owner')) {
                          e.preventDefault();
                          setContextMenu({ x: e.clientX, y: e.clientY, commentId: c.id, content: c.content, isOwner: c.user_id === user.id || c.username === user.username });
                        }
                      }}
                    >
                      <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center gap-3">
                          <UserAvatar 
                            username={c.username} 
                            avatarUrl={c.avatar_url} 
                            equippedFrame={c.equipped_frame} 
                            size={32} 
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-sm text-brand-orange">@{c.username}</span>
                              {user && ((user.role === 'admin' || user.role === 'owner') && c.user_id !== user.id) && (
                                <button 
                                  onClick={() => handleOpenModerationModal(c.username, c.user_id)}
                                  className="text-[9px] font-black bg-zinc-900/80 hover:bg-zinc-800 text-brand-orange border border-zinc-850 px-2 py-0.5 rounded-md flex items-center gap-1 transition-colors cursor-pointer"
                                >
                                  <ShieldAlert className="w-3 h-3" /> 
                                  <span>Moderate</span>
                                </button>
                              )}
                            </div>
                            <span className="text-[10px] text-zinc-500 font-semibold block mt-0.5">
                              {new Date(c.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                        
                        {user && (c.user_id === user.id || user.role === 'admin' || user.role === 'owner') && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setContextMenu({ x: e.clientX, y: e.clientY, commentId: c.id, content: c.content, isOwner: c.user_id === user.id || c.username === user.username });
                            }}
                            className="text-zinc-500 hover:text-white cursor-pointer opacity-0 group-hover/comment:opacity-100 transition-opacity"
                            title="More Options"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {editingCommentId === c.id ? (
                        <div className="my-3 space-y-2">
                          <textarea
                            className="w-full bg-zinc-950 border border-zinc-800 focus:border-brand-orange text-white rounded-xl p-3 text-xs outline-none resize-none"
                            value={editCommentText}
                            onChange={(e) => setEditCommentText(e.target.value)}
                            rows={3}
                            autoFocus
                          />
                          <div className="flex justify-end gap-1.5">
                            <button className="border border-zinc-800 hover:bg-zinc-900 text-zinc-300 font-bold text-[9px] py-1.5 px-3 rounded-lg cursor-pointer transition-all" onClick={() => setEditingCommentId(null)}>Cancel</button>
                            <button 
                              className="bg-brand-orange text-black font-extrabold text-[9px] py-1.5 px-3 rounded-lg cursor-pointer transition-all shadow-md"
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
                        <p className="text-xs md:text-sm text-zinc-100 font-medium leading-relaxed">{renderTextWithMentions(c.content)}</p>
                      )}
                      
                      <div className="flex gap-4 mt-4 pt-2 border-t border-zinc-900/40">
                        <button 
                          className={`flex items-center gap-1.5 text-xs font-bold transition-colors cursor-pointer ${c.has_liked ? 'text-brand-orange' : 'text-zinc-500 hover:text-zinc-300'}`}
                          onClick={() => handleEpisodeInteract('comment_like', undefined, c.id)}
                        >
                          <Heart className={`w-3.5 h-3.5 ${c.has_liked ? 'fill-current' : ''}`} /> 
                          <span>{c.likes_count}</span>
                        </button>
                        {user && (
                          <button 
                            className="flex items-center gap-1.5 text-xs font-bold text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer" 
                            onClick={() => setReplyingToComment(c)}
                          >
                            <CornerUpLeft className="w-3.5 h-3.5" /> 
                            <span>Reply</span>
                          </button>
                        )}
                      </div>

                      {/* Nested replies list */}
                      {c.replies && c.replies.length > 0 && (
                        <div className="border-l-2 border-zinc-850 pl-4 ml-4 mt-4 space-y-4">
                          {c.replies.map((r: any) => (
                            <div key={r.id} className="bg-zinc-900/20 rounded-xl p-3 border border-zinc-900/40 relative group/reply">
                              <div className="flex justify-between items-center mb-2">
                                <div className="flex items-center gap-2">
                                  <UserAvatar 
                                    username={r.username} 
                                    avatarUrl={r.avatar_url} 
                                    equippedFrame={r.equipped_frame} 
                                    size={24} 
                                  />
                                  <span className="text-xs font-extrabold text-zinc-400">@{r.username}</span>
                                  {user && ((user.role === 'admin' || user.role === 'owner') && r.user_id !== user.id) && (
                                    <button 
                                      onClick={() => handleOpenModerationModal(r.username, r.user_id)}
                                      className="text-[8px] font-black bg-zinc-950 hover:bg-zinc-900 text-brand-orange border border-zinc-850 px-1.5 py-0.5 rounded-md flex items-center gap-0.5 transition-colors cursor-pointer"
                                    >
                                      <ShieldAlert className="w-2.5 h-2.5" /> 
                                      <span>Moderate</span>
                                    </button>
                                  )}
                                </div>
                                <div className="flex items-center gap-3.5">
                                  <span className="text-[9px] text-zinc-500 font-semibold">
                                    {new Date(r.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                                  </span>
                                  {user && (r.user_id === user.id || r.username === user.username || user.role === 'admin' || user.role === 'owner') && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setContextMenu({ x: e.clientX, y: e.clientY, commentId: r.id, content: r.content, isOwner: r.user_id === user.id || r.username === user.username });
                                      }}
                                      className="text-zinc-600 hover:text-white cursor-pointer opacity-0 group-hover/reply:opacity-100 transition-opacity"
                                      title="More Options"
                                    >
                                      <MoreVertical className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </div>

                              {editingCommentId === r.id ? (
                                <div className="my-2 space-y-2">
                                  <textarea
                                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-brand-orange text-white rounded-lg p-2.5 text-xs outline-none resize-none"
                                    value={editCommentText}
                                    onChange={(e) => setEditCommentText(e.target.value)}
                                    rows={2}
                                    autoFocus
                                  />
                                  <div className="flex justify-end gap-1.5">
                                    <button className="border border-zinc-800 text-white text-[8px] py-1 px-2.5 rounded-md cursor-pointer" onClick={() => setEditingCommentId(null)}>Cancel</button>
                                    <button 
                                      className="bg-brand-orange text-black font-extrabold text-[8px] py-1 px-2.5 rounded-md cursor-pointer"
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
                                <p className="text-xs text-zinc-300 font-medium leading-relaxed">{renderTextWithMentions(r.content)}</p>
                              )}

                              <button 
                                className={`flex items-center gap-1 mt-3 text-[10px] font-bold transition-colors cursor-pointer ${r.has_liked ? 'text-brand-orange' : 'text-zinc-500 hover:text-zinc-300'}`}
                                onClick={() => handleEpisodeInteract('comment_like', undefined, r.id)}
                              >
                                <Heart className={`w-3 h-3 ${r.has_liked ? 'fill-current' : ''}`} /> 
                                <span>{r.likes_count}</span>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
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
              className="bg-zinc-950 border border-zinc-800 rounded-xl p-1.5 flex flex-col gap-0.5 min-w-[130px] shadow-2xl z-[1000]"
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
                  handleDeleteComment(contextMenu.commentId);
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
              onClick={() => {
                if (editCommentText.trim()) {
                  handleEditComment(editingCommentId, editCommentText.trim());
                  setEditingCommentId(null);
                  setEditCommentText('');
                }
              }}
              disabled={!editCommentText.trim()}
            >
              Save
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
