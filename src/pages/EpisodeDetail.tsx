import React, { useState, useEffect } from 'react';
import { textDir } from '../utils/format';
import { EpisodeNotes } from '../components/common/EpisodeNotes';
import { YouTubeFacade } from '../components/common/YouTubeFacade';
import { Thumb } from '../components/common/Thumb';
import { m, AnimatePresence } from 'framer-motion';
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
  AlertCircle,
  AlertTriangle
} from 'lucide-react';
import { formatMentions } from '../utils/mentions';
import { HighlightWrapper } from '../components/notifications/HighlightWrapper';
import { useNotifications } from '../context/NotificationContext';

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
  handleRedeem: (e: React.FormEvent, episodeId?: number) => void;
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
  handleOpenReportModal?: (type: 'post' | 'comment' | 'message', id: number, preview?: string) => void;
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
  usernames = [],
  handleOpenReportModal
}) => {
  const [mentionSearchText, setMentionSearchText] = useState<string | null>(null);
  const [commentsExpanded, setCommentsExpanded] = useState(true);
  const [seekTo, setSeekTo] = useState<number | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editCommentText, setEditCommentText] = useState('');
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; commentId: number; content: string; isOwner: boolean; commentUserId?: number; commentUsername?: string } | null>(null);
  const [activeSuggestionIdx, setActiveSuggestionIdx] = useState(0);

  const { deepLinkTarget, setDeepLinkTarget } = useNotifications();
  const { episode, quiz, has_solved_quiz, likes_count, shares_count, has_liked, comments = [] } = episodeDetail || {};

  const getFilteredUsernames = () => {
    if (mentionSearchText === null || !usernames) return [];
    return usernames.filter(u => 
      u.username.toLowerCase().includes(mentionSearchText.toLowerCase()) && 
      u.username !== user?.username
    );
  };

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

  // Auto-scroll and highlight comment/reply from deep link Target or query param
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const commentIdStr = params.get('comment');
    const commentId = commentIdStr ? parseInt(commentIdStr, 10) : (deepLinkTarget?.type === 'episode_comment' ? deepLinkTarget.commentId : null);

    if (commentId && comments && comments.length > 0) {
      setCommentsExpanded(true);
      setTimeout(() => {
        const el = document.getElementById(`comment-${commentId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          if (deepLinkTarget) setDeepLinkTarget(null);
        }
      }, 500);
    }
  }, [comments, deepLinkTarget, setDeepLinkTarget]);

  const renderTextWithMentions = (text: string) => {
    return formatMentions(text, usernames, 'text-yellow-400 font-extrabold hover:underline cursor-pointer transition-colors');
  };

  if (episodeDetailLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-12 h-12 text-brand-orange animate-spin mb-4" />
        <p className="text-zinc-500 text-sm font-semibold">بنحمّل الحلقة…</p>
      </div>
    );
  }

  if (!episodeDetail || !episode) return null;

  const embedUrl = getYoutubeEmbedUrl(episode.youtube_url);

  return (
    <div className="space-y-6 xl:pt-6 max-w-4xl mx-auto px-4 text-start">
      <button 
        className="flex items-center gap-2 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/40 text-zinc-300 font-bold text-xs py-2.5 px-4 rounded-xl cursor-pointer active:scale-95 transition-all" 
        onClick={() => setCurrentPage('episodes')}
      >
        <ArrowLeft className="rtl:-scale-x-100 w-4 h-4" />
        <span>رجوع للحلقات</span>
      </button>

      {/* Cinematic header card */}
      <section className="glass-card overflow-hidden relative p-6 md:p-8 flex flex-col justify-end min-h-60 group">
        <div className="absolute inset-0 bg-black/60 bg-radial-gradient z-10" />
        <Thumb src={episode.thumbnail_url} width={640} eager className="opacity-40" />
        
        <div className="relative z-20 space-y-4">
          <span className="text-2xs font-black tracking-wider bg-brand-orange/20 text-brand-orange px-2.5 py-1 rounded-md uppercase border border-brand-orange/10 self-start inline-block">
            الحلقة {episode.id}
          </span>
          <div className="space-y-1">
            <h1 dir="auto" className="text-xl md:text-2xl font-black text-white leading-tight">{episode.title_ar}</h1>
          </div>

          <div className="flex gap-4 pt-2">
            <button 
              className={`flex items-center gap-1.5 text-xs font-bold transition-all ${has_liked ? 'text-brand-orange' : 'text-zinc-500 hover:text-zinc-300'}`} 
              onClick={() => handleEpisodeInteract('like')}
            >
              <Heart className={`w-4 h-4 ${has_liked ? 'fill-current' : ''}`} /> 
              <span>{likes_count} لايك</span>
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
              <span>{comments.length} تعليق</span>
            </button>
            <button 
              className="flex items-center gap-1.5 text-xs font-bold text-zinc-500 hover:text-zinc-300 transition-all" 
              onClick={() => {
                const ref = user ? user.username : '';
                const shareLink = `${window.location.origin}/episodes/${episode.id}${ref ? '?ref=' + ref : ''}`;
                copyToClipboard(shareLink);
                showToast('اتنسخ لينك المشاركة! شاركه واكسب XP لما حد يدخل منه 🔗');
              }}
            >
              <Share2 className="w-4 h-4" /> 
              <span>{shares_count} مشاركة</span>
            </button>
          </div>
        </div>
      </section>

      {/* Embedded video player */}
      {embedUrl ? (
        <section className="glass-card p-2 overflow-hidden">
          <YouTubeFacade embedUrl={embedUrl} title={episode.title_ar || `الحلقة ${episode.id}`} thumbnail={episode.thumbnail_url} start={seekTo} />
        </section>
      ) : null}

      {episode.description ? <EpisodeNotes text={episode.description} onSeek={(sec) => setSeekTo(sec)} /> : null}

      {/* Code redeem & quiz widgets */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Code redeem card */}
        <div className="glass-card p-5 text-start flex flex-col justify-between gap-4">
          <div>
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <Key className="w-4 h-4 text-brand-orange" />
              <span>الكود السري للحلقة</span>
            </h3>
            <p className="text-2xs text-zinc-500 font-semibold mt-1">اكتب الكود السري اللي ظهر في الحلقة واكسب XP.</p>
          </div>

          <form onSubmit={(e) => handleRedeem(e, episode?.id)} className="space-y-3.5">
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
                placeholder="مثلًا EP1_SECRET"
                value={secretCode}
                onChange={(e) => setSecretCode(e.target.value)}
              />
              <button 
                type="submit" 
                className="w-full bg-gradient-to-r from-brand-orange to-brand-amber text-black font-extrabold text-xs py-3 rounded-xl cursor-pointer hover:shadow-orange-intense active:scale-95 transition-all shadow-orange-glow"
              >
                استخدم الكود
              </button>
            </div>
          </form>
        </div>

        {/* Quiz solver card */}
        <div className="glass-card p-5 text-start flex flex-col justify-between gap-4">
          <div>
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <Brain className="w-4 h-4 text-brand-orange" />
              <span>كويز الحلقة (+150 XP)</span>
            </h3>
          </div>

          <div>
            {has_solved_quiz || quizResult ? (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <CheckCircle className="w-10 h-10 text-green-500 fill-green-500/10" />
                <h4 className="text-brand-orange font-black text-sm mt-3.5">حليت الكويز!</h4>
              </div>
            ) : quiz ? (
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-zinc-300 leading-relaxed">{quiz.question}</h4>
                <div className="flex flex-col gap-2">
                  {quiz.options.map((opt: string, idx: number) => (
                    <button
                      key={idx}
                      className={`w-full text-start p-3.5 rounded-xl border font-bold text-xs transition-all duration-200 cursor-pointer active:scale-99 ${
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
                  ابعت الإجابة
                </button>
              </div>
            ) : (
              <p className="text-xs text-zinc-500 font-semibold py-8 text-center">مفيش كويز للحلقة دي.</p>
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
            <span>النقاش ({comments.length})</span>
          </span>
          <ChevronDown className={`w-5 h-5 text-zinc-500 group-hover:text-zinc-300 transition-transform duration-300 ${commentsExpanded ? 'rotate-0' : '-rotate-90'}`} />
        </div>

        <AnimatePresence>
          {commentsExpanded && (
            <m.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4 overflow-hidden"
            >
              {user ? (
                <div className="glass-card p-5 relative border border-zinc-900/60 flex flex-col gap-3">
                  {replyingToComment && (
                    <div className="flex items-center justify-between bg-brand-orange/5 border-s-2 border-brand-orange rounded-xl px-3 py-2 mb-1 text-xs font-bold text-brand-orange">
                      <div className="flex items-center gap-1.5">
                        <CornerUpLeft className="rtl:-scale-x-100 w-3.5 h-3.5 shrink-0" />
                        <span>بترد على <strong><bdi dir="ltr">@{replyingToComment.username}</bdi></strong></span>
                      </div>
                      <button 
                        onClick={() => setReplyingToComment(null)}
                        className="text-zinc-500 hover:text-white cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                  <textarea
                    id="episode-comment-input"
                    dir="auto"
                    autoComplete="off"
                    autoCorrect="on"
                    autoCapitalize="sentences"
                    spellCheck="true"
                    inputMode="text"
                    enterKeyHint="send"
                    data-lpignore="true"
                    data-1p-ignore="true"
                    data-bwignore="true"
                    data-form-type="other"
                    className="w-full bg-zinc-900/60 border border-zinc-800 focus:border-brand-orange focus:ring-1 focus:ring-brand-orange/30 text-white rounded-xl p-3.5 text-xs font-semibold placeholder-zinc-500 outline-none transition-all duration-200 resize-none min-h-[50px] maxHeight-[120px]"
                    placeholder={replyingToComment ? `Reply to @${replyingToComment.username}...` : "اكتب تعليقك أو معلومة طبية هنا…"}
                    value={commentInput}
                    onChange={(e) => {
                      const text = e.target.value;
                      setCommentInput(text);
                      
                      const cursor = e.target.selectionStart || 0;
                      const textBeforeCursor = text.slice(0, cursor);
                      const match = textBeforeCursor.match(/@(\w*)$/);
                      if (match) {
                        setMentionSearchText(match[1]);
                        setActiveSuggestionIdx(0);
                      } else {
                        setMentionSearchText(null);
                      }
                    }}
                    onKeyDown={(e) => {
                      const suggestionsList = getFilteredUsernames();
                      const hasSuggestions = suggestionsList.length > 0;

                      if (hasSuggestions) {
                        if (e.key === 'ArrowDown') {
                          e.preventDefault();
                          setActiveSuggestionIdx(prev => (prev + 1) % suggestionsList.length);
                          return;
                        }
                        if (e.key === 'ArrowUp') {
                          e.preventDefault();
                          setActiveSuggestionIdx(prev => (prev - 1 + suggestionsList.length) % suggestionsList.length);
                          return;
                        }
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const selectedUser = suggestionsList[activeSuggestionIdx];
                          if (selectedUser) {
                            const cursor = commentInput.length;
                            const before = commentInput.slice(0, cursor);
                            const after = commentInput.slice(cursor);
                            const replacedBefore = before.replace(/@\w*$/, `@${selectedUser.username} `);
                            setCommentInput(replacedBefore + after);
                            setMentionSearchText(null);
                            document.getElementById('episode-comment-input')?.focus();
                          }
                          return;
                        }
                        if (e.key === 'Escape') {
                          e.preventDefault();
                          setMentionSearchText(null);
                          return;
                        }
                      }

                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        if (commentInput.trim()) {
                          handleEpisodeInteract('comment', commentInput, replyingToComment?.id);
                        }
                      }
                    }}
                    rows={1}
                  />

                  {mentionSearchText !== null && usernames.length > 0 && (() => {
                    const suggestionsList = getFilteredUsernames();
                    if (suggestionsList.length === 0) return null;
                    return (
                      <div className="absolute bottom-[calc(100%+8px)] start-0 end-0 max-h-[140px] overflow-y-auto z-[90] bg-zinc-950 border border-zinc-850 rounded-xl p-1 shadow-2xl">
                        {suggestionsList.map((u, idx) => (
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
                            onMouseEnter={() => setActiveSuggestionIdx(idx)}
                            className={`flex items-center gap-2.5 p-2 cursor-pointer rounded-lg text-start text-xs font-bold transition-colors ${
                              idx === activeSuggestionIdx ? 'bg-brand-orange text-black font-extrabold' : 'hover:bg-brand-orange/10 text-white'
                            }`}
                          >
                            <UserAvatar username={u.username} avatarUrl={u.avatar_url} equippedFrame={u.equipped_frame} size={20} />
                            <span><bdi dir="ltr">@{u.username}</bdi></span>
                          </div>
                        ))}
                      </div>
                    );
                  })()}

                  <div className="flex justify-end gap-2 items-center">
                    <div className="flex gap-2 items-center">
                      {replyingToComment && (
                        <button className="border border-zinc-800 hover:bg-zinc-900 text-zinc-300 font-bold text-2xs py-2 px-4 rounded-xl cursor-pointer transition-all" onClick={() => setReplyingToComment(null)}>إلغاء</button>
                      )}
                      <button 
                        className="bg-gradient-to-r from-brand-orange to-brand-amber text-black font-extrabold text-2xs py-2 px-4 rounded-xl cursor-pointer hover:opacity-90 active:scale-95 transition-all shadow-md disabled:opacity-50"
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
                          replyingToComment ? 'رد' : 'انشر'
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-zinc-500 text-xs md:text-sm font-semibold py-6 text-center">
                  سجّل دخول عشان تشارك في النقاش.
                </p>
              )}

              <div className="space-y-4 pt-2">
                {comments.length === 0 ? (
                  <p className="text-zinc-500 text-xs md:text-sm font-medium py-10 text-center">
                    مفيش تعليقات لسه. ابدأ إنت النقاش!
                  </p>
                ) : (
                  comments.map((c: any) => {
                    const isCommentHighlighted = (deepLinkTarget?.type === 'episode_comment' && deepLinkTarget?.commentId === c.id) ||
                                                 new URLSearchParams(window.location.search).get('comment') === String(c.id);
                    return (
                      <HighlightWrapper
                        key={c.id}
                        isHighlighted={isCommentHighlighted}
                        className="w-full"
                      >
                        <div 
                          id={`comment-${c.id}`}
                          className="glass-card p-5 text-start border border-zinc-900/60 relative group/comment"
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
                                  <span className="font-extrabold text-sm text-brand-orange"><bdi dir="ltr">@{c.username}</bdi></span>
                                  {user && ((user.role === 'admin' || user.role === 'owner') && c.user_id !== user.id) && (
                                    <button 
                                      onClick={() => handleOpenModerationModal(c.username, c.user_id)}
                                      className="text-2xs font-black bg-zinc-900/80 hover:bg-zinc-800 text-brand-orange border border-zinc-850 px-2 py-0.5 rounded-md flex items-center gap-1 transition-colors cursor-pointer"
                                    >
                                      <ShieldAlert className="w-3 h-3" /> 
                                      <span>إجراء</span>
                                    </button>
                                  )}
                                </div>
                                <span className="text-2xs text-zinc-500 font-semibold block mt-0.5">
                                  {new Date(c.created_at).toLocaleString('ar-EG-u-nu-latn', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                                </span>
                              </div>
                            </div>
                            
                            {user && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const rect = e.currentTarget.getBoundingClientRect();
                                  setContextMenu({ 
                                    x: rect.left, 
                                    y: rect.bottom + 4, 
                                    commentId: c.id, 
                                    content: c.content, 
                                    isOwner: c.user_id === user.id || c.username === user.username,
                                    commentUserId: c.user_id,
                                    commentUsername: c.username
                                  });
                                }}
                                className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800/60 cursor-pointer transition-colors"
                                title="خيارات التعليق"
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
                                <button className="border border-zinc-800 hover:bg-zinc-900 text-zinc-300 font-bold text-2xs py-1.5 px-3 rounded-lg cursor-pointer transition-all" onClick={() => setEditingCommentId(null)}>إلغاء</button>
                                <button 
                                  className="bg-brand-orange text-black font-extrabold text-2xs py-1.5 px-3 rounded-lg cursor-pointer transition-all shadow-md"
                                  onClick={() => {
                                    if (editCommentText.trim()) {
                                      handleEditComment(c.id, editCommentText.trim());
                                      setEditingCommentId(null);
                                    }
                                  }}
                                  disabled={!editCommentText.trim()}
                                >
                                  حفظ
                                </button>
                              </div>
                            </div>
                          ) : (
                            <p dir={textDir(c.content)} className="text-xs md:text-sm text-zinc-100 font-medium leading-relaxed">{renderTextWithMentions(c.content)}</p>
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
                                <CornerUpLeft className="rtl:-scale-x-100 w-3.5 h-3.5" /> 
                                <span>رد</span>
                              </button>
                            )}
                          </div>

                          {/* Nested replies list */}
                          {c.replies && c.replies.length > 0 && (
                            <div className="border-s-2 border-zinc-850 ps-4 ms-4 mt-4 space-y-4">
                              {c.replies.map((r: any) => {
                                const isReplyHighlighted = (deepLinkTarget?.type === 'episode_comment' && deepLinkTarget?.commentId === r.id) ||
                                                           new URLSearchParams(window.location.search).get('comment') === String(r.id);
                                return (
                                  <HighlightWrapper
                                    key={r.id}
                                    isHighlighted={isReplyHighlighted}
                                    className="w-full"
                                  >
                                    <div id={`comment-${r.id}`} className="bg-zinc-900/20 rounded-xl p-3 border border-zinc-900/40 relative group/reply text-start">
                                      <div className="flex justify-between items-center mb-2">
                                        <div className="flex items-center gap-2">
                                          <UserAvatar 
                                            username={r.username} 
                                            avatarUrl={r.avatar_url} 
                                            equippedFrame={r.equipped_frame} 
                                            size={24} 
                                          />
                                          <span className="text-xs font-extrabold text-zinc-400"><bdi dir="ltr">@{r.username}</bdi></span>
                                          {user && ((user.role === 'admin' || user.role === 'owner') && r.user_id !== user.id) && (
                                            <button 
                                              onClick={() => handleOpenModerationModal(r.username, r.user_id)}
                                              className="text-2xs font-black bg-zinc-950 hover:bg-zinc-900 text-brand-orange border border-zinc-850 px-1.5 py-0.5 rounded-md flex items-center gap-0.5 transition-colors cursor-pointer"
                                            >
                                              <ShieldAlert className="w-2.5 h-2.5" /> 
                                              <span>إجراء</span>
                                            </button>
                                          )}
                                        </div>
                                        <div className="flex items-center gap-3.5">
                                          <span className="text-2xs text-zinc-500 font-semibold">
                                            {new Date(r.created_at).toLocaleString('ar-EG-u-nu-latn', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                                          </span>
                                          {user && (
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                const rect = e.currentTarget.getBoundingClientRect();
                                                setContextMenu({ 
                                                  x: rect.left, 
                                                  y: rect.bottom + 4, 
                                                  commentId: r.id, 
                                                  content: r.content, 
                                                  isOwner: r.user_id === user.id || r.username === user.username,
                                                  commentUserId: r.user_id,
                                                  commentUsername: r.username
                                                });
                                              }}
                                              className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800/60 cursor-pointer transition-colors"
                                              title="خيارات الرد"
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
                                            <button className="border border-zinc-800 text-white text-2xs py-1 px-2.5 rounded-md cursor-pointer" onClick={() => setEditingCommentId(null)}>إلغاء</button>
                                            <button 
                                              className="bg-brand-orange text-black font-extrabold text-2xs py-1 px-2.5 rounded-md cursor-pointer"
                                              onClick={() => {
                                                if (editCommentText.trim()) {
                                                  handleEditComment(r.id, editCommentText.trim());
                                                  setEditingCommentId(null);
                                                }
                                              }}
                                              disabled={!editCommentText.trim()}
                                            >
                                              حفظ
                                            </button>
                                          </div>
                                        </div>
                                      ) : (
                                        <p dir={textDir(r.content)} className="text-xs text-zinc-300 font-medium leading-relaxed">{renderTextWithMentions(r.content)}</p>
                                      )}

                                      <button 
                                        className={`flex items-center gap-1 mt-3 text-2xs font-bold transition-colors cursor-pointer ${r.has_liked ? 'text-brand-orange' : 'text-zinc-500 hover:text-zinc-300'}`}
                                        onClick={() => handleEpisodeInteract('comment_like', undefined, r.id)}
                                      >
                                        <Heart className={`w-3 h-3 ${r.has_liked ? 'fill-current' : ''}`} /> 
                                        <span>{r.likes_count}</span>
                                      </button>
                                    </div>
                                  </HighlightWrapper>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </HighlightWrapper>
                    );
                  })
                )}
              </div>
            </m.div>
          )}
        </AnimatePresence>
      </section>

      {/* Context Menu for comments */}
      <AnimatePresence>
        {contextMenu && (
          <div className="fixed inset-0 z-[999] bg-black/30" onClick={() => setContextMenu(null)}>
            <m.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              style={{
                position: 'fixed',
                top: Math.min(contextMenu.y, typeof window !== 'undefined' ? window.innerHeight - 140 : contextMenu.y),
                left: Math.max(12, Math.min(contextMenu.x - 110, typeof window !== 'undefined' ? window.innerWidth - 160 : contextMenu.x)),
              }}
              className="bg-zinc-950 border border-zinc-800/90 rounded-2xl p-1.5 flex flex-col gap-0.5 min-w-[150px] shadow-2xl z-[1000]"
              onClick={(e) => e.stopPropagation()}
            >
              {user && (contextMenu.isOwner || user.role === 'moderator' || user.role === 'admin' || user.role === 'owner') ? (
                <>
                  <button
                    onClick={() => {
                      setEditingCommentId(contextMenu.commentId);
                      setEditCommentText(contextMenu.content);
                      setContextMenu(null);
                    }}
                    className="w-full flex items-center gap-2 p-2.5 font-bold text-xs text-white rounded-lg cursor-pointer hover:bg-zinc-900/60 text-start transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-zinc-500" />
                    <span>تعديل التعليق</span>
                  </button>
                  <button
                    onClick={() => {
                      handleDeleteComment(contextMenu.commentId);
                      setContextMenu(null);
                    }}
                    className="w-full flex items-center gap-2 p-2.5 font-bold text-xs text-red-500 rounded-lg cursor-pointer hover:bg-zinc-900/60 text-start transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-500" />
                    <span>حذف التعليق</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    handleOpenReportModal && handleOpenReportModal('comment', contextMenu.commentId, contextMenu.content);
                    setContextMenu(null);
                  }}
                  className="w-full flex items-center gap-2 p-2.5 font-bold text-xs text-amber-500 rounded-lg cursor-pointer hover:bg-zinc-900/60 text-start transition-colors"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                  <span>إبلاغ عن التعليق</span>
                </button>
              )}
            </m.div>
          </div>
        )}
      </AnimatePresence>

      {/* Bottom inline edit form overlay */}
      <AnimatePresence>
        {editingCommentId && (
          <m.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-0 start-0 end-0 bg-zinc-950 border-t border-zinc-850 p-4 z-[9000] shadow-2xl flex gap-2.5 items-end"
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
              إلغاء
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
              حفظ
            </button>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
};
