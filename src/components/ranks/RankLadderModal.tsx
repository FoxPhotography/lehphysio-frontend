import React, { useEffect } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { X, Check, Lock, Sparkles } from 'lucide-react';
import { RANKS, rankProgress } from '../../utils/ranks';

interface RankLadderModalProps {
  open: boolean;
  onClose: () => void;
  totalXp: number;
  username?: string;
}

const RANK_COLORS: Record<number, { border: string; bg: string; text: string; glow: string }> = {
  1: { border: 'border-zinc-700/70', bg: 'from-zinc-800/70 to-zinc-900/90', text: '#a1a1aa', glow: 'rgba(161,161,170,0.2)' },
  2: { border: 'border-amber-500/40', bg: 'from-amber-500/20 to-orange-600/10', text: '#fbbf24', glow: 'rgba(251,191,36,0.25)' },
  3: { border: 'border-emerald-500/40', bg: 'from-emerald-500/20 to-teal-600/10', text: '#34d399', glow: 'rgba(52,211,153,0.25)' },
  4: { border: 'border-cyan-500/45', bg: 'from-cyan-500/20 to-blue-600/10', text: '#22d3ee', glow: 'rgba(34,211,238,0.28)' },
  5: { border: 'border-yellow-400/60', bg: 'from-yellow-500/25 via-amber-500/15 to-orange-500/15', text: '#fde047', glow: 'rgba(250,204,21,0.35)' },
};

/**
 * Tap the rank card → shows current rank, XP progress to next rank,
 * and every rank tier with its XP threshold and remaining XP.
 */
export const RankLadderModal: React.FC<RankLadderModalProps> = ({ open, onClose, totalXp, username }) => {
  const xp = Math.max(0, Number(totalXp) || 0);
  const { current, next, pct, remaining } = rankProgress(xp);
  const currentStyle = RANK_COLORS[current.tier] || RANK_COLORS[1];

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.history.pushState({ rankLadder: true }, '');
    const onPop = () => onClose();
    window.addEventListener('keydown', onKey);
    window.addEventListener('popstate', onPop);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('popstate', onPop);
      if (window.history.state?.rankLadder) window.history.back();
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <m.div
          className="fixed inset-0 z-[12000] bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <m.div
            role="dialog"
            aria-label="سلم الرتب والمستويات"
            className="w-full sm:max-w-md max-h-[88dvh] overflow-y-auto rounded-t-3xl sm:rounded-3xl border border-white/10 bg-zinc-950 p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] text-start shadow-2xl"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 420, damping: 34 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/15 sm:hidden" />

            {/* Current rank header */}
            <div className="flex items-start gap-3">
              <div
                className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${currentStyle.bg} border ${currentStyle.border} flex items-center justify-center text-2xl shrink-0`}
                style={{ boxShadow: `0 0 20px ${currentStyle.glow}` }}
              >
                {current.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-zinc-500">رتبتك الحالية{username ? ` · @${username}` : ''}</p>
                <p className="text-2xl font-black text-white leading-tight truncate">{current.name}</p>
                <p className="text-xs font-black mt-0.5 text-brand-orange tabular-nums" dir="ltr">
                  {xp.toLocaleString('en-US')} XP
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="اقفل"
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-400 cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Progress to next rank */}
            <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-3.5">
              <p className="text-sm font-black text-white leading-relaxed">
                {next
                  ? <>فاضلك <bdi dir="ltr" className="text-brand-amber">{remaining.toLocaleString('en-US')} XP</bdi> وتوصل لـ {next.emoji} {next.name}</>
                  : 'وصلت لأعلى رتبة في ليه فيزيو — أسطورة حقيقية 👑'}
              </p>
              <div
                className="mt-3 h-2.5 rounded-full bg-white/8 overflow-hidden"
                role="progressbar"
                aria-valuenow={Math.round(pct)}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <m.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.max(4, pct)}%` }}
                  transition={{ duration: 0.7, ease: 'easeOut' }}
                  className="h-full rounded-full bg-gradient-to-r from-brand-orange to-amber-400"
                />
              </div>
              {next && (
                <div className="mt-1.5 flex justify-between text-2xs font-bold text-zinc-500 tabular-nums">
                  <span dir="ltr">{xp.toLocaleString('en-US')} / {next.min.toLocaleString('en-US')} XP</span>
                  <span style={{ color: RANK_COLORS[next.tier]?.text || '#fbbf24' }}>
                    {next.emoji} {next.name} ({Math.round(pct)}%)
                  </span>
                </div>
              )}
            </div>

            {/* Full Rank Ladder */}
            <p className="mt-5 mb-2.5 text-xs font-black text-zinc-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-brand-orange" />
              <span>سلم الرتب — تكلفة كل رتبة</span>
            </p>
            <div className="space-y-2.5">
              {RANKS.map((r) => {
                const reached = xp >= r.min;
                const isCurrent = current.tier === r.tier;
                const left = Math.max(0, r.min - xp);
                const style = RANK_COLORS[r.tier] || RANK_COLORS[1];

                return (
                  <div
                    key={r.tier}
                    className={`rounded-2xl px-3.5 py-3 flex items-center gap-3 border bg-gradient-to-r ${style.bg} ${style.border} transition-all ${
                      isCurrent ? 'ring-2 ring-white/75 shadow-lg' : reached ? 'opacity-95' : 'opacity-75'
                    }`}
                    style={isCurrent ? { boxShadow: `0 0 22px ${style.glow}` } : undefined}
                  >
                    <div className="w-10 h-10 rounded-xl bg-black/35 border border-white/10 flex items-center justify-center text-xl shrink-0">
                      {r.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black text-white truncate">
                        {r.name}
                      </p>
                      <p className="text-2xs font-bold text-zinc-300/80 tabular-nums" dir="ltr">
                        {r.min === 0 ? 'البداية (0 XP)' : `${r.min.toLocaleString('en-US')} XP`}
                      </p>
                    </div>
                    <div className="shrink-0 text-end">
                      {isCurrent ? (
                        <span className="inline-block px-2.5 py-1 rounded-lg bg-white text-black text-2xs font-black">
                          انت هنا
                        </span>
                      ) : reached ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-black/40 text-emerald-300 text-2xs font-black border border-emerald-500/25">
                          <Check className="w-3 h-3" /> عدّيته
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-black/45 text-zinc-200 text-2xs font-black whitespace-nowrap border border-white/10">
                          <Lock className="w-3 h-3 text-amber-400" />
                          <span>فاضلك <bdi dir="ltr">{left.toLocaleString('en-US')}</bdi></span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <p className="mt-4 text-2xs font-semibold text-zinc-500 leading-relaxed">
              اجمع XP من متابعة الحلقات، حل الكويزات، الألعاب اليومية، والستريك عشان توصل لقمة الفيزيو! 🚀
            </p>
          </m.div>
        </m.div>
      )}
    </AnimatePresence>
  );
};
