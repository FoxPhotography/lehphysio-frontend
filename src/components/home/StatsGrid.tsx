import React from 'react';
import { Flame, Trophy, Sparkles } from 'lucide-react';

interface StatsGridProps {
  user: any;
  leaderboard?: any[];
}

export const StatsGrid: React.FC<StatsGridProps> = ({ user, leaderboard = [] }) => {
  if (!user) return null;

  const rankNum = user.global_rank;
  const totalRanked = user.total_users || leaderboard.length || 1;
  const topPct = rankNum && totalRanked > 0 ? Math.ceil((rankNum / totalRanked) * 100) : null;

  return (
    <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="glass-card p-5 text-start relative overflow-hidden">
        <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">إجمالي XP</span>
        <div className="text-2xl font-black text-white mt-1">{(user.total_xp || 0).toLocaleString()}</div>
        {/* Sparkline decoration */}
        <svg className="absolute bottom-0 end-0 w-24 h-10 text-brand-orange/15 stroke-current fill-none stroke-[2]" viewBox="0 0 100 20">
          <path d="M0,15 L10,12 L20,18 L30,10 L40,14 L50,8 L60,11 L70,5 L80,12 L90,6 L100,2" />
        </svg>
      </div>
      
      <div className="glass-card p-5 text-start">
        <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">المستوى</span>
        <div className="text-2xl font-black text-white mt-1">{Math.floor((user.total_xp || 0) / 1000) + 1}</div>
        <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden mt-3.5 border border-zinc-800/40">
          <div className="bg-gradient-to-r from-brand-orange to-brand-amber h-full" style={{ width: `${(user.total_xp % 1000) / 10}%` }}></div>
        </div>
        <div className="flex justify-between text-2xs text-zinc-500 font-bold mt-1.5 uppercase">
          <span dir="ltr">{user.total_xp % 1000} XP</span>
          <span>1,000 XP</span>
        </div>
      </div>

      <div className="glass-card p-5 text-start flex flex-col justify-between">
        <div>
          <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">ترتيبك العام</span>
          <div className="text-2xl font-black text-white mt-1">{rankNum ? `#${rankNum}` : '—'}</div>
          {topPct !== null && (
            <span className="text-2xs text-brand-orange font-extrabold mt-1 inline-block bg-brand-orange/10 px-2 py-0.5 rounded-md">
              أعلى {topPct}%
            </span>
          )}
        </div>
      </div>

      <div className="glass-card p-5 text-start flex flex-col justify-between">
        <div>
          <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">الأوسمة</span>
          <div className="flex flex-wrap gap-2 mt-2">
            <span className="w-7 h-7 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-xs shrink-0" title="أيام متتالية">
              <Flame className="w-4 h-4 text-brand-orange fill-current" />
            </span>
            <span className="w-7 h-7 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-xs shrink-0" title="من الأوائل">
              <Trophy className="w-4 h-4 text-brand-amber fill-current" />
            </span>
            <span className="w-7 h-7 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-xs shrink-0" title="حلّيت كويز">
              <Sparkles className="w-4 h-4 text-yellow-300" />
            </span>
            <span className="h-7 px-2 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-2xs font-black text-zinc-400 select-none">
              +12
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
