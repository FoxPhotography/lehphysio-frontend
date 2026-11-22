import React from 'react';
import { Play, Sparkles, Clock } from 'lucide-react';
import { AttemptPips } from './AttemptPips';
import { Mascot, type MascotCharacter } from './Mascot';

export type GameAccent =
  | 'teal'
  | 'green'
  | 'purple'
  | 'gold'
  | 'cyan'
  | 'violet'
  | 'orange'
  | 'amber';

interface GameTileProps {
  accent: GameAccent;
  title: string;
  titleEn?: string;
  desc: string;
  tags: string[];
  isNew?: boolean;
  xpLabel: string;
  used?: number;
  max?: number;
  locked?: boolean;
  lockedLabel?: string;
  disableOnLock?: boolean;
  practiceMode?: boolean;
  mascot?: MascotCharacter;
  art: React.ReactNode;
  ctaLabel: string;
  onPlay: () => void;
  variant: 'hero' | 'wide' | 'compact';
  index: number;
  className?: string;
}

export const GameTile: React.FC<GameTileProps> = ({
  accent,
  title,
  titleEn,
  desc,
  tags,
  isNew = false,
  xpLabel,
  used,
  max = 3,
  locked = false,
  lockedLabel,
  disableOnLock = false,
  practiceMode = false,
  mascot,
  art,
  ctaLabel,
  onPlay,
  variant,
  index,
  className = '',
}) => {
  const isHero = variant === 'hero';
  const isWide = variant === 'wide';

  const artBox = (
    <div
      className={`relative shrink-0 rounded-2xl border overflow-hidden flex items-center justify-center transition-opacity ${
        locked && !practiceMode ? 'opacity-55 grayscale-[45%]' : ''
      } ${
        isHero
          ? 'w-full h-36 md:h-full md:w-52 lg:w-60 p-3'
          : isWide
          ? 'w-full sm:w-36 h-24 sm:h-28 p-2'
          : 'w-full h-24 p-2'
      }`}
      style={{
        backgroundColor: 'rgb(var(--a) / 0.10)',
        borderColor: 'rgb(var(--a) / 0.22)',
      }}
    >
      {art}
      {mascot && (
        <span className="absolute bottom-1.5 start-1.5 pointer-events-none drop-shadow">
          <Mascot
            character={mascot}
            mood={locked && !practiceMode ? 'sleeping' : 'happy'}
            size={isHero ? 38 : 30}
          />
        </span>
      )}
    </div>
  );

  const metaTags = (
    <div className="flex items-center gap-1.5 flex-wrap">
      {isNew && (
        <span
          className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-md border"
          style={{
            backgroundColor: 'rgb(var(--a) / 0.18)',
            borderColor: 'rgb(var(--a) / 0.35)',
            color: 'var(--a-ink)',
          }}
        >
          <Sparkles className="w-2.5 h-2.5" />
          <span>جديد</span>
        </span>
      )}
      {tags.map((tag) => (
        <span
          key={tag}
          className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.08] text-zinc-300"
        >
          {tag}
        </span>
      ))}
    </div>
  );

  const footer = (
    <div className="flex flex-wrap items-center justify-between gap-2 pt-3 mt-auto border-t border-white/[0.06]">
      <div className="flex items-center gap-1.5 flex-wrap">
        <span
          className="text-xs font-black px-2.5 py-1 rounded-full border tabular-nums"
          dir="ltr"
          style={{
            backgroundColor: 'rgb(var(--a) / 0.12)',
            borderColor: 'rgb(var(--a) / 0.28)',
            color: 'var(--a-ink)',
          }}
        >
          {xpLabel}
        </span>
        {typeof used === 'number' && <AttemptPips used={used} max={max} />}
      </div>

      <button
        type="button"
        disabled={locked && disableOnLock}
        onClick={onPlay}
        className={`lp-press min-h-[44px] px-4 py-2 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 shrink-0 ${
          practiceMode
            ? 'bg-amber-500/15 text-amber-300 border border-amber-500/35 hover:bg-amber-500/25 cursor-pointer'
            : locked
              ? disableOnLock
                ? 'bg-zinc-800 text-zinc-400 border border-zinc-700 cursor-not-allowed'
                : 'bg-zinc-900 text-zinc-200 border border-zinc-700 hover:border-white/25 cursor-pointer'
              : 'text-black cursor-pointer shadow-sm'
        }`}
        style={
          locked || practiceMode
            ? undefined
            : {
                backgroundColor: 'rgb(var(--a))',
              }
        }
      >
        {practiceMode ? (
          <Play className="w-3.5 h-3.5 fill-current" />
        ) : locked ? (
          <Clock className="w-3.5 h-3.5" />
        ) : (
          <Play className="w-3.5 h-3.5 fill-current" />
        )}
        <span>{practiceMode ? 'تدرّب (بدون XP)' : locked ? lockedLabel || 'رجع بكرة' : ctaLabel}</span>
      </button>
    </div>
  );

  return (
    <article
      data-accent={accent}
      className={`lp-tile lp-stagger p-4 md:p-5 text-start flex flex-col gap-3.5 ${
        isHero
          ? 'col-span-full md:flex-row md:items-stretch'
          : isWide
          ? 'sm:flex-row sm:items-stretch'
          : ''
      } ${className}`}
      style={{ '--i': index } as React.CSSProperties}
    >
      {isHero ? (
        <>
          <div className="flex-1 flex flex-col gap-2.5 min-w-0">
            {metaTags}
            <h3 className="text-lg md:text-xl font-black text-white leading-snug">
              {title}{' '}
              {titleEn && (
                <bdi dir="ltr" className="text-sm font-extrabold opacity-85" style={{ color: 'var(--a-ink)' }}>
                  ({titleEn})
                </bdi>
              )}
            </h3>
            <p className="text-xs md:text-[13px] text-zinc-400 font-semibold leading-relaxed line-clamp-2">
              {desc}
            </p>
            {footer}
          </div>
          {artBox}
        </>
      ) : (
        <>
          {artBox}
          <div className="flex-1 flex flex-col gap-2 min-w-0">
            {metaTags}
            <h3 className="text-base font-black text-white leading-snug">
              {title}{' '}
              {titleEn && (
                <bdi dir="ltr" className="text-xs font-extrabold opacity-85" style={{ color: 'var(--a-ink)' }}>
                  {titleEn}
                </bdi>
              )}
            </h3>
            <p className="text-xs text-zinc-400 font-semibold leading-relaxed line-clamp-2">
              {desc}
            </p>
            {footer}
          </div>
        </>
      )}
    </article>
  );
};
