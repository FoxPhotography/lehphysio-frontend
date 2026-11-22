import React, { useEffect, useRef } from 'react';
import { Trophy, RotateCcw, ArrowRight, AlertCircle } from 'lucide-react';
import { fireWinConfetti, firePodiumFireworks } from '../../../utils/confetti';
import { playSound } from '../../../utils/soundEngine';
import { AnimatedNumber } from './AnimatedNumber';
import type { GameAccent } from './GameTile';
import { Mascot, type MascotCharacter } from './Mascot';

interface StatItem {
  label: string;
  value: string;
}

interface GameResultScreenProps {
  status: 'won' | 'lost';
  accent: GameAccent;
  character?: MascotCharacter;
  tier?: 'standard' | 'major' | 'legendary';
  isPractice?: boolean;
  title: string;
  subtitle?: string;
  xp?: number;
  stats?: StatItem[];
  successMsg?: string;
  errorMsg?: string;
  onReplay?: () => void;
  replayLabel?: string;
  onBack?: () => void;
  backLabel?: string;
}

const BURST_ANGLES = [
  { bx: '-38px', by: '-30px' },
  { bx: '0px', by: '-44px' },
  { bx: '38px', by: '-30px' },
  { bx: '-46px', by: '4px' },
  { bx: '46px', by: '4px' },
  { bx: '-32px', by: '34px' },
  { bx: '0px', by: '40px' },
  { bx: '32px', by: '34px' },
];

export const GameResultScreen: React.FC<GameResultScreenProps> = ({
  status,
  accent,
  character,
  tier = 'major',
  isPractice = false,
  title,
  subtitle,
  xp,
  stats = [],
  successMsg,
  errorMsg,
  onReplay,
  replayLabel = 'العب تاني',
  onBack,
  backLabel = 'رجوع للألعاب',
}) => {
  const effectsFiredRef = useRef(false);

  useEffect(() => {
    if (status !== 'won' || effectsFiredRef.current) return;
    effectsFiredRef.current = true;
    playSound(tier === 'legendary' ? 'jackpot' : 'game_win');

    const reduced =
      typeof window !== 'undefined' &&
      (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ||
        document.documentElement.classList.contains('fx-lite'));
    if (!reduced) {
      if (tier === 'legendary') {
        firePodiumFireworks();
      } else {
        fireWinConfetti();
      }
    }
  }, [status, tier]);

  const isWon = status === 'won';

  return (
    <div
      data-accent={accent}
      className={`lp-rise relative overflow-hidden rounded-3xl border bg-[#111113] p-6 md:p-8 text-center flex flex-col items-center gap-4 ${
        isWon
          ? tier === 'legendary'
            ? 'border-amber-400/45 lp-shimmer-sweep'
            : 'border-emerald-500/30'
          : 'lp-shake border-zinc-700/80'
      }`}
    >
      {/* Badge / Mascot + Lightweight CSS Particle Burst */}
      <div className="relative flex items-center justify-center gap-3 my-1">
        {isWon &&
          BURST_ANGLES.map((pos, idx) => (
            <span
              key={idx}
              aria-hidden="true"
              className="lp-burst-dot absolute w-2 h-2 rounded-full pointer-events-none"
              style={
                {
                  backgroundColor: idx % 2 === 0 ? 'rgb(var(--a))' : '#fbbf24',
                  '--bx': pos.bx,
                  '--by': pos.by,
                } as React.CSSProperties
              }
            />
          ))}

        {character && (
          <Mascot
            character={character}
            mood={isWon ? 'celebrating' : 'encouraging'}
            size={68}
          />
        )}

        <div
          className={`lp-pop relative w-14 h-14 rounded-2xl flex items-center justify-center border ${
            isWon ? 'bg-amber-500/15 border-amber-400/35 text-brand-amber' : 'bg-zinc-900 border-zinc-700 text-zinc-400'
          }`}
        >
          {isWon ? <Trophy className="w-7 h-7" /> : <AlertCircle className="w-7 h-7" />}
        </div>
      </div>

      <div className="space-y-1.5 max-w-md">
        <h3 className="text-lg md:text-xl font-black text-white leading-snug">{title}</h3>
        {subtitle && <p className="text-xs md:text-sm font-semibold text-zinc-400">{subtitle}</p>}
      </div>

      {/* Practice Mode Clarity Note */}
      {isWon && isPractice && (
        <span className="text-[11px] font-black px-3 py-1 rounded-full bg-zinc-900 border border-white/10 text-zinc-300">
          وضع التدريب — مفيش XP مضاف (للتمرين فقط)
        </span>
      )}

      {/* XP Reward Display */}
      {isWon && !isPractice && typeof xp === 'number' && xp > 0 && !errorMsg && (
        <div
          className="lp-pop inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border font-black text-sm tabular-nums"
          dir="ltr"
          style={{
            backgroundColor: 'rgb(var(--a) / 0.15)',
            borderColor: 'rgb(var(--a) / 0.35)',
            color: 'var(--a-ink)',
          }}
        >
          <span>+</span>
          <AnimatedNumber value={xp} duration={650} />
          <span>XP</span>
        </div>
      )}

      {/* Server Confirmation / Limit Message */}
      {successMsg && (
        <div className="text-xs font-bold text-emerald-300 bg-emerald-500/10 border border-emerald-500/25 px-4 py-2.5 rounded-xl max-w-md">
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="text-xs font-bold text-amber-300 bg-amber-500/10 border border-amber-500/25 px-4 py-2.5 rounded-xl max-w-md">
          {errorMsg}
        </div>
      )}

      {/* Completion Stats */}
      {stats.length > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
          {stats.map((st) => (
            <div
              key={st.label}
              className="px-3.5 py-2 rounded-2xl bg-[#17171a] border border-white/[0.07] min-w-[92px]"
            >
              <span className="block text-[10px] font-bold text-zinc-400">{st.label}</span>
              <span className="text-sm font-black text-white tabular-nums">{st.value}</span>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2 w-full">
        {onReplay && (
          <button
            type="button"
            onClick={() => {
              playSound('tap');
              onReplay();
            }}
            className="lp-press min-h-[44px] px-5 py-2.5 rounded-xl text-black font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer"
            style={{ backgroundColor: 'rgb(var(--a))' }}
          >
            <RotateCcw className="w-4 h-4" />
            <span>{replayLabel}</span>
          </button>
        )}
        {onBack && (
          <button
            type="button"
            onClick={() => {
              playSound('tap');
              onBack();
            }}
            className="lp-press min-h-[44px] px-5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 hover:border-white/25 text-zinc-200 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <ArrowRight className="w-4 h-4 rtl:rotate-0 ltr:rotate-180" />
            <span>{backLabel}</span>
          </button>
        )}
      </div>
    </div>
  );
};
