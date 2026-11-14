import { useAuth } from '../context/AuthContext';
import { rankName } from '../utils/ranks';
import React from 'react';
import { m } from 'framer-motion';
import { Trophy, Crown, Medal, Star } from 'lucide-react';
import { UserAvatar } from '../components/UserAvatar';
import { StreakNameplate, StreakName, StreakChip } from '../components/streak/Streak';
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
}> = ({ person, place, delay = 0 }) => {
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

      {/* XP */}
      <span className="text-2xs text-zinc-500 font-medium">
        {empty ? '0 XP' : `${person.xp.toLocaleString()} XP`}
      </span>
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
    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
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
  const { changePage } = useAuth();
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
      <div className="flex gap-2 flex-wrap mb-6">
        <TabPill label="الكل"    active={leaderboardTab === 'all-time'} onClick={() => setLeaderboardTab('all-time')} />
        <TabPill label="الأسبوع"      active={leaderboardTab === 'weekly'}   onClick={() => setLeaderboardTab('weekly')} />
        {user && (
          <TabPill
            label={`دفعتي (${user.batch})`}
            active={leaderboardTab === 'batch'}
            onClick={() => setLeaderboardTab('batch')}
          />
        )}
      </div>

      {/* Podium */}
      <div className="rounded-2xl border border-white/8 bg-zinc-900/60 p-6 mb-5">
        <div className="flex items-end justify-center gap-4 sm:gap-6">
          <div role="link" tabIndex={0} className="cursor-pointer" onClick={() => second && openProfile(second.username)}><PodiumEntry person={second} place={2} delay={0.1} /></div>
          <div role="link" tabIndex={0} className="cursor-pointer" onClick={() => first && openProfile(first.username)}><PodiumEntry person={first} place={1} delay={0.0} /></div>
          <div role="link" tabIndex={0} className="cursor-pointer" onClick={() => third && openProfile(third.username)}><PodiumEntry person={third} place={3} delay={0.2} /></div>
        </div>
      </div>

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
                  className={`cursor-pointer border-b border-white/5 last:border-b-0 transition-colors ${
                    isMe ? 'bg-orange-500/6' : 'hover:bg-white/2'
                  }`}
                >
                  {/* Nameplate in the person's current streak colours */}
                  <StreakNameplate days={u.streak_count || 0} override={cosmeticVisual((isMe ? user?.cosmetics : null)?.nameplate || u.cosmetics?.nameplate)} className="flex items-center gap-3 px-4 py-3">
                  {/* Rank Number */}
                  <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black flex-shrink-0 ${
                    idx === 0 ? 'bg-amber-500 text-black' :
                    idx === 1 ? 'bg-zinc-400 text-black' :
                    idx === 2 ? 'bg-amber-700 text-white' :
                    'bg-white/8 text-zinc-400'
                  }`}>
                    {idx === 0 ? <Crown className="w-3.5 h-3.5" /> : u.rank_num}
                  </span>

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

                  {/* XP Badge */}
                  <div className="px-2.5 py-1 rounded-lg bg-black/40 border border-orange-500/25 flex-shrink-0">
                    <span className="text-xs font-black text-orange-400" dir="ltr">{u.xp.toLocaleString()} XP</span>
                  </div>
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
