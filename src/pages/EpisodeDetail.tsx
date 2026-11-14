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
import { episodeNumber, seasonName } from '../utils/episode';
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
  handleOpenReportModal?: (type: 'post' | 'comment' | 'message', id: number, preview?: string, commentKind?: 'post_comment' | 'episode_comment') => void;
  /** Opens the shared comments sheet (same one posts use) for this episode. */
  onOpenComments?: (episodeId: number, episodeTitle?: string) => void;
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
  handleOpenReportModal,
  onOpenComments
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
  const totalComments = comments.reduce((acc: number, c: any) => acc + 1 + (c.replies?.length || 0), 0);
  const previewComments = [...comments].slice(-2).reverse();
  const openComments = () => onOpenComments?.(episode.id, episode.title_ar);

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
          <span className="self-start inline-flex items-center rounded-lg overflow-hidden text-2xs font-black border border-white/10 bg-black/50">
            <span className="px-2.5 py-1 text-zinc-300">{seasonName(Number(episode.season) || 1)}</span>
            <span className="px-2.5 py-1 bg-brand-orange text-black">الحلقة {episodeNumber(episode)}</span>
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
              onClick={openComments}
            >
              <MessageCircle className="w-4 h-4" /> 
              <span>{totalComments} تعليق</span>
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
          <YouTubeFacade embedUrl={embedUrl} title={episode.title_ar || `الحلقة ${episodeNumber(episode)}`} thumbnail={episode.thumbnail_url} start={seekTo} />
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

      {/* Discussion — opens the same comments sheet used on posts */}
      <section className="comments-panel pt-2">
        <div
          role="button"
          tabIndex={0}
          onClick={openComments}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openComments(); } }}
          className="glass-card p-4 md:p-5 border border-zinc-800/60 hover:border-brand-orange/30 transition-colors cursor-pointer group space-y-3"
        >
          <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2.5">
              <span className="w-9 h-9 rounded-xl bg-brand-orange/15 border border-brand-orange/20 flex items-center justify-center text-brand-orange">
                <MessageCircle className="w-[18px] h-[18px]" />
              </span>
              <span>
                <span className="block text-base font-black text-white leading-tight">النقاش</span>
                <span className="block text-2xs text-zinc-500 font-semibold">
                  {totalComments > 0 ? `${totalComments} تعليق ورد` : 'مفيش تعليقات لسه — ابدأ إنت'}
                </span>
              </span>
            </span>
            <span className="bg-brand-orange/15 group-hover:bg-brand-orange/25 border border-brand-orange/30 text-brand-orange font-black text-xs px-4 py-2 rounded-xl transition-all group-active:scale-95 whitespace-nowrap">
              افتح التعليقات 💬
            </span>
          </div>

          {previewComments.length > 0 && (
            <div className="space-y-2 pt-1">
              {previewComments.map((c: any) => (
                <div key={c.id} className="flex items-start gap-2.5">
                  <UserAvatar username={c.username} avatarUrl={c.avatar_url} equippedFrame={c.equipped_frame} size={26} />
                  <div className="flex-1 min-w-0 bg-zinc-900/60 border border-zinc-800/60 rounded-2xl px-3 py-2">
                    <span className="text-2xs font-black text-white">{c.username}</span>
                    <p dir={textDir(c.content)} className="text-xs text-zinc-300 font-medium leading-relaxed line-clamp-2 break-words">
                      {renderTextWithMentions(c.content)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!user && (
            <p className="text-2xs text-zinc-500 font-semibold text-center pt-1">سجّل دخول عشان تشارك في النقاش.</p>
          )}
        </div>
      </section>
    </div>
  );
};
