import { useAuth } from '../context/AuthContext';
import { rankName } from '../utils/ranks';
import React from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { Trophy, Crown, Medal, Star, Gift, Users, Sparkles } from 'lucide-react';
import { UserAvatar } from '../components/UserAvatar';
import { StreakNameplate, StreakName, StreakChip } from '../components/streak/Streak';
import { RankMedal } from '../components/common/RankMedal';
import { cosmeticVisual } from '../utils/cosmetics';

// Helper: strip emojis from DB fields
const stripEmojis = (str: string) => {
  if (!str) return '';
  return str
    .replace(/[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]/g, '')
    .trim();
};

interface LeaderboardProps {
  user: any;
  leaderboard: any[];
  leaderboardTab: string;
  setLeaderboardTab: (tab: string) => void;
}

// ─── Podium Person ─────────────────────────────────────────────────────────────
const PodiumEntry: React.FC<{
  person: any;
  place: 1 | 2 | 3;
  delay?: number;
  isInvitesTab?: boolean;
}> = ({ person, place, delay = 0, isInvitesTab = false }) => {
  const configs = {
    1: {
      avatarSize: 68,
      barH: 'h-24',
      barColor: 'from-amber-500 to-yellow-400',
      badgeBg: 'bg-amber-500',
      badgeText: 'text-black',
      ring: 'ring-2 ring-amber-400/50',
      icon: <Crown className="w-3.5 h-3.5" />,
      order: 'order-2',
    },
    2: {
      avatarSize: 56,
      barH: 'h-16',
      barColor: 'from-zinc-400 to-zinc-300',
      badgeBg: 'bg-zinc-400',
      badgeText: 'text-black',
      ring: 'ring-2 ring-zinc-400/40',
      icon: <Medal className="w-3.5 h-3.5" />,
      order: 'order-1',
    },
    3: {
      avatarSize: 52,
      barH: 'h-10',
      barColor: 'from-amber-700 to-amber-600',
      badgeBg: 'bg-amber-700',
      badgeText: 'text-white',
      ring: 'ring-2 ring-amber-700/40',
      icon: <Star className="w-3.5 h-3.5" />,
      order: 'order-3',
    },
  };

  const cfg = configs[place];
  const empty = !person;

  return (
    <m.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: empty ? 0.35 : 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className={`flex flex-col items-center gap-1.5 ${cfg.order}`}
    >
      {/* Avatar + Rank Badge */}
      <div className="relative z-10">
        <div className={`rounded-full relative z-10 ${cfg.ring}`}>
          <UserAvatar
            username={empty ? '—' : person.username}
            avatarUrl={empty ? null : person.avatar_url}
            equippedFrame={empty ? 'none' : person.equipped_frame}
            size={cfg.avatarSize}
          />
        </div>
        <span className={`absolute -bottom-1 -end-1 w-5 h-5 rounded-full ${cfg.badgeBg} ${cfg.badgeText} flex items-center justify-center shadow-lg z-20`}>
          {cfg.icon}
        </span>
      </div>

      {/* Name */}
      <span className="text-xs font-bold text-white text-center max-w-[68px] truncate leading-tight">
        {empty ? '—' : person.username}
      </span>

      {/* XP / Invites */}
      {isInvitesTab && !empty ? (
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-[11px] font-black text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full tabular-nums">
            {person.invites_count || 0} دعوة
          </span>
          <span className="text-2xs text-emerald-400/90 font-extrabold tabular-nums" dir="ltr">
            +{(person.xp || 0).toLocaleString('en-US')} XP
          </span>
        </div>
      ) : (
        <span className="text-2xs text-zinc-500 font-medium">
          {empty ? '0 XP' : `${person.xp.toLocaleString()} XP`}
        </span>
      )}
      {!empty && (person.streak_count || 0) > 0 && <StreakChip days={person.streak_count} size="xs" />}

      {/* Podium Bar */}
      <div className={`w-16 sm:w-20 ${cfg.barH} rounded-t-xl bg-gradient-to-t ${cfg.barColor} opacity-80 flex items-start justify-center pt-1.5`}>
        <span className="text-xs font-black text-black/70">{place}</span>
      </div>
    </m.div>
  );
};

