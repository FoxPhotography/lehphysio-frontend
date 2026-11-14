import React, { useEffect } from 'react';
import { Thumb } from '../components/common/Thumb';
import { cld } from '../utils/image';
import { HighlightWrapper } from '../components/notifications/HighlightWrapper';
import { useNotifications } from '../context/NotificationContext';
import { StreakChip } from '../components/streak/Streak';
import { m } from 'framer-motion';
import { 
  Gift, 
  Play, 
  Flame, 
  ChevronLeft, 
  MessageSquare, 
  ListVideo, 
  Zap,
  Megaphone,
} from 'lucide-react';
import { episodeLabel } from '../utils/episode';

// Subcomponents
import { StatsGrid } from '../components/home/StatsGrid';
import { QuickActions } from '../components/home/QuickActions';
import { PodiumPreview } from '../components/home/PodiumPreview';
import { PostComposer } from '../components/home/PostComposer';
import { PostCard } from '../components/home/PostCard';

interface HomeProps {
  user: any;
  loginReward: any;
  navigateToEpisode: (id: number) => void;
  setCurrentPage: (page: string) => void;
  setCommunityTab: (tab: 'feed' | 'chat') => void;
  dailyQuestion?: any;
  handleAnswerQuestion?: (questionId: number, selectedAnswer: number) => Promise<void>;
  newPostContent: string;
  setNewPostContent: (content: string) => void;
  handleCreatePost: (title: string, content: string, imageUrl: string) => Promise<void>;
  handleEditPost: (id: number, content: string, imageUrl: string) => Promise<void>;
  communityPosts: any[];
  handleLikePost: (id: number) => void;
  handleDeletePost: (id: number) => void;
  handleCancelPostRevision: (id: number) => void;
  handleSharePost: (id: number) => void;
  handleUploadImage: (file: File) => Promise<string | null>;
  usernames?: any[];
  showToast: (msg: string) => void;
  leaderboard?: any[];
  equippedFrame?: string;
  episodes?: any[];
  triggerXpPopup?: (amount: number) => void;
  xpSettings?: any;
  newsPosts: any[];
  loadOlderPosts?: (beforeId: string) => void;
  isLoadingOlderPosts?: boolean;
  hasMorePosts?: boolean;
  isRefreshingFeed?: boolean;
  handleOpenReportModal?: (type: 'post' | 'comment' | 'message', id: number, preview?: string) => void;
  onOpenComments?: (postId: number, authorName?: string) => void;
}

