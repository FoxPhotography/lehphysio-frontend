import React, { useEffect, useState } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { Gift, PackageOpen, Zap, X } from 'lucide-react';

export type SurpriseBoxPhase = 'charging' | 'burst' | 'revealed';

interface SurpriseBoxModalProps {
  open: boolean;
  phase: SurpriseBoxPhase;
  xpEarned: number;
  onClose: () => void;
}

const PARTICLE_COLORS = [
  'bg-violet-400',
  'bg-amber-400',
  'bg-fuchsia-400',
  'bg-emerald-400',
  'bg-cyan-400',
  'bg-rose-400',
];

const PARTICLES = Array.from({ length: 28 }, (_, i) => {
  const angle = (i / 28) * Math.PI * 2 + (i % 3) * 0.12;
  const distance = 110 + ((i * 37) % 130);
  return {
    id: i,
    x: Math.cos(angle) * distance,
    y: Math.sin(angle) * distance,
    size: 6 + (i % 4) * 3,
    rotate: (i % 2 === 0 ? 1 : -1) * (120 + (i * 45) % 240),
    delay: (i % 5) * 0.025,
    color: PARTICLE_COLORS[i % PARTICLE_COLORS.length],
    isRound: i % 3 === 0,
  };
});

export const SurpriseBoxModal: React.FC<SurpriseBoxModalProps> = ({
  open,
  phase,
  xpEarned,
  onClose,
}) => {
  const [displayXp, setDisplayXp] = useState(0);

  useEffect(() => {
    if (!open || phase === 'charging') {
      setDisplayXp(0);
      return;
    }
    if (xpEarned <= 0) return;

    const duration = 650;
    const start = performance.now();
    let rafId = 0;

    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayXp(Math.round(eased * xpEarned));
      if (progress < 1) {
        rafId = requestAnimationFrame(tick);
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [open, phase, xpEarned]);

  const isBurstOrRevealed = phase === 'burst' || phase === 'revealed';

  return (
    <AnimatePresence>
      {open && (
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={phase === 'revealed' ? onClose : undefined}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md select-none overflow-hidden"
        >
          {/* Ambient radial glow */}
          <m.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{
              scale: isBurstOrRevealed ? 1.35 : [0.85, 1.05, 0.95],
              opacity: isBurstOrRevealed ? 0.55 : 0.35,
            }}
            transition={{
              duration: isBurstOrRevealed ? 0.5 : 1.1,
              repeat: isBurstOrRevealed ? 0 : Infinity,
              repeatType: 'reverse',
            }}
            className="absolute w-[420px] h-[420px] rounded-full bg-gradient-radial from-violet-600/50 via-amber-500/20 to-transparent blur-3xl pointer-events-none"
          />

          {/* Rotating sunbeam rays on burst & reveal */}
          {isBurstOrRevealed && (
            <m.div
              initial={{ opacity: 0, scale: 0.4, rotate: 0 }}
              animate={{ opacity: 0.45, scale: 1.2, rotate: 360 }}
              transition={{
                opacity: { duration: 0.35 },
                scale: { duration: 0.45, ease: 'easeOut' },
                rotate: { duration: 18, repeat: Infinity, ease: 'linear' },
              }}
              className="absolute w-[520px] h-[520px] rounded-full pointer-events-none"
              style={{
                background:
                  'repeating-conic-gradient(from 0deg, rgba(167,139,250,0.22) 0deg 12deg, transparent 12deg 30deg)',
                maskImage: 'radial-gradient(circle, black 25%, transparent 70%)',
                WebkitMaskImage: 'radial-gradient(circle, black 25%, transparent 70%)',
              }}
            />
          )}

          {/* White/Violet screen flash on burst */}
          {isBurstOrRevealed && (
            <m.div
              initial={{ opacity: 0.85 }}
              animate={{ opacity: 0 }}
              transition={{ duration: 0.45, ease: 'easeOut' }}
              className="fixed inset-0 bg-gradient-to-br from-violet-200 via-white to-amber-200 pointer-events-none z-50"
            />
          )}

          {/* Shockwave ring */}
          {isBurstOrRevealed && (
            <m.div
              initial={{ scale: 0.3, opacity: 0.95 }}
              animate={{ scale: 3.4, opacity: 0 }}
              transition={{ duration: 0.65, ease: 'easeOut' }}
              className="absolute w-36 h-36 rounded-full border-4 border-amber-300/80 shadow-[0_0_40px_rgba(251,191,36,0.6)] pointer-events-none"
            />
          )}

          {/* Confetti / Spark burst particles */}
          {isBurstOrRevealed && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              {PARTICLES.map((p) => (
                <m.span
                  key={p.id}
                  initial={{ x: 0, y: 0, scale: 0, rotate: 0, opacity: 1 }}
                  animate={{
                    x: p.x,
                    y: p.y,
                    scale: [0, 1.25, 0.8],
                    rotate: p.rotate,
                    opacity: [1, 1, 0],
                  }}
                  transition={{
                    duration: 0.85,
                    delay: p.delay,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  style={{ width: p.size, height: p.size }}
                  className={`absolute ${p.color} ${
                    p.isRound ? 'rounded-full' : 'rounded-sm'
                  } shadow-lg`}
                />
              ))}
            </div>
          )}

          {/* Stage 1: Charging & Shaking Pack */}
          {phase === 'charging' && (
            <div className="relative z-10 flex flex-col items-center gap-6">
              <div className="relative flex items-center justify-center">
                {/* Pulsing energy rings */}
                <m.div
                  animate={{ scale: [1, 1.45, 1], opacity: [0.6, 0, 0.6] }}
                  transition={{ duration: 0.7, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute w-36 h-36 rounded-3xl border-2 border-violet-400/60"
                />
                <m.div
                  animate={{ scale: [1.1, 1.7, 1.1], opacity: [0.4, 0, 0.4] }}
                  transition={{ duration: 0.7, delay: 0.2, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute w-36 h-36 rounded-3xl border border-amber-400/50"
                />

                {/* Shaking Box */}
                <m.div
                  animate={{
                    rotate: [0, -5, 5, -9, 9, -12, 12, -14, 14, 0],
                    scale: [1, 1.04, 1.02, 1.08, 1.05, 1.12, 1.1, 1.18, 1.22],
                    y: [0, -3, 2, -5, 3, -6, 0],
                  }}
                  transition={{
                    duration: 1.1,
                    ease: 'easeIn',
                  }}
                  className="relative w-32 h-32 rounded-3xl bg-gradient-to-br from-violet-500/30 via-purple-600/25 to-amber-500/20 border-2 border-violet-400/60 flex items-center justify-center shadow-[0_0_50px_rgba(139,92,246,0.6)]"
                >
                  <Gift className="w-16 h-16 text-violet-300 drop-shadow-[0_0_16px_rgba(167,139,250,0.9)]" />
                </m.div>
              </div>

              <m.p
                animate={{ opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 0.8, repeat: Infinity }}
                className="text-base font-black text-white tracking-wide"
              >
                جاري فتح الصندوق...
              </m.p>
            </div>
          )}

          {/* Stage 2 & 3: Reward Card Reveal */}
          {isBurstOrRevealed && (
            <m.div
              initial={{ scale: 0.25, y: 40, rotate: -6, opacity: 0 }}
              animate={{ scale: 1, y: 0, rotate: 0, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 320, damping: 18 }}
              onClick={(e) => e.stopPropagation()}
              className="relative z-20 w-full max-w-xs rounded-3xl p-[2px] bg-gradient-to-br from-amber-400 via-violet-500 to-fuchsia-500 shadow-[0_0_60px_rgba(139,92,246,0.45)]"
            >
              <div className="relative rounded-[22px] bg-zinc-950/95 px-6 pt-8 pb-6 flex flex-col items-center text-center overflow-hidden">
                {/* Close icon */}
                {phase === 'revealed' && (
                  <button
                    type="button"
                    onClick={onClose}
                    aria-label="إغلاق"
                    className="absolute top-3.5 end-3.5 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}

                {/* Open box badge */}
                <m.div
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 16, delay: 0.1 }}
                  className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500/25 to-amber-500/20 border border-amber-400/40 flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(251,191,36,0.25)]"
                >
                  <PackageOpen className="w-10 h-10 text-amber-300" />
                </m.div>

                <span className="inline-flex items-center px-3 py-1 rounded-full text-2xs font-black bg-violet-500/15 text-violet-300 border border-violet-500/30 mb-2">
                  صندوق اليوم
                </span>

                <m.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.12 }}
                  dir="ltr"
                  className="flex items-center justify-center gap-2 my-2"
                >
                  <Zap className="w-8 h-8 text-amber-400 fill-amber-400 drop-shadow-[0_0_12px_rgba(251,191,36,0.7)]" />
                  <span className="text-4xl font-black bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 bg-clip-text text-transparent tabular-nums">
                    +{displayXp} XP
                  </span>
                </m.div>

                <p className="text-xs font-bold text-zinc-400 mt-1 mb-6">
                  عاش! اتضافت نقط الخبرة لحسابك
                </p>

                <m.button
                  type="button"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={onClose}
                  className="w-full py-3 rounded-xl font-black text-sm text-black bg-gradient-to-r from-amber-400 to-yellow-300 hover:from-amber-300 hover:to-yellow-200 shadow-lg shadow-amber-500/25 transition-all cursor-pointer"
                >
                  استلام المكافأة
                </m.button>
              </div>
            </m.div>
          )}
        </m.div>
      )}
    </AnimatePresence>
  );
};