// ─── Tab Pill ──────────────────────────────────────────────────────────────────
const TabPill: React.FC<{ label: string; active: boolean; onClick: () => void }> = ({
  label, active, onClick
}) => (
  <m.button
    onClick={onClick}
    whileHover={{ scale: 1.03 }}
    whileTap={{ scale: 0.97 }}
    className={`px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-bold whitespace-nowrap shrink-0 transition-all cursor-pointer ${
      active
        ? 'bg-orange-500 text-black shadow-md shadow-orange-500/20'
        : 'bg-white/5 border border-white/8 text-zinc-400 hover:text-white hover:border-white/15'
    }`}
  >
    {label}
  </m.button>
);

// ─── Main Component ────────────────────────────────────────────────────────────
export const Leaderboard: React.FC<LeaderboardProps> = ({
  user,
  leaderboard,
  leaderboardTab,
  setLeaderboardTab,
}) => {
  const [first, second, third] = leaderboard;
  const { changePage, xpSettings } = useAuth();
  const isInvitesTab = leaderboardTab === 'invites';
  const inviteBonus = Number(xpSettings?.app_invite_bonus ?? 1000).toLocaleString('en-US');
  const openProfile = (username: string) => changePage('public-profile', { username });

  return (
    <m.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-2xl mx-auto px-4 xl:pt-6"
    >
      {/* Page Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center">
          <Trophy className="w-5 h-5 text-amber-400" />
        </div>
        <div>
          <h1 className="text-xl font-black text-white leading-tight">لوحة الترتيب</h1>
          <p className="text-xs text-zinc-500">ترتيب ليه فيزيو؟</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar mb-6 pb-0.5">
        <TabPill label="الكل"    active={leaderboardTab === 'all-time'} onClick={() => setLeaderboardTab('all-time')} />
        <TabPill label="الأسبوع"      active={leaderboardTab === 'weekly'}   onClick={() => setLeaderboardTab('weekly')} />
        {user && (
          <TabPill
            label={`دفعتي (${user.batch})`}
            active={leaderboardTab === 'batch'}
            onClick={() => setLeaderboardTab('batch')}
          />
        )}
        <m.button
          onClick={() => setLeaderboardTab('invites')}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className={`px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-black whitespace-nowrap shrink-0 transition-all flex items-center gap-1 sm:gap-1.5 cursor-pointer ${
            isInvitesTab
              ? 'bg-gradient-to-r from-emerald-400 to-teal-400 text-black shadow-lg shadow-emerald-500/25'
              : 'bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 hover:bg-emerald-500/20'
          }`}
        >
          <Gift className="w-3.5 h-3.5" />
          <span>سفراء الدعوات</span>
        </m.button>
      </div>

      {/* Animated Ambassadors Hero Banner when Invites tab is active */}
      <AnimatePresence mode="wait">
        {isInvitesTab && (
          <m.div
            key="invites-banner"
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 360, damping: 28 }}
            className="relative overflow-hidden rounded-2xl border border-emerald-500/35 bg-gradient-to-br from-emerald-500/15 via-zinc-900/90 to-teal-500/15 p-4 mb-5 flex flex-wrap items-center justify-between gap-3"
          >
            <div className="absolute -top-12 -end-12 w-36 h-36 bg-emerald-400/15 rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-center gap-3 relative z-10">
              <m.div
                animate={{ rotate: [0, -8, 8, 0] }}
                transition={{ repeat: Infinity, duration: 3.5, ease: 'easeInOut' }}
                className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 shrink-0"
              >
                <Sparkles className="w-5 h-5" />
              </m.div>
              <div>
                <h2 className="text-sm font-black text-white">أبطال دعوات ليه فيزيو</h2>
                <p className="text-xs font-semibold text-zinc-300">
                  كل صديق يسجل حساب حقيقي من رابطك بيديك <span className="text-emerald-300 font-black">+{inviteBonus} XP</span> فوراً!
                </p>
              </div>
            </div>
            {user && (
              <button
                type="button"
                onClick={() => changePage('profile')}
                className="relative z-10 px-3.5 py-2 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-black font-black text-xs cursor-pointer active:scale-95 transition-all flex items-center gap-1.5"
              >
                <Users className="w-3.5 h-3.5" />
                <span>شارك رابطك</span>
              </button>
            )}
          </m.div>
        )}
      </AnimatePresence>

      {/* Podium */}
      <m.div
        key={`podium-${leaderboardTab}`}
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.25 }}
        className={`rounded-2xl border p-6 mb-5 ${
          isInvitesTab
            ? 'border-emerald-500/25 bg-gradient-to-b from-emerald-950/30 to-zinc-900/60'
            : 'border-white/8 bg-zinc-900/60'
        }`}
      >
        <div className="flex items-end justify-center gap-4 sm:gap-6">
          <div role="link" tabIndex={0} className="cursor-pointer" onClick={() => second && openProfile(second.username)}><PodiumEntry person={second} place={2} delay={0.1} isInvitesTab={isInvitesTab} /></div>
          <div role="link" tabIndex={0} className="cursor-pointer" onClick={() => first && openProfile(first.username)}><PodiumEntry person={first} place={1} delay={0.0} isInvitesTab={isInvitesTab} /></div>
          <div role="link" tabIndex={0} className="cursor-pointer" onClick={() => third && openProfile(third.username)}><PodiumEntry person={third} place={3} delay={0.2} isInvitesTab={isInvitesTab} /></div>
        </div>
      </m.div>

      {/* Full Ranking List */}
      <div className="rounded-2xl border border-white/8 bg-zinc-900/60 overflow-hidden">
        {leaderboard.length === 0 ? (
          <div className="py-16 text-center">
            <Trophy className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
            <p className="text-sm text-zinc-500">مفيش ترتيب هنا لسه.</p>
          </div>
        ) : (
          <div>
            {leaderboard.map((u: any, idx: number) => {
              const isMe = user && u.username === user.username;
              const rankLabel = u.rank ? rankName(u.rank) : '';

              return (
                <m.div
                  key={u.username}
                  role="link"
                  tabIndex={0}
                  onClick={() => openProfile(u.username)}
                  onKeyDown={(e) => { if (e.key === 'Enter') openProfile(u.username); }}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(idx, 10) * 0.03 }}
                  // Off-screen rows aren't rendered (or animated) at all
                  style={{ contentVisibility: 'auto', containIntrinsicSize: 'auto 64px' } as React.CSSProperties}
                  className={`cursor-pointer border-b border-white/5 last:border-b-0 transition-colors ${
                    isMe ? 'bg-orange-500/6' : 'hover:bg-white/2'
                  }`}
                >
                  {/* Nameplate in the person's current streak colours */}
                  <StreakNameplate days={u.streak_count || 0} override={cosmeticVisual((isMe ? user?.cosmetics : null)?.nameplate || u.cosmetics?.nameplate)} className="flex items-center gap-3 px-4 py-3">
                  {/* Rank Number / Medal */}
                  {idx < 3 ? (
                    <RankMedal rank={(idx + 1) as 1 | 2 | 3} size={32} />
                  ) : (
                    <span className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black flex-shrink-0 bg-white/8 text-zinc-400">
                      {u.rank_num}
                    </span>
                  )}

                  {/* Avatar */}
                  <UserAvatar
                    username={u.username}
                    avatarUrl={u.avatar_url}
                    equippedFrame={u.equipped_frame}
                    size={34}
                  />

                  {/* Name + Batch */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-[13px] font-black truncate ${isMe ? 'text-orange-400' : 'text-white'}`}>
                        <StreakName days={u.streak_count || 0} override={cosmeticVisual((isMe ? user?.cosmetics : null)?.name || u.cosmetics?.name)}>{u.username}</StreakName>
                      </span>
                      {isMe && (
                        <span className="px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400 text-2xs font-black">إنت</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5 min-w-0">
                      {(u.streak_count || 0) > 0 && <StreakChip days={u.streak_count} size="xs" />}
                      <p className="text-xs text-zinc-400 truncate">
                        {u.batch}{rankLabel ? ` · ${rankLabel}` : ''}
                      </p>
                    </div>
                  </div>

                  {/* XP / Invites Badge */}
                  {isInvitesTab ? (
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span className="px-2 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-2xs font-black text-emerald-300 tabular-nums">
                        {u.invites_count || 0} دعوة
                      </span>
                      <div className="px-2.5 py-1 rounded-lg bg-black/40 border border-emerald-500/25">
                        <span className="text-xs font-black text-emerald-400 tabular-nums" dir="ltr">+{u.xp.toLocaleString()} XP</span>
                      </div>
                    </div>
                  ) : (
                    <div className="px-2.5 py-1 rounded-lg bg-black/40 border border-orange-500/25 flex-shrink-0">
                      <span className="text-xs font-black text-orange-400" dir="ltr">{u.xp.toLocaleString()} XP</span>
                    </div>
                  )}
                  </StreakNameplate>
                </m.div>
              );
            })}
          </div>
        )}
      </div>
    </m.div>
  );
};