export const Home: React.FC<HomeProps> = ({
  user,
  loginReward,
  navigateToEpisode,
  setCurrentPage,
  setCommunityTab,
  dailyQuestion,
  handleAnswerQuestion,
  newPostContent,
  setNewPostContent,
  handleCreatePost,
  handleEditPost,
  communityPosts,
  handleLikePost,
  handleDeletePost,
  handleCancelPostRevision,
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
  hasMorePosts = true,
  isRefreshingFeed = false,
  handleOpenReportModal,
  onOpenComments,
}) => {
  const activeStreak = user?.streak_count || 0;
  const { deepLinkTarget, setDeepLinkTarget } = useNotifications();

  // Infinite Scroll Effect
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

  // Deep Links initialization
  useEffect(() => {
    const path = window.location.pathname;
    const params = new URLSearchParams(window.location.search);
    const commentIdStr = params.get('comment');
    const hashCommentMatch = window.location.hash.match(/#comment-(\d+)/);
    const commentId = commentIdStr ? parseInt(commentIdStr, 10) : (hashCommentMatch ? parseInt(hashCommentMatch[1], 10) : null);

    if ((path.startsWith('/post/') || path.startsWith('/posts/')) && !deepLinkTarget) {
      const parts = path.split('/');
      const postIdStr = parts[parts.length - 1];
      const postId = parseInt(postIdStr, 10);
      if (!isNaN(postId)) {
        if (commentId) {
          setDeepLinkTarget({ type: 'comment', targetId: commentId, postId, commentId });
        } else {
          setDeepLinkTarget({ type: 'post', targetId: postId, postId });
        }
      }
    }
  }, []);

  // Deep Link scrolling logic (handling post types, comments expansion is handled by PostCard)
  useEffect(() => {
    if (!deepLinkTarget) return;

    if (deepLinkTarget.type === 'post' && communityPosts.length > 0) {
      const { postId } = deepLinkTarget;
      if (postId) {
        setTimeout(() => {
          const el = document.getElementById(`post-${postId}`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.classList.add('notification-highlight');
            setTimeout(() => {
              el.classList.remove('notification-highlight');
            }, 3000);
            setDeepLinkTarget(null);
            window.history.replaceState({}, '', '/');
          }
        }, 300);
      }
    }
  }, [deepLinkTarget, communityPosts]);

  return (
    <div className="space-y-10 xl:pt-6 max-w-4xl mx-auto px-4">
      {/* Banner alerts */}
      {loginReward && loginReward.daily_login && (
        <m.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 px-5 py-4 bg-brand-orange/10 border border-brand-orange/20 text-white rounded-2xl shadow-ambient"
        >
          <Gift className="w-5 h-5 text-brand-orange shrink-0" />
          <span className="text-sm font-bold">
            أهلًا بيك تاني! كسبت <strong className="text-brand-orange" dir="ltr">+{xpSettings.daily_login || 10} XP</strong> عشان دخلت النهارده.
          </span>
        </m.div>
      )}

      {/* Hero podcast card - latest episode */}
      <section className="glass-card p-6 md:p-8 hover:border-brand-orange/30 group relative overflow-hidden">
        {(() => {
          const sorted = [...episodes].sort((a: any, b: any) => b.id - a.id);
          const latestEp = sorted.length > 0 ? sorted[0] : null;
          return latestEp ? (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 md:gap-8 items-center relative z-10">
              <div className="md:col-span-2 aspect-[16/9] w-full rounded-2xl bg-zinc-900 relative shadow-2xl overflow-hidden border border-zinc-800/40">
                <Thumb src={latestEp.thumbnail_url} width={480} eager className="group-hover:scale-[1.02] transition-transform duration-500" />
                <span className="absolute bottom-3 end-3 w-11 h-11 rounded-full bg-brand-orange text-black flex items-center justify-center shadow-lg z-10" aria-hidden>
                  <Play className="w-5 h-5 fill-current ms-0.5" />
                </span>
              </div>
              <div className="md:col-span-3 flex flex-col gap-4 text-start">
                <div className="flex gap-2">
                  <span className="text-2xs font-black tracking-wider bg-brand-orange/20 text-brand-orange px-2.5 py-1 rounded-md uppercase">
                    حلقة جديدة
                  </span>
                  <span className="text-2xs font-bold tracking-wider bg-zinc-800 text-zinc-300 px-2.5 py-1 rounded-md uppercase">
                    {episodeLabel(latestEp)}
                  </span>
                </div>
                <h2 className="text-xl md:text-2xl font-black text-white leading-tight">
                  {latestEp.title_ar || 'حلقة جديدة'}
                </h2>
                <p className="text-zinc-400 text-sm font-medium line-clamp-2 leading-relaxed">
                  {latestEp.description || ''}
                </p>
                <div className="mt-2">
                  <button 
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-brand-orange to-brand-amber text-black font-extrabold text-sm px-6 py-3 rounded-full cursor-pointer hover:shadow-orange-intense hover:scale-102 active:scale-98 transition-all shadow-orange-glow" 
                    onClick={() => navigateToEpisode(latestEp.id)}
                  >
                    <Play className="w-4 h-4 fill-current" /> اتفرج دلوقتي
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 md:gap-8 items-center relative z-10">
              <div className="md:col-span-2 aspect-[16/9] w-full rounded-2xl bg-zinc-900 relative shadow-2xl overflow-hidden border border-zinc-800/40 flex items-center justify-center">
                <Thumb width={480} />
                <Play className="w-12 h-12 text-brand-orange relative z-10" />
              </div>
              <div className="md:col-span-3 flex flex-col gap-4 text-start">
                <div className="flex gap-2">
                  <span className="text-2xs font-black tracking-wider bg-brand-orange/20 text-brand-orange px-2.5 py-1 rounded-md uppercase">
                    البودكاست
                  </span>
                </div>
                <h2 className="text-xl md:text-2xl font-black text-white leading-tight">
                  Leh Physio?
                </h2>
                <p className="text-zinc-400 text-sm font-medium leading-relaxed">
                  اسمع. اتعلم. علّي مستواك.
                </p>
                <div className="mt-2">
                  <button 
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-brand-orange to-brand-amber text-black font-extrabold text-sm px-6 py-3 rounded-full cursor-pointer hover:shadow-orange-intense hover:scale-102 active:scale-98 transition-all shadow-orange-glow" 
                    onClick={() => setCurrentPage('episodes')}
                  >
                    <Play className="w-4 h-4 fill-current" /> تصفّح الحلقات
                  </button>
                </div>
              </div>
            </div>
          );
        })()}
      </section>

      {/* Streak Panel */}
      <section className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="text-start">
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">ليه فيزيو؟</h1>
          <p className="text-zinc-400 text-xs md:text-sm font-medium mt-1">اسمع. اتعلم. علّي مستواك.</p>
        </div>
        <StreakChip
          days={activeStreak}
          size="md"
          showName
          onClick={() => setCurrentPage('profile')}
          className="self-start sm:self-auto group hover:scale-103"
          trailing={<ChevronLeft className="relative rtl:-scale-x-100 w-4 h-4 text-zinc-400 group-hover:-translate-x-0.5 rtl:group-hover:translate-x-0.5 transition-transform" />}
        />
      </section>

      {/* Quick XP actions grid */}
      <QuickActions
        xpSettings={xpSettings}
        setCurrentPage={setCurrentPage}
        setCommunityTab={setCommunityTab}
      />

      {/* Stats Grid */}
      <StatsGrid
        user={user}
        leaderboard={leaderboard}
      />

      {/* Top 3 Podium Preview */}
      <PodiumPreview
        leaderboard={leaderboard}
        setCurrentPage={setCurrentPage}
      />

      {/* All Episodes Slider */}
      <section className="space-y-4">
        <div className="flex items-center">
          <span className="flex items-center gap-2.5 text-lg font-black text-white">
            <ListVideo className="w-5 h-5 text-brand-orange" />
            <span>كل الحلقات</span>
          </span>
        </div>
        
        <div className="flex gap-4 overflow-x-auto pb-4 scroll-smooth snap-x snap-mandatory">
          {(episodes || []).slice(0, 6).map((ep: any) => (
            <div 
              key={ep.id} 
              className="min-w-64 max-w-64 snap-start glass-card p-4 hover:border-brand-orange/30 group flex flex-col gap-3 cursor-pointer"
              onClick={() => navigateToEpisode(ep.id)}
            >
              <div className="w-full aspect-[16/9] rounded-xl bg-zinc-900 relative overflow-hidden flex items-center justify-center border border-zinc-800/40">
                <Thumb src={ep.thumbnail_url} width={256} />
                <div className="absolute inset-0 bg-black/20" />
                <button 
                  className="w-10 h-10 rounded-full bg-brand-orange text-black flex items-center justify-center hover:scale-110 active:scale-95 cursor-pointer relative z-10 transition-transform shadow-lg shrink-0" 
                  onClick={(e) => { e.stopPropagation(); navigateToEpisode(ep.id); }}
                >
                  <Play className="w-4 h-4 fill-current ms-0.5" />
                </button>
              </div>
              <div className="text-start">
                <h4 dir="auto" className="text-sm font-black text-white truncate">{ep.title_ar}</h4>
                <div className="text-2xs text-zinc-500 font-extrabold mt-1">{episodeLabel(ep)}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Official News & Announcements Section */}
      <section className="space-y-4">
        <div className="flex flex-row items-center justify-between w-full gap-2">
          <span className="flex items-center gap-2 text-sm sm:text-lg font-black text-white shrink">
            <Megaphone className="w-4 h-4 sm:w-5 sm:h-5 text-brand-orange shrink-0" />
            <span className="truncate">الأخبار والإعلانات الرسمية</span>
          </span>
          <button 
            onClick={() => setCurrentPage('news')} 
            className="text-2xs sm:text-xs font-black text-brand-orange hover:text-brand-amber transition-colors flex items-center gap-1 cursor-pointer bg-brand-orange/5 px-2.5 py-1.5 rounded-xl border border-brand-orange/15 hover:border-brand-orange/30 shrink-0 whitespace-nowrap"
          >
            عرض الكل
          </button>
        </div>
        
        {newsPosts.length === 0 ? (
          <div className="glass-card p-6 text-center text-zinc-500 text-xs font-bold border border-dashed border-zinc-800">
            مفيش إعلانات رسمية لسه. خليك متابع! 📢
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
                <div className="absolute top-0 end-0 w-24 h-24 bg-brand-orange/5 blur-2xl rounded-full" />
                
                <div className="space-y-2 text-start relative z-10">
                  <div className="flex items-center justify-between text-2xs font-black text-brand-orange uppercase tracking-wider">
                    <span>ليه فيزيو — رسمي</span>
                    <span>{new Date(post.created_at).toLocaleDateString('ar-EG-u-nu-latn', { month: 'short', day: 'numeric' })}</span>
                  </div>
                  <h4 className="text-xs font-extrabold text-white leading-relaxed line-clamp-2">
                    {post.title || post.content.substring(0, 40) + '...'}
                  </h4>
                  <p dir="auto" className="text-xs text-zinc-400 font-medium leading-relaxed line-clamp-3">
                    {post.content}
                  </p>
                </div>
                
                {post.image_url && (
                  <div className="w-full aspect-[2/1] rounded-lg overflow-hidden border border-zinc-800/40 relative shrink-0">
                    <img src={cld(post.image_url, { w: 320, h: 160, crop: 'fill' })} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  </div>
                )}
                
                <div className="flex items-center justify-between border-t border-white/5 pt-2 shrink-0">
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-full overflow-hidden border border-white/10 shrink-0">
                      <img src={post.avatar_url ? cld(post.avatar_url, { w: 20, h: 20, crop: 'fill' }) : '/icon-192.webp'} alt="" loading="lazy" className="w-full h-full object-cover" />
                    </div>
                    <span className="text-2xs font-black text-zinc-300 truncate max-w-[120px]"><bdi dir="ltr">@{post.username}</bdi></span>
                  </div>
                  <span className="text-2xs font-extrabold text-brand-orange group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform">اقرا التفاصيل ←</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Community Feed */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2.5 text-lg font-black text-white">
            <MessageSquare className="w-5 h-5 text-brand-orange" />
            <span>مجتمع الطلبة</span>
          </span>
          {isRefreshingFeed && (
            <div className="flex items-center gap-1.5 text-2xs text-zinc-500 font-bold uppercase tracking-wider animate-pulse">
              <div className="w-3 h-3 border-2 border-brand-orange border-t-transparent rounded-full animate-spin" />
              <span>بنحدّث…</span>
            </div>
          )}
        </div>

        {/* Question of the Day */}
        {dailyQuestion && dailyQuestion.active && dailyQuestion.question && (
          <div className="glass-card p-5 text-start space-y-4 border border-brand-orange/20 relative overflow-hidden">
            <div className="flex gap-2 relative z-10">
              <span className="text-2xs font-black tracking-wider bg-brand-orange/20 text-brand-orange px-2.5 py-1 rounded-md uppercase">
                سؤال اليوم
              </span>
            </div>
            <h3 dir="auto" className="text-base font-extrabold text-white leading-relaxed relative z-10">
              {dailyQuestion.question.question}
            </h3>
            <div className="flex flex-col gap-2.5 relative z-10">
              {dailyQuestion.question.options.map((option: string, idx: number) => {
                const isSelected = dailyQuestion.has_answered && dailyQuestion.user_answer?.selected_answer === idx;
                const isCorrectOption = dailyQuestion.has_answered && dailyQuestion.question.correct_answer === idx;
                const showCorrectness = dailyQuestion.has_answered;
                const total = dailyQuestion.stats?.total_answers || 0;
                const share = total > 0 ? Math.round(((dailyQuestion.stats.option_counts?.[idx] || 0) / total) * 100) : null;

                let btnStyles = 'border-zinc-800 hover:border-zinc-700 bg-zinc-900/40 text-zinc-300';
                if (showCorrectness) {
                  if (isCorrectOption) {
                    btnStyles = 'border-emerald-500 bg-emerald-500/5 text-emerald-400 font-extrabold';
                  } else if (isSelected) {
                    btnStyles = 'border-red-500 bg-red-500/5 text-red-400 font-extrabold';
                  } else {
                    btnStyles = 'border-zinc-800/80 bg-zinc-950/40 text-zinc-400';
                  }
                }

                return (
                  <button
                    key={idx}
                    className={`w-full text-start p-3.5 rounded-xl border font-bold text-xs relative overflow-hidden transition-all duration-200 group active:scale-99 ${btnStyles} disabled:cursor-default`}
                    onClick={() => handleAnswerQuestion && handleAnswerQuestion(dailyQuestion.question.id, idx)}
                    disabled={dailyQuestion.has_answered}
                  >
                    {showCorrectness && share !== null && (
                      <span
                        aria-hidden
                        className={`absolute inset-y-0 start-0 ${isCorrectOption ? 'bg-emerald-500/15' : isSelected ? 'bg-red-500/15' : 'bg-zinc-700/25'} transition-[width] duration-700`}
                        style={{ width: `${share}%` }}
                      />
                    )}
                    <div className="flex justify-between items-center gap-3 relative z-10">
                      <span dir="auto" className="text-sm">{option}</span>
                      {showCorrectness && (
                        <span className="flex items-center gap-2 shrink-0">
                          {share !== null && <span dir="ltr" className="text-xs font-black tabular-nums">{share}%</span>}
                          {isCorrectOption && '✅'}
                          {isSelected && !isCorrectOption && '❌'}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {dailyQuestion.has_answered && (
              <p className="text-2xs text-brand-amber font-extrabold flex items-center gap-1.5 uppercase tracking-wide">
                <Zap className="w-3.5 h-3.5 fill-current animate-fire-pulse" />
                <span>
                  {dailyQuestion.user_answer?.is_correct 
                    ? `✅ إجابة صح (+${dailyQuestion.user_answer?.xp_awarded} XP)` 
                    : `❌ إجابة غلط (+${dailyQuestion.user_answer?.xp_awarded} XP)`
                  }
                </span>
                {dailyQuestion.stats?.total_answers > 0 && (
                  <span className="ms-auto text-zinc-500 normal-case tracking-normal">جاوب {dailyQuestion.stats.total_answers} طالب</span>
                )}
              </p>
            )}
          </div>
        )}

        {/* Post Composer */}
        <PostComposer
          user={user}
          newPostContent={newPostContent}
          setNewPostContent={setNewPostContent}
          handleCreatePost={handleCreatePost}
          handleUploadImage={handleUploadImage}
        />

        {/* Posts feed */}
        <div className="space-y-4">
          {communityPosts.length === 0 ? (
            <p className="text-zinc-500 text-xs md:text-sm font-medium py-12 text-center">مفيش بوستات دلوقتي.</p>
          ) : (
            communityPosts.map((post: any) => (
              <PostCard
                key={post.id}
                post={post}
                user={user}
                usernames={usernames}
                deepLinkTarget={deepLinkTarget}
                setDeepLinkTarget={setDeepLinkTarget}
                handleLikePost={handleLikePost}
                handleDeletePost={handleDeletePost}
                handleCancelPostRevision={handleCancelPostRevision}
                handleSharePost={handleSharePost}
                handleEditPost={handleEditPost}
                handleUploadImage={handleUploadImage}
                showToast={showToast}
                handleOpenReportModal={handleOpenReportModal}
                triggerXpPopup={triggerXpPopup}
                onOpenComments={onOpenComments}
              />
            ))
          )}
        </div>
      </section>
    </div>
  );
};
