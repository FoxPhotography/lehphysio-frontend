import React, { useState } from 'react';
import { StreakLadderModal } from '../streak/StreakLadder';
import { StreakAura, StreakFlame } from '../streak/Streak';
import { getStreakTheme, nextTierLine } from '../../utils/streakTheme';
import { rankProgress } from '../../utils/ranks';
import { daysLabel } from '../../utils/format';

interface StatsGridProps {
  user: any;
  leaderboard?: any[];
}

const card = 'glass-card p-4 sm:p-5 text-start relative overflow-hidden flex flex-col';
const label = 'text-xs font-bold text-zinc-500';

export const StatsGrid: React.FC<StatsGridProps> = ({ user, leaderboard = [] }) => {
  const [showLadder, setShowLadder] = useState(false);
  if (!user) return null;

  const xp = user.total_xp || 0;
  const { current, next, pct, remaining } = rankProgress(xp);
  const rankNum = user.global_rank;
  const totalRanked = user.total_users || leaderboard.length || 1;
  const topPct = rankNum && totalRanked > 0 ? Math.ceil((rankNum / totalRanked) * 100) : null;
  const streak = user.streak_count || 0;
  const theme = getStreakTheme(streak);

  return (
    <section className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4" aria-label="إحصائياتك">
      <div className={card}>
        <span className={label}>إجمالي XP</span>
        <div className="text-2xl font-black text-white mt-1" dir="ltr">{xp.toLocaleString('en-US')}</div>
        <svg className="absolute bottom-0 end-0 w-24 h-10 text-brand-orange/15 stroke-current fill-none stroke-[2]" viewBox="0 0 100 20" aria-hidden>
          <path d="M0,15 L10,12 L20,18 L30,10 L40,14 L50,8 L60,11 L70,5 L80,12 L90,6 L100,2" />
        </svg>
      </div>

      <div className={card}>
        <span className={label}>رتبتك</span>
        <div className="text-base font-black text-white mt-1 truncate">{current.emoji} {current.name}</div>
        <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden mt-3 border border-zinc-800/40" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
          <div className="bg-gradient-to-l from-brand-orange to-brand-amber h-full rounded-full" style={{ width: `${pct}%` }} />
        </div>
        <span className="text-2xs text-zinc-500 font-bold mt-1.5">
          {next ? <>باقي <bdi dir="ltr">{remaining.toLocaleString('en-US')} XP</bdi> على {next.name}</> : 'وصلت لأعلى رتبة 👑'}
        </span>
      </div>

      <div className={card}>
        <span className={label}>ترتيبك العام</span>
        <div className="text-2xl font-black text-white mt-1" dir="ltr">{rankNum ? `#${rankNum}` : '—'}</div>
        {topPct !== null && (
          <span className="text-2xs text-brand-orange font-extrabold mt-1 self-start bg-brand-orange/10 px-2 py-0.5 rounded-md">
            من أعلى {topPct}%
          </span>
        )}
      </div>

      <button type="button" onClick={() => setShowLadder(true)} aria-label="شوف مستويات الستريك" className={`${card} cursor-pointer active:scale-[0.98] transition-transform`} style={{ borderColor: theme.key !== 'none' ? `rgb(${theme.glow} / 0.35)` : undefined }}>
        <StreakAura days={streak} density="lite" />
        <span className="text-xs font-bold text-zinc-300 relative z-10">الستريك بتاعك</span>
        <div className="relative z-10 flex items-center gap-2 mt-1">
          <StreakFlame days={streak} size={28} />
          <span className="text-xl font-black text-white">{daysLabel(streak)}</span>
        </div>
        <span className="relative z-10 text-2xs font-extrabold mt-1.5 leading-snug" style={{ color: theme.text }}>
          {theme.key === 'none'
            ? 'ادخل النهارده وولّع الستريك 🔥'
            : `${theme.name} 🔥 ${nextTierLine(theme, streak)}`}
        </span>
      </button>
      <StreakLadderModal open={showLadder} onClose={() => setShowLadder(false)} days={streak} username={user.username} />
    </section>
  );
};
