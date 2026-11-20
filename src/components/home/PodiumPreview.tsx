import React, { useEffect, useState } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { StreakChip } from '../streak/Streak';
import { Trophy, ChevronLeft, Crown, Medal, Award, Flame, Users } from 'lucide-react';
import { UserAvatar } from '../UserAvatar';
import { gameService } from '../../services/gameService';
import { useAuth } from '../../context/AuthContext';

type PodiumTab = 'all-time' | 'weekly' | 'batch';

interface PodiumPreviewProps {
  leaderboard?: any[];
  setCurrentPage: (page: string) => void;
}

const PODIUM_TABS: { key: PodiumTab; label: string; icon: React.ReactNode }[] = [
  { key: 'all-time', label: 'العام', icon: <Trophy className="w-3.5 h-3.5" /> },
  { key: 'weekly', label: 'الأسبوعي', icon: <Flame className="w-3.5 h-3.5" /> },
  { key: 'batch', label: 'الدفعة', icon: <Users className="w-3.5 h-3.5" /> },
];

export const PodiumPreview: React.FC<PodiumPreviewProps> = ({
  leaderboard = [],
  setCurrentPage,
}) => {
  const { user, changePage } = useAuth();
  const userBatch = user?.batch || 'PT 12';

  const [activeTab, setActiveTab] = useState<PodiumTab>('all-time');
  const [isPaused, setIsPaused] = useState(false);
  const [weeklyBoard, setWeeklyBoard] = useState<any[]>([]);
  const [batchBoard, setBatchBoard] = useState<any[]>([]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      gameService.fetchLeaderboard('weekly').then((r) => (r.ok ? r.json() : [])).catch(() => []),
      gameService.fetchLeaderboard('batch', userBatch).then((r) => (r.ok ? r.json() : [])).catch(() => []),
    ]).then(([wData, bData]) => {
      if (cancelled) return;
      if (Array.isArray(wData)) setWeeklyBoard(wData);
      if (Array.isArray(bData)) setBatchBoard(bData);
    });
    return () => {
      cancelled = true;
    };
  }, [userBatch]);

  useEffect(() => {
    if (isPaused) return undefined;
    const timer = setInterval(() => {
      setActiveTab((prev) => {
        if (prev === 'all-time') return 'weekly';
        if (prev === 'weekly') return 'batch';
        return 'all-time';
      });
    }, 5500);
    return () => clearInterval(timer);
  }, [isPaused]);

  const currentBoard =
    activeTab === 'weekly' && weeklyBoard.length > 0
      ? weeklyBoard
      : activeTab === 'batch' && batchBoard.length > 0
        ? batchBoard
        : activeTab === 'all-time'
          ? leaderboard
          : activeTab === 'weekly'
            ? weeklyBoard
            : batchBoard;

  const first = currentBoard[0];
  const second = currentBoard[1];
  const third = currentBoard[2];

  const openUserProfile = (person: any) => {
    if (!person?.username) return;
    changePage('public-profile', { username: person.username });
  };

  const renderSlot = (
    person: any,
    place: 1 | 2 | 3,
    opts: {
      orderClass: string;
      avatarSize: number;
      ringClass: string;
      glowColor: string;
      badgeBg: string;
      badgeIcon: React.ReactNode;
      pedestalHeight: string;
      pedestalGradient: string;
      elevationClass?: string;
    }
  ) => (
    <button
      type="button"
      onClick={() => openUserProfile(person)}
      disabled={!person?.username}
      className={`flex flex-col items-center gap-1.5 ${opts.orderClass} group cursor-pointer disabled:cursor-default focus:outline-none transition-transform duration-200 hover:-translate-y-1 active:scale-95`}
      style={{ opacity: person ? 1 : 0.35 }}
      aria-label={person ? `عرض بروفايل ${person.username}` : undefined}
    >
      <div className={`relative z-10 ${opts.elevationClass || ''}`}>
        {/* Ambient radial glow */}
        {person && (
          <div
            className="absolute -inset-2 rounded-full blur-md opacity-50 group-hover:opacity-85 transition-opacity pointer-events-none"
            style={{ background: opts.glowColor }}
          />
        )}
        <div className={`rounded-full relative z-10 ring-2 ${opts.ringClass} transition-transform duration-200 group-hover:scale-105`}>
          <UserAvatar
            username={person ? person.username : '—'}
            avatarUrl={person ? person.avatar_url : null}
            equippedFrame={person ? person.equipped_frame : 'none'}
            size={opts.avatarSize}
          />
        </div>
        <span className={`absolute -bottom-1 -end-1 w-6 h-6 rounded-full ${opts.badgeBg} flex items-center justify-center shadow-lg z-20 ring-2 ring-zinc-950`}>
          {opts.badgeIcon}
        </span>
      </div>

      <span className="text-xs font-black text-white group-hover:text-brand-orange transition-colors text-center max-w-[92px] sm:max-w-[120px] truncate leading-tight mt-0.5">
        {person ? person.username : '—'}
      </span>
      <span className="text-2xs text-zinc-400 font-bold tabular-nums" dir="ltr">
        {person ? `${(person.xp || 0).toLocaleString('en-US')} XP` : '0 XP'}
      </span>
      {person && (person.streak_count || 0) > 0 && (
        <StreakChip days={person.streak_count} size="xs" className="mt-0.5" />
      )}

      {/* Pedestal */}
      <div
        className={`w-[76px] sm:w-24 ${opts.pedestalHeight} rounded-t-2xl ${opts.pedestalGradient} relative overflow-hidden flex flex-col items-center justify-start pt-2 shadow-lg border-t border-white/25`}
      >
        <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
        <span className="text-sm font-black text-black/80 relative z-10">{place}</span>
      </div>
    </button>
  );

  return (
    <section
      className="space-y-4"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2.5 text-lg font-black text-white">
          <Trophy className="w-5 h-5 text-brand-orange" />
          <span>الترتيب</span>
        </span>
        <button
          type="button"
          className="flex items-center gap-1 text-xs font-bold text-brand-orange hover:text-brand-amber cursor-pointer transition-colors"
          onClick={() => setCurrentPage('leaderboard')}
        >
          <span>عرض الكل</span>
          <ChevronLeft className="rtl:-scale-x-100 w-4 h-4" />
        </button>
      </div>

      <div className="glass-card p-4 sm:p-6 mb-5 relative overflow-hidden border border-white/8">
        {/* Top Ambient Header + Tab Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-6">
          <div className="inline-flex items-center p-1 rounded-xl bg-black/40 border border-white/8">
            {PODIUM_TABS.map((tab) => {
              const active = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab.key);
                    setIsPaused(true);
                  }}
                  className={`relative px-3 py-1.5 rounded-lg text-2xs sm:text-xs font-black flex items-center gap-1.5 cursor-pointer transition-colors ${
                    active ? 'text-black' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {active && (
                    <m.span
                      layoutId="homePodiumTabBg"
                      transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                      className="absolute inset-0 rounded-lg bg-gradient-to-r from-brand-orange to-brand-amber shadow-orange-glow"
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-1">
                    {tab.icon}
                    <span>{tab.key === 'batch' ? `دفعة ${userBatch}` : tab.label}</span>
                  </span>
                </button>
              );
            })}
          </div>

          <span className="text-3xs font-bold text-zinc-500">
            اضغط على أي بطل لعرض بروفايله
          </span>
        </div>

        {/* Animated Podium Stage */}
        <AnimatePresence mode="wait">
          <m.div
            key={activeTab}
            initial={{ opacity: 0, y: 12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.97 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-end justify-center gap-2.5 sm:gap-6 pt-3"
          >
            {renderSlot(second, 2, {
              orderClass: 'order-1',
              avatarSize: 56,
              ringClass: 'ring-zinc-300/60',
              glowColor: 'radial-gradient(circle, rgba(212,212,216,0.45), transparent 70%)',
              badgeBg: 'bg-gradient-to-br from-zinc-200 to-zinc-400 text-black',
              badgeIcon: <Medal className="w-3.5 h-3.5" />,
              pedestalHeight: 'h-16',
              pedestalGradient: 'bg-gradient-to-t from-zinc-500 via-zinc-400 to-zinc-300',
            })}

            {renderSlot(first, 1, {
              orderClass: 'order-2',
              avatarSize: 70,
              ringClass: 'ring-amber-400/80',
              glowColor: 'radial-gradient(circle, rgba(251,191,36,0.55), transparent 70%)',
              badgeBg: 'bg-gradient-to-br from-yellow-300 to-amber-500 text-black',
              badgeIcon: <Crown className="w-3.5 h-3.5" />,
              pedestalHeight: 'h-24',
              pedestalGradient: 'bg-gradient-to-t from-amber-600 via-amber-500 to-yellow-300',
              elevationClass: '-top-2',
            })}

            {renderSlot(third, 3, {
              orderClass: 'order-3',
              avatarSize: 52,
              ringClass: 'ring-amber-700/60',
              glowColor: 'radial-gradient(circle, rgba(217,119,6,0.45), transparent 70%)',
              badgeBg: 'bg-gradient-to-br from-amber-600 to-amber-800 text-white',
              badgeIcon: <Award className="w-3.5 h-3.5" />,
              pedestalHeight: 'h-12',
              pedestalGradient: 'bg-gradient-to-t from-amber-800 via-amber-700 to-amber-600',
            })}
          </m.div>
        </AnimatePresence>
      </div>
    </section>
  );
};
