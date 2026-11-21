import React, { useEffect, useState } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { StreakChip } from '../streak/Streak';
import { RankMedal } from '../common/RankMedal';
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

const SLIDE_INTERVAL_MS = 4500;

export const PodiumPreview: React.FC<PodiumPreviewProps> = ({
  leaderboard = [],
  setCurrentPage,
}) => {
  const { user, changePage } = useAuth();
  const userBatch = user?.batch || 'PT 12';

  const [activeTab, setActiveTab] = useState<PodiumTab>('all-time');
  const [isHovered, setIsHovered] = useState(false);
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
    if (isHovered) return undefined;
    const timer = setInterval(() => {
      setActiveTab((prev) => {
        if (prev === 'all-time') return 'weekly';
        if (prev === 'weekly') return 'batch';
        return 'all-time';
      });
    }, SLIDE_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [isHovered, activeTab]);

  const currentBoard =
    activeTab === 'weekly'
      ? weeklyBoard
      : activeTab === 'batch'
        ? batchBoard
        : leaderboard;

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
      pedestalGlow: string;
      elevationClass?: string;
    }
  ) => (
    <button
      type="button"
      onClick={() => openUserProfile(person)}
      disabled={!person?.username}
      className={`flex flex-col items-center gap-1.5 ${opts.orderClass} group cursor-pointer disabled:cursor-default focus:outline-none transition-transform duration-300 hover:-translate-y-1.5 active:scale-95`}
      style={{ opacity: person ? 1 : 0.35 }}
      aria-label={person ? `عرض بروفايل ${person.username}` : undefined}
    >
      <div className={`relative z-10 ${opts.elevationClass || ''}`}>
        {person && (
          <div
            className="absolute -inset-3 rounded-full blur-lg opacity-55 group-hover:opacity-95 transition-opacity pointer-events-none"
            style={{ background: opts.glowColor }}
          />
        )}
        <div className={`rounded-full relative z-10 ring-2 ${opts.ringClass} transition-transform duration-300 group-hover:scale-105 shadow-xl`}>
          <UserAvatar
            username={person ? person.username : '—'}
            avatarUrl={person ? person.avatar_url : null}
            equippedFrame={person ? person.equipped_frame : 'none'}
            size={opts.avatarSize}
          />
        </div>
        <span className="absolute top-[calc(100%-6px)] left-1/2 -translate-x-1/2 z-20 pointer-events-none">
          <RankMedal rank={place} size={place === 1 ? 44 : 36} />
        </span>
      </div>

      <span className="text-xs sm:text-[13px] font-black text-white group-hover:text-brand-amber transition-colors text-center max-w-[94px] sm:max-w-[128px] truncate leading-tight mt-9">
        {person ? person.username : '—'}
      </span>

      <span className="text-[11px] font-extrabold text-amber-200/80 bg-white/[0.05] border border-white/10 px-2 py-0.5 rounded-full tabular-nums" dir="ltr">
        {person ? `${(person.xp || 0).toLocaleString('en-US')} XP` : '0 XP'}
      </span>

      {person && (person.streak_count || 0) > 0 && (
        <StreakChip days={person.streak_count} size="xs" className="mt-0.5" />
      )}

      {/* 3D Metallic Pedestal */}
      <div
        className={`w-[80px] sm:w-[104px] ${opts.pedestalHeight} rounded-t-2xl ${opts.pedestalGradient} relative overflow-hidden flex flex-col items-center justify-start pt-2.5 border-t-2 border-white/40 mt-1`}
        style={{ boxShadow: opts.pedestalGlow }}
      >
        <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/25 to-transparent pointer-events-none" />
        <div className="absolute inset-y-0 start-0 w-1/4 bg-gradient-to-r from-white/15 to-transparent pointer-events-none" />
        <span className="text-base font-black text-black/80 relative z-10 drop-shadow-sm">{place}</span>
      </div>
    </button>
  );

  return (
    <section
      className="space-y-4"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
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

      {/* Luxury Stage Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-zinc-900/90 via-zinc-950/95 to-black p-4 sm:p-6 mb-5 border border-amber-500/20 shadow-[0_20px_60px_-15px_rgba(245,158,11,0.16)]">
        {/* Top Ambient Spotlight */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-72 h-48 bg-gradient-to-b from-amber-500/20 via-brand-orange/10 to-transparent blur-3xl pointer-events-none" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/40 to-transparent pointer-events-none" />

        {/* Centered Tab Switcher */}
        <div className="relative z-10 flex flex-col items-center gap-2.5 mb-6">
          <div className="inline-flex items-center p-1 rounded-2xl bg-black/55 border border-white/10 shadow-inner">
            {PODIUM_TABS.map((tab) => {
              const active = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`relative px-3.5 sm:px-4 py-1.5 rounded-xl text-2xs sm:text-xs font-black flex items-center gap-1.5 cursor-pointer transition-colors ${
                    active ? 'text-black' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {active && (
                    <m.span
                      layoutId="homePodiumTabBg"
                      transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                      className="absolute inset-0 rounded-xl bg-gradient-to-r from-brand-orange via-amber-400 to-brand-amber shadow-[0_4px_16px_rgba(255,106,0,0.35)]"
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-1.5">
                    {tab.icon}
                    <span>{tab.key === 'batch' ? `دفعة ${userBatch}` : tab.label}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Auto-scrolling Carousel Podium Stage */}
        <div className="relative overflow-hidden min-h-[245px] flex items-end justify-center">
          <AnimatePresence mode="wait">
            <m.div
              key={activeTab}
              initial={{ opacity: 0, x: 48, scale: 0.96 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -48, scale: 0.96 }}
              transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
              className="w-full flex items-end justify-center gap-2.5 sm:gap-7 pt-4"
            >
              {renderSlot(second, 2, {
                orderClass: 'order-1',
                avatarSize: 58,
                ringClass: 'ring-zinc-300/70',
                glowColor: 'radial-gradient(circle, rgba(212,212,216,0.45), transparent 70%)',
                badgeBg: 'bg-gradient-to-br from-zinc-100 to-zinc-400 text-black',
                badgeIcon: <Medal className="w-3.5 h-3.5" />,
                pedestalHeight: 'h-16',
                pedestalGradient: 'bg-gradient-to-b from-zinc-200 via-zinc-400 to-zinc-600',
                pedestalGlow: '0 -8px 25px rgba(212,212,216,0.18)',
              })}

              {renderSlot(first, 1, {
                orderClass: 'order-2',
                avatarSize: 74,
                ringClass: 'ring-amber-300/90',
                glowColor: 'radial-gradient(circle, rgba(251,191,36,0.65), transparent 70%)',
                badgeBg: 'bg-gradient-to-br from-yellow-200 via-amber-400 to-amber-600 text-black',
                badgeIcon: <Crown className="w-3.5 h-3.5" />,
                pedestalHeight: 'h-24',
                pedestalGradient: 'bg-gradient-to-b from-yellow-300 via-amber-400 to-amber-600',
                pedestalGlow: '0 -10px 35px rgba(251,191,36,0.3)',
                elevationClass: '-top-2',
              })}

              {renderSlot(third, 3, {
                orderClass: 'order-3',
                avatarSize: 54,
                ringClass: 'ring-amber-600/75',
                glowColor: 'radial-gradient(circle, rgba(217,119,6,0.5), transparent 70%)',
                badgeBg: 'bg-gradient-to-br from-amber-500 to-amber-800 text-white',
                badgeIcon: <Award className="w-3.5 h-3.5" />,
                pedestalHeight: 'h-12',
                pedestalGradient: 'bg-gradient-to-b from-amber-500 via-amber-700 to-amber-900',
                pedestalGlow: '0 -6px 20px rgba(217,119,6,0.2)',
              })}
            </m.div>
          </AnimatePresence>
        </div>

        {/* Auto-scroll progress hairline at bottom */}
        {!isHovered && (
          <div className="absolute bottom-0 inset-x-0 h-[2px] bg-white/5 overflow-hidden">
            <m.div
              key={activeTab}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: SLIDE_INTERVAL_MS / 1000, ease: 'linear' }}
              className="h-full origin-left bg-gradient-to-r from-brand-orange via-amber-400 to-brand-amber/60"
            />
          </div>
        )}
      </div>
    </section>
  );
};
