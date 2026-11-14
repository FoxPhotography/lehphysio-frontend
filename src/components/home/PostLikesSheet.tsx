import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { m, AnimatePresence } from 'framer-motion';
import { Heart, X, Loader2, User as UserIcon } from 'lucide-react';
import { UserAvatar } from '../UserAvatar';
import { StreakName } from '../streak/Streak';
import { useAuth } from '../../context/AuthContext';
import { communityService } from '../../services/communityService';
import type { PostLikeUser } from '../../types';

interface PostLikesSheetProps {
  open: boolean;
  postId: number;
  initialCount?: number;
  onClose: () => void;
}

function useBackButtonClose(open: boolean, onClose: () => void) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  useEffect(() => {
    if (!open) return undefined;
    let poppedByBack = false;
    window.history.pushState({ ...(window.history.state || {}), lpOverlay: true }, '');
    const onPop = () => {
      poppedByBack = true;
      onCloseRef.current();
    };
    window.addEventListener('popstate', onPop);
    return () => {
      window.removeEventListener('popstate', onPop);
      if (!poppedByBack && window.history.state?.lpOverlay) window.history.back();
    };
  }, [open]);
}

export const PostLikesSheet: React.FC<PostLikesSheetProps> = ({
  open,
  postId,
  initialCount = 0,
  onClose,
}) => {
  const { user: currentUser, changePage } = useAuth();
  const [likes, setLikes] = useState<PostLikeUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<'all' | 'heart'>('all');

  useBackButtonClose(open, onClose);

  useEffect(() => {
    if (!open || !postId) return;
    let isCancelled = false;

    const loadLikes = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token') || undefined;
        const res = await communityService.fetchPostLikes(postId, token);
        if (!isCancelled) {
          setLikes(res.likes || []);
        }
      } catch (err: any) {
        if (!isCancelled) {
          console.error('Failed to load post likes:', err);
          setError('تعذر تحميل المعجبين');
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    loadLikes();
    return () => {
      isCancelled = true;
    };
  }, [open, postId]);

  const totalCount = likes.length || initialCount;

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence onExitComplete={() => setTab('all')}>
      {open && (
        <div
          className="fixed inset-0 z-[1150] flex flex-col justify-end md:justify-center md:items-center"
          onClick={onClose}
          onContextMenu={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          {/* Backdrop */}
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-[2px]"
          />

          {/* Modal / Sheet Container */}
          <m.div
            initial={{ y: '100%', opacity: 0.5 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            dragSnapToOrigin
            onDragEnd={(_, info) => {
              if (info.offset.y > 90 || info.velocity.y > 400) onClose();
            }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full md:max-w-md bg-zinc-950 border-t md:border border-zinc-800/90 rounded-t-[28px] md:rounded-[28px] shadow-2xl max-h-[75vh] flex flex-col pb-[env(safe-area-inset-bottom,0px)] overflow-hidden"
          >
            {/* Header */}
            <div className="pt-3 px-5 pb-3 border-b border-zinc-800/80 bg-zinc-950/95 sticky top-0 z-10">
              <div className="w-11 h-1.5 bg-zinc-700/80 rounded-full mx-auto mb-3 md:hidden" />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#ff3b5c]/15 text-[#ff3b5c] flex items-center justify-center">
                    <Heart className="w-4 h-4 fill-current" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white leading-none">معجبي المنشور</h3>
                    <span className="text-[11px] font-semibold text-zinc-400">
                      {totalCount} {totalCount === 1 ? 'تفاعل' : 'تفاعلات'}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="إغلاق"
                  className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center cursor-pointer active:scale-95 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex gap-2 mt-3 overflow-x-auto no-scrollbar">
                <button
                  type="button"
                  onClick={() => setTab('all')}
                  className={`shrink-0 h-8 px-3.5 rounded-full text-xs font-black transition-colors cursor-pointer flex items-center gap-1.5 ${
                    tab === 'all'
                      ? 'bg-brand-orange text-black shadow-md shadow-brand-orange/20'
                      : 'bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white'
                  }`}
                >
                  <span>الكل</span>
                  <span className="text-[11px] font-black opacity-80 tabular-nums">{totalCount}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTab('heart')}
                  className={`shrink-0 h-8 px-3.5 rounded-full text-xs font-black transition-colors cursor-pointer flex items-center gap-1.5 ${
                    tab === 'heart'
                      ? 'bg-[#ff3b5c] text-white shadow-md shadow-[#ff3b5c]/30'
                      : 'bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white'
                  }`}
                >
                  <span className="text-sm leading-none">❤️</span>
                  <span className="text-[11px] font-black opacity-80 tabular-nums">{totalCount}</span>
                </button>
              </div>
            </div>

            {/* List Body */}
            <div className="flex-1 overflow-y-auto overscroll-contain p-2.5 divide-y divide-zinc-900/60">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <Loader2 className="w-7 h-7 text-brand-orange animate-spin" />
                  <p className="text-xs text-zinc-400 font-semibold">بنحمل قايمة المعجبين...</p>
                </div>
              ) : error ? (
                <div className="text-center py-10 px-4">
                  <p className="text-xs text-red-400 font-bold mb-3">{error}</p>
                  <button
                    type="button"
                    onClick={() => {
                      setLoading(true);
                      communityService
                        .fetchPostLikes(postId, localStorage.getItem('token') || undefined)
                        .then((res) => setLikes(res.likes || []))
                        .catch(() => setError('تعذر تحميل المعجبين'))
                        .finally(() => setLoading(false));
                    }}
                    className="px-4 py-1.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-xs text-white font-bold transition-colors cursor-pointer"
                  >
                    حاول تاني
                  </button>
                </div>
              ) : likes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                  <div className="w-14 h-14 rounded-full bg-zinc-900 border border-zinc-800/80 flex items-center justify-center text-zinc-600 mb-3">
                    <Heart className="w-7 h-7" />
                  </div>
                  <h4 className="text-sm font-bold text-zinc-300 mb-1">مفيش تفاعلات لسه</h4>
                  <p className="text-xs text-zinc-500">خليك أول واحد يحط لاف على المنشور ده! ❤️</p>
                </div>
              ) : (
                likes.map((likeUser) => {
                  const isMe =
                    likeUser.is_me ||
                    (currentUser && String(currentUser.id) === String(likeUser.user_id));
                  const nameCos = likeUser.cosmetics?.nameplate;

                  return (
                    <div
                      key={`${likeUser.user_id}-${likeUser.id}`}
                      onClick={() => {
                        onClose();
                        if (changePage) {
                          changePage('public-profile', { username: likeUser.username });
                        }
                      }}
                      className="group flex items-center gap-3 px-3 py-2.5 rounded-2xl hover:bg-white/[0.04] active:bg-white/[0.08] transition-colors cursor-pointer"
                    >
                      {/* Avatar with Frame */}
                      <div className="shrink-0">
                        <UserAvatar
                          username={likeUser.username}
                          avatarUrl={likeUser.avatar_url}
                          equippedFrame={likeUser.equipped_frame}
                          size={40}
                        />
                      </div>

                      {/* User Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <StreakName days={likeUser.streak_count || 0} override={nameCos}>
                            <span className="text-[13px] font-black truncate group-hover:text-brand-orange transition-colors">
                              {likeUser.username}
                            </span>
                          </StreakName>
                          {isMe && (
                            <span className="px-1.5 py-0.5 text-[10px] font-black rounded-md bg-brand-orange/20 text-brand-orange border border-brand-orange/30">
                              إنت
                            </span>
                          )}
                        </div>

                        {/* Batch & Rank Subtitle */}
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-zinc-400 font-medium">
                          {likeUser.batch && (
                            <span className="text-zinc-500 font-bold">{likeUser.batch}</span>
                          )}
                          {likeUser.rank && (
                            <>
                              <span className="text-zinc-700">•</span>
                              <span className="text-zinc-400">{likeUser.rank}</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Heart Icon */}
                      <div className="shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-[#ff3b5c]/10 text-[#ff3b5c]">
                        <Heart className="w-4 h-4 fill-current drop-shadow-[0_0_8px_rgba(255,59,92,0.4)]" />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </m.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};
