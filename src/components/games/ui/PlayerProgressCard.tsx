import React from 'react';
import { Store, Zap, Target, LogIn } from 'lucide-react';
import { UserAvatar } from '../../UserAvatar';
import { StreakFlame } from '../../streak/Streak';
import { getStreakTheme } from '../../../utils/streakTheme';
import { rankName, rankEmoji, rankProgress } from '../../../utils/ranks';
import { AnimatedNumber } from './AnimatedNumber';

interface PlayerProgressCardProps {
  user: any;
  dailyPlays?: Record<number, number>;
  hasSpunToday: boolean;
  onOpenStore: () => void;
  onLoginClick?: () => void;
}

export const PlayerProgressCard: React.FC<PlayerProgressCardProps> = ({
  user,
  dailyPlays = {},
  hasSpunToday,
  onOpenStore,
  onLoginClick,
}) => {
  if (!user) {
    return (
      <section
        data-accent="orange"
        className="lp-rise rounded-[var(--g-radius-lg)] bg-[#111113] border border-white/[0.07] p-4 md:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
      >
        <div className="space-y-1 text-start">
          <h2 className="text-lg md:text-xl font-black text-white">ساحة ألعاب ليه فيزيو</h2>
          <p className="text-xs text-zinc-400 font-semibold">
            سجّل دخول عشان تحفظ الـ XP، الستريك اليومي، وتنافس دفعتك على الليدربورد.
          </p>
        </div>
        {onLoginClick && (
          <button
            type="button"
            onClick={onLoginClick}
            className="lp-press min-h-[44px] px-4 py-2 rounded-xl bg-brand-orange text-black font-black text-xs flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            <span>تسجيل الدخول</span>
          </button>
        )}
      </section>
    );
  }

  const totalXp = Number(user.total_xp || 0);
  const progress = rankProgress(totalXp);
  const currentRankLabel = rankName(user.rank || { tier: progress.current.tier });
  const currentRankIcon = rankEmoji(user.rank || { tier: progress.current.tier });

  const streakDays = Number(user.streak_count || 0);
  const st = getStreakTheme(streakDays);
  const hasStreak = st.key !== 'none';
  const streakLabel =
    streakDays > 0
      ? streakDays === 1
        ? 'يوم واحد'
        : streakDays === 2
        ? 'يومين'
        : streakDays > 10
        ? `${streakDays} يوم`
        : `${streakDays} أيام`
      : '0 أيام';

  const totalDailyPlaysUsed = [1, 2, 3, 4, 5, 6, 7].reduce(
    (sum, id) => sum + Math.min(3, Number(dailyPlays?.[id] ?? 0)),
    0
  );
  const dailyMax = 21;

  return (
    <section
      data-accent="orange"
      className="lp-rise rounded-[var(--g-radius-lg)] bg-[#111113] border border-white/[0.08] p-3.5 sm:p-4 md:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-3.5"
    >
      {/* Identity + Rank Bar */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <UserAvatar
          username={user.username}
          avatarUrl={user.avatar_url}
          equippedFrame={user.equipped_frame}
          size={52}
          eager
        />
        <div className="flex-1 min-w-0 space-y-1.5 text-start">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm md:text-base font-black text-white truncate max-w-[160px]" dir="auto">
              {user.username}
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-brand-orange/15 border border-brand-orange/30 text-brand-amber text-[11px] font-black">
              <span aria-hidden="true">{currentRankIcon}</span>
              <span>{currentRankLabel}</span>
            </span>
          </div>

          {/* Animated XP bar using scaleX */}
          <div className="space-y-1 max-w-sm">
            <div
              className="h-2 rounded-full bg-zinc-900 border border-white/[0.06] overflow-hidden"
              role="progressbar"
              aria-valuenow={Math.round(progress.pct)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="تقدم المستوى"
            >
              <div
                className="h-full w-full rounded-full bg-gradient-to-l from-brand-orange to-brand-amber transition-transform duration-700 ease-out"
                style={{
                  transform: `scaleX(${Math.max(0.03, progress.pct / 100)})`,
                  transformOrigin: 'right center',
                }}
              />
            </div>
            <p className="text-[11px] font-bold text-zinc-400">
              {progress.next ? (
                <>
                  باقي <span className="text-zinc-200 font-black tabular-nums" dir="ltr">{progress.remaining.toLocaleString('en-US')}</span> XP على {progress.next.name}
                </>
              ) : (
                'وصلت أعلى مستوى 🎉'
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Achievement Pills + Store Button */}
      <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0">
        {/* Total XP */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-[#17171a] border border-white/[0.07]">
          <Zap className="w-4 h-4 text-brand-amber fill-current shrink-0" />
          <div className="text-start leading-tight">
            <span className="block text-[10px] font-bold text-zinc-400">مجموع XP</span>
            <AnimatedNumber value={totalXp} className="text-xs font-black text-white" />
          </div>
        </div>

        {/* Streak */}
        <div
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl border"
          style={{
            backgroundColor: hasStreak ? `rgb(${st.glow} / 0.12)` : '#17171a',
            borderColor: hasStreak ? `rgb(${st.glow} / 0.35)` : 'rgba(255,255,255,0.07)',
          }}
        >
          <StreakFlame days={streakDays} size={18} />
          <div className="text-start leading-tight">
            <span className="block text-[10px] font-bold text-zinc-400">الستريك</span>
            <span className="text-xs font-black whitespace-nowrap" style={{ color: hasStreak ? st.text : '#e4e4e7' }}>
              {streakLabel}
            </span>
          </div>
        </div>

        {/* Daily Progress */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-[#17171a] border border-white/[0.07]">
          <Target className="w-4 h-4 text-emerald-400 shrink-0" />
          <div className="text-start leading-tight">
            <span className="block text-[10px] font-bold text-zinc-400">محاولات النهارده</span>
            <span className="text-xs font-black text-emerald-300 tabular-nums" dir="ltr">
              {totalDailyPlaysUsed}/{dailyMax}
            </span>
          </div>
        </div>

        {/* Spin chip (hidden on very narrow widths if needed, kept compact) */}
        <div
          className={`hidden sm:flex items-center px-2.5 py-1.5 rounded-2xl border text-[11px] font-black whitespace-nowrap ${
            hasSpunToday
              ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300'
              : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
          }`}
        >
          {hasSpunToday ? 'لفّيت العجلة ✓' : 'العجلة جاهزة ⚡'}
        </div>

        {/* Store Access */}
        <button
          type="button"
          onClick={onOpenStore}
          aria-label="المتجر"
          className="lp-press min-h-[44px] px-3 py-2 rounded-2xl bg-[#17171a] hover:bg-zinc-800 border border-white/10 hover:border-brand-orange/40 text-zinc-200 font-black text-xs flex items-center gap-1.5 cursor-pointer shrink-0"
        >
          <Store className="w-4 h-4 text-brand-amber" />
          <span>المتجر</span>
        </button>
      </div>
    </section>
  );
};
