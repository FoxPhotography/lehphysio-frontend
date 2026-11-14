import React, { useEffect } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { X, Check, Lock } from 'lucide-react';
import { STREAK_LADDER, getStreakTheme, nextTierLine } from '../../utils/streakTheme';
import { StreakFlame, StreakNameplate, StreakName } from './Streak';
import { daysLabel } from '../../utils/format';

/**
 * Tap the streak card → full sentence + every tier with how it looks, the day
 * it starts and how many days are left, so people can see what's coming.
 */
export const StreakLadderModal: React.FC<{ open: boolean; onClose: () => void; days: number; username?: string }> = ({ open, onClose, days, username }) => {
  const d = Math.max(0, Number(days) || 0);
  const theme = getStreakTheme(d);
  const next = STREAK_LADDER.find(t => t.min > d) || null;
  const prevMin = [...STREAK_LADDER].reverse().find(t => t.min <= d)?.min ?? 0;
  const pct = next ? Math.min(100, Math.max(4, ((d - prevMin) / (next.min - prevMin)) * 100)) : 100;

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    // Phone back button closes the sheet instead of leaving the page
    window.history.pushState({ streakLadder: true }, '');
    const onPop = () => onClose();
    window.addEventListener('keydown', onKey);
    window.addEventListener('popstate', onPop);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('popstate', onPop);
      if (window.history.state?.streakLadder) window.history.back();
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <m.div
          className="fixed inset-0 z-[12000] bg-black/70 flex items-end sm:items-center justify-center sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <m.div
            role="dialog"
            aria-label="مستويات الستريك"
            className="w-full sm:max-w-md max-h-[88dvh] overflow-y-auto rounded-t-3xl sm:rounded-3xl border border-white/10 bg-zinc-950 p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] text-start"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 420, damping: 34 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/15 sm:hidden" />

            {/* Current status */}
            <div className="flex items-start gap-3">
              <StreakFlame days={d} size={46} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-zinc-500">الستريك بتاعك</p>
                <p className="text-2xl font-black text-white leading-tight">{daysLabel(d)}</p>
                <p className="text-xs font-black mt-0.5" style={{ color: theme.text }}>{theme.name} — {theme.tagline}</p>
              </div>
              <button type="button" onClick={onClose} aria-label="اقفل" className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-400 cursor-pointer shrink-0">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Full sentence + progress to the next tier */}
            <div className="mt-4 rounded-2xl border border-white/8 bg-white/[0.03] p-3.5">
              <p className="text-sm font-black text-white leading-relaxed">
                {next ? `${nextTierLine(theme, d)} 🔥` : 'وصلت لأعلى مستوى — حافظ عليه كل يوم 👑'}
              </p>
              <div className="mt-3 h-2 rounded-full bg-white/8 overflow-hidden" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
                <div
                  className="h-full rounded-full"
                  style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${theme.key === 'none' ? '#52525b' : theme.c1}, ${next ? next.c2 : theme.c2})` }}
                />
              </div>
              {next && (
                <div className="mt-1.5 flex justify-between text-2xs font-bold text-zinc-500 tabular-nums">
                  <span>{d} / {next.min} يوم</span>
                  <span style={{ color: next.text }}>{next.name}</span>
                </div>
              )}
            </div>

            {/* The ladder: every tier with its look */}
            <p className="mt-5 mb-2.5 text-xs font-black text-zinc-400">المستويات — شوف شكلك هيبقى عامل إزاي</p>
            <div className="space-y-2.5">
              {STREAK_LADDER.map(t => {
                const reached = d >= t.min;
                const current = theme.key === t.key;
                const left = t.min - d;
                return (
                  <StreakNameplate
                    key={t.key}
                    days={t.min}
                    className={`rounded-2xl px-3.5 py-3 flex items-center gap-3 ${current ? 'ring-2 ring-white/70' : ''} ${reached || current ? '' : 'opacity-90'}`}
                  >
                    <div className="relative z-10 shrink-0"><StreakFlame days={t.min} size={30} /></div>
                    <div className="relative z-10 flex-1 min-w-0">
                      <p className="text-sm font-black truncate">
                        <StreakName days={t.min}>{username || t.name}</StreakName>
                      </p>
                      <p className="text-2xs font-bold text-white/75 truncate">
                        {t.name} · من {daysLabel(t.min)}
                      </p>
                    </div>
                    <div className="relative z-10 shrink-0 text-end">
                      {current ? (
                        <span className="inline-block px-2 py-1 rounded-lg bg-white text-black text-2xs font-black">انت هنا</span>
                      ) : reached ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-black/40 text-white text-2xs font-black"><Check className="w-3 h-3" /> عدّيته</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-black/45 text-white text-2xs font-black whitespace-nowrap">
                          <Lock className="w-3 h-3" /> فاضلك {daysLabel(left)}
                        </span>
                      )}
                    </div>
                  </StreakNameplate>
                );
              })}
            </div>

            <p className="mt-4 text-2xs font-semibold text-zinc-500 leading-relaxed">
              ادخل كل يوم عشان الستريك يكبر. لو فوّت يوم كامل الستريك بيرجع من الأول ويرجع لونك عادي.
            </p>
          </m.div>
        </m.div>
      )}
    </AnimatePresence>
  );
};
