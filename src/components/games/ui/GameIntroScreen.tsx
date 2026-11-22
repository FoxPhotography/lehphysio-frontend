import React from 'react';
import { Play, ArrowRight, Sparkles } from 'lucide-react';
import type { GameAccent } from './GameTile';
import { Mascot, type MascotCharacter } from './Mascot';
import { AttemptPips } from './AttemptPips';
import { PracticeModeBanner } from './PracticeModeBanner';
import { playSound } from '../../../utils/soundEngine';
import { haptic } from './feedback';

interface GameIntroScreenProps {
  accent: GameAccent;
  character: MascotCharacter;
  art: React.ReactNode;
  title: string;
  titleEn?: string;
  subtitle: string;
  rules: string[];
  xpLabel: string;
  dailyPlaysCount?: number;
  maxDailyPlays?: number;
  onStart: () => void;
  onBack?: () => void;
  startLabel?: string;
}

export const GameIntroScreen: React.FC<GameIntroScreenProps> = ({
  accent,
  character,
  art,
  title,
  titleEn,
  subtitle,
  rules,
  xpLabel,
  dailyPlaysCount = 0,
  maxDailyPlays = 3,
  onStart,
  onBack,
  startLabel = 'ابدأ التحدي',
}) => {
  const isPractice = dailyPlaysCount >= maxDailyPlays;

  return (
    <div
      data-accent={accent}
      className="lp-rise rounded-3xl border border-white/[0.08] bg-[#111113] p-5 md:p-7 space-y-5 text-start"
    >
      {/* Top Action + Attempts Bar */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        {onBack ? (
          <button
            type="button"
            onClick={() => {
              haptic('tap');
              playSound('tap');
              onBack();
            }}
            className="lp-press min-h-[42px] px-3.5 py-2 rounded-xl bg-[#17171a] border border-white/10 hover:border-white/25 text-zinc-200 font-black text-xs inline-flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowRight className="w-4 h-4 rtl:rotate-0 ltr:rotate-180" />
            <span>رجوع للألعاب</span>
          </button>
        ) : (
          <span />
        )}

        <div className="flex items-center gap-2">
          <span
            className="text-xs font-black px-3 py-1 rounded-full border tabular-nums"
            dir="ltr"
            style={{
              backgroundColor: 'rgb(var(--a) / 0.14)',
              borderColor: 'rgb(var(--a) / 0.35)',
              color: 'var(--a-ink)',
            }}
          >
            {xpLabel}
          </span>
          <AttemptPips used={dailyPlaysCount} max={maxDailyPlays} />
        </div>
      </div>

      {/* Hero Artwork + Mascot Stage */}
      <div
        className="rounded-2xl border p-4 md:p-5 flex flex-col md:flex-row items-center gap-4"
        style={{
          backgroundColor: 'rgb(var(--a) / 0.09)',
          borderColor: 'rgb(var(--a) / 0.25)',
        }}
      >
        <div className="w-full md:w-56 h-36 shrink-0">{art}</div>
        <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-start gap-2 min-w-0">
          <div className="flex items-center gap-3">
            <Mascot character={character} mood={isPractice ? 'encouraging' : 'excited'} size={58} />
            <div>
              <h2 className="text-lg md:text-xl font-black text-white leading-snug">
                {title}{' '}
                {titleEn && (
                  <bdi dir="ltr" className="text-sm font-extrabold" style={{ color: 'var(--a-ink)' }}>
                    ({titleEn})
                  </bdi>
                )}
              </h2>
              <p className="text-xs md:text-sm font-semibold text-zinc-300 mt-0.5 leading-relaxed">
                {subtitle}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Practice Mode Banner if exhausted */}
      {isPractice && <PracticeModeBanner character={character} />}

      {/* Quick Rules */}
      {rules.length > 0 && (
        <ul className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {rules.map((rule, idx) => (
            <li
              key={idx}
              className="rounded-2xl bg-[#17171a] border border-white/[0.06] px-3.5 py-2.5 text-xs font-bold text-zinc-200 flex items-start gap-2"
            >
              <Sparkles className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: 'var(--a-ink)' }} />
              <span className="leading-snug">{rule}</span>
            </li>
          ))}
        </ul>
      )}

      {/* Primary Start CTA */}
      <button
        type="button"
        onClick={() => {
          haptic('tap');
          playSound('game_start');
          onStart();
        }}
        className="lp-press w-full min-h-[48px] py-3 px-6 rounded-2xl text-black font-black text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg"
        style={{ backgroundColor: 'rgb(var(--a))' }}
      >
        <Play className="w-4 h-4 fill-current" />
        <span>{isPractice ? `${startLabel} (تدريب)` : startLabel}</span>
      </button>
    </div>
  );
};
