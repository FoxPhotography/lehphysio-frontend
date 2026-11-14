import React, { useId } from 'react';
import { getStreakTheme, streakVars, type StreakTheme } from '../../utils/streakTheme';
import { daysLabel } from '../../utils/format';
import type { CosmeticVisual } from '../../utils/cosmetics';

/** Equipped shop cosmetic (if any) wins over the automatic streak colours. */
type Override = CosmeticVisual | null | undefined;
const fxClass = (o: Override) => (o ? ` cos-fx cos-fx--${o.fx}` : '');

// Static pseudo-random layouts (no Math.random in render → stable between renders)
const EMBERS = Array.from({ length: 14 }, (_, i) => ({
  x: `${(i * 37 + 11) % 100}%`,
  size: 2 + ((i * 7) % 5),
  dur: 3.2 + ((i * 13) % 30) / 10,
  delay: -((i * 17) % 40) / 10,
  dx: `${((i * 23) % 50) - 25}px`,
}));
const SPARKLES = Array.from({ length: 10 }, (_, i) => ({
  x: `${(i * 41 + 7) % 96}%`,
  y: `${(i * 29 + 13) % 88}%`,
  delay: -((i * 11) % 30) / 10,
  size: 6 + ((i * 5) % 7),
}));

export const ButterflySvg = () => (
  <svg viewBox="0 0 24 20" width="100%" height="100%" fill="none" className="butterfly-svg">
    <path
      d="M12 9C10 4 3 2 2 7C1 11 6 15 12 11M12 9C14 4 21 2 22 7C23 11 18 15 12 11M12 11C10 13 6 18 8 19C10 20 12 16 12 13M12 11C14 13 18 18 16 19C14 20 12 16 12 13"
      fill="currentColor"
    />
  </svg>
);

export const LightningSvg = () => (
  <svg viewBox="0 0 16 24" width="100%" height="100%" fill="none" className="lightning-svg">
    <path
      d="M9 1L1 13H8L7 23L15 11H8L9 1Z"
      fill="currentColor"
    />
  </svg>
);

const BUTTERFLIES = [
  { x: '16%', bottom: '4px', size: 15, dur: 3.6, delay: 0.2, flyX: '14px', rot: -8 },
  { x: '72%', bottom: '2px', size: 12, dur: 4.4, delay: 1.6, flyX: '-12px', rot: 12 },
  { x: '44%', bottom: '6px', size: 13, dur: 3.8, delay: 0.9, flyX: '16px', rot: 6 },
];

const LIGHTNING_BOLTS = [
  { left: '10%', top: '12%', size: 14, dur: 2.8, delay: 0.3, rot: -12 },
  { left: '84%', top: '18%', size: 13, dur: 3.2, delay: 1.5, rot: 18 },
  { left: '46%', top: '50%', size: 11, dur: 2.5, delay: 0.8, rot: 8 },
];

const themeFor = (days: number) => getStreakTheme(days);

// ─── Animated flame ──────────────────────────────────────────────────────────

export const StreakFlame: React.FC<{ days: number; size?: number; className?: string }> = ({ days, size = 32, className = '' }) => {
  const t = themeFor(days);
  const id = useId().replace(/:/g, '');
  const off = t.key === 'none';
  // Small flames (chips, chat names, lists) stay still — dozens of them animating is what makes weak phones lag.
  // Bigger ones flicker with a cheap CSS transform; the glow is a static gradient, not a filter.
  const animate = !off && size >= 22;
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      aria-hidden
      className={`select-none overflow-visible ${animate ? 'streak-flame--anim' : ''} ${className}`}
      style={off ? { filter: 'grayscale(1)', opacity: 0.55 } : undefined}
    >
      <defs>
        <radialGradient id={`g${id}`} cx="50%" cy="62%" r="50%">
          <stop offset="0%" stopColor={`rgb(${t.glow})`} stopOpacity={off ? 0 : 0.55} />
          <stop offset="100%" stopColor={`rgb(${t.glow})`} stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`o${id}`} x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor={t.c1} stopOpacity="0.95" />
          <stop offset="60%" stopColor={t.c2} stopOpacity="0.85" />
          <stop offset="100%" stopColor={t.c3} stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`m${id}`} x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor={t.c2} stopOpacity="0.95" />
          <stop offset="55%" stopColor={t.c3} stopOpacity="0.9" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`i${id}`} x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor={t.c3} stopOpacity="1" />
          <stop offset="60%" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="62" r="50" fill={`url(#g${id})`} />
      <path className="sf-o" d="M50,95 C70,95 85,80 82,58 C80,38 65,30 50,2 C35,30 20,38 18,58 C15,80 30,95 50,95 Z" fill={`url(#o${id})`} />
      <path className="sf-m" d="M50,90 C65,90 75,78 72,58 C70,40 60,32 50,15 C40,32 30,40 28,58 C25,78 35,90 50,90 Z" fill={`url(#m${id})`} />
      <path className="sf-i" d="M50,85 C60,85 68,75 66,58 C64,42 58,35 50,28 C42,35 36,42 34,58 C32,75 40,85 50,85 Z" fill={`url(#i${id})`} />
    </svg>
  );
};

// ─── Pill: flame + days ──────────────────────────────────────────────────────

export const StreakChip: React.FC<{
  days: number;
  size?: 'xs' | 'sm' | 'md';
  showName?: boolean;
  className?: string;
  onClick?: () => void;
  trailing?: React.ReactNode;
}> = ({ days, size = 'sm', showName = false, className = '', onClick, trailing }) => {
  const t = themeFor(days);
  const off = t.key === 'none';
  const dims = size === 'md'
    ? { pad: 'ps-2.5 pe-4 py-2 gap-2 text-sm', flame: 24 }
    : size === 'sm'
      ? { pad: 'ps-1.5 pe-2.5 py-1 gap-1 text-xs', flame: 16 }
      : { pad: 'ps-1 pe-2 py-0.5 gap-0.5 text-[11px]', flame: 13 };
  const Tag: any = onClick ? 'button' : 'span';
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      style={streakVars(t)}
      className={`streak-chip ${off ? 'streak-chip--off' : ''} relative inline-flex items-center rounded-full font-black whitespace-nowrap ${dims.pad} ${onClick ? 'cursor-pointer active:scale-95 transition-transform' : ''} ${className}`}
    >
      <StreakFlame days={days} size={dims.flame} />
      <span className="relative" style={{ color: off ? '#a1a1aa' : t.text }}>
        {daysLabel(days)}
        {showName && !off && <span className="opacity-80 font-extrabold"> · {t.name}</span>}
      </span>
      {trailing}
    </Tag>
  );
};

// ─── Animated background (profile headers, stat cards) ───────────────────────

export const StreakAura: React.FC<{ days: number; density?: 'full' | 'lite'; className?: string; override?: Override }> = ({ days, density = 'full', className = '', override }) => {
  const t: StreakTheme = override || themeFor(days);
  if (!override && t.key === 'none') {
    return <div aria-hidden className={`streak-aura streak-aura--off ${className}`} />;
  }
  const emberCount = density === 'lite' ? Math.round(4 + t.intensity * 4) : Math.round(6 + t.intensity * 8);
  const showSparkles = override
    ? override.fx === 'stars' || override.fx === 'shine' || override.fx === 'holo'
    : t.key === 'supernova' || t.key === 'plasma';
  return (
    <div aria-hidden className={`streak-aura streak-aura--${t.key}${fxClass(override)} ${className}`} style={streakVars(t)}>
      <div className="streak-aura__glow" />
      <div className="streak-aura__ring" />
      {density === 'full' && <div className="streak-aura__ring streak-aura__ring--rev" />}
      <div className="streak-aura__embers">
        {EMBERS.slice(0, emberCount).map((e, i) => (
          <span
            key={i}
            style={{
              ['--x' as any]: e.x,
              ['--sz' as any]: `${e.size}px`,
              ['--dur' as any]: `${e.dur}s`,
              ['--delay' as any]: `${e.delay}s`,
              ['--dx' as any]: e.dx,
            }}
          />
        ))}
      </div>
      {showSparkles && density === 'full' && (
        <div className="streak-aura__sparkles">
          {SPARKLES.slice(0, t.key === 'supernova' || override?.fx === 'stars' || override?.fx === 'holo' ? 10 : 6).map((s, i) => (
            <span key={i} style={{ left: s.x, top: s.y, width: s.size, height: s.size, animationDelay: `${s.delay}s` }} />
          ))}
        </div>
      )}
      {t.key === 'plasma' && density === 'full' && (
        <div className="streak-aura__butterflies pointer-events-none">
          {BUTTERFLIES.map((b, i) => (
            <span
              key={i}
              className="streak-butterfly-particle"
              style={{
                left: b.x,
                bottom: b.bottom,
                width: `${b.size}px`,
                height: `${b.size}px`,
                ['--dur' as any]: `${b.dur}s`,
                ['--delay' as any]: `${b.delay}s`,
                ['--fly-x' as any]: b.flyX,
                ['--rot' as any]: `${b.rot}deg`,
              }}
            >
              <ButterflySvg />
            </span>
          ))}
        </div>
      )}
      {t.key === 'supernova' && density === 'full' && (
        <div className="streak-aura__lightning pointer-events-none">
          {LIGHTNING_BOLTS.map((l, i) => (
            <span
              key={i}
              className="streak-lightning-particle"
              style={{
                left: l.left,
                top: l.top,
                width: `${l.size}px`,
                height: `${l.size * 1.5}px`,
                ['--dur' as any]: `${l.dur}s`,
                ['--delay' as any]: `${l.delay}s`,
                ['--rot' as any]: `${l.rot}deg`,
              }}
            >
              <LightningSvg />
            </span>
          ))}
        </div>
      )}
      <div className="streak-aura__vignette" />
    </div>
  );
};

// ─── Leaderboard nameplate ───────────────────────────────────────────────────

/** Wraps a row: animated tier-coloured plate with a light sweep, edge glow and embers for high tiers. */
export const StreakNameplate: React.FC<{
  days: number;
  className?: string;
  children: React.ReactNode;
  override?: Override;
} & React.HTMLAttributes<HTMLDivElement>> = ({ days, className = '', children, style, override, ...rest }) => {
  const t = override || themeFor(days);
  if (!override && t.key === 'none') {
    return <div className={className} style={style} {...rest}>{children}</div>;
  }
  const embers = override
    ? (override.fx === 'embers' || override.fx === 'stars' || override.fx === 'holo' || override.fx === 'shine' ? 5 : 0)
    : t.key === 'supernova' ? 6 : t.key === 'plasma' ? 4 : 0;
  return (
    <div
      {...rest}
      className={`streak-plate streak-plate--${t.key}${fxClass(override)} ${className}`}
      style={{ ...streakVars(t), ...style }}
    >
      <span aria-hidden className="streak-plate__bg" />
      <span aria-hidden className="streak-plate__sheen" />
      <span aria-hidden className="streak-plate__edge" />
      {embers > 0 && (
        <span aria-hidden className="streak-plate__embers">
          {EMBERS.slice(0, embers).map((e, i) => (
            <span
              key={i}
              style={{
                ['--x' as any]: e.x,
                ['--sz' as any]: `${Math.max(2, e.size - 1)}px`,
                ['--dur' as any]: `${e.dur * 0.7}s`,
                ['--delay' as any]: `${e.delay}s`,
                ['--dx' as any]: e.dx,
              }}
            />
          ))}
        </span>
      )}
      {t.key === 'plasma' && (
        <span aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
          {BUTTERFLIES.slice(0, 2).map((b, i) => (
            <span
              key={i}
              className="streak-butterfly-particle"
              style={{
                left: i === 0 ? '12%' : '82%',
                bottom: '10%',
                width: '14px',
                height: '14px',
                ['--dur' as any]: `${b.dur}s`,
                ['--delay' as any]: `${b.delay * 0.5}s`,
                ['--fly-x' as any]: i === 0 ? '12px' : '-12px',
                ['--rot' as any]: `${b.rot}deg`,
              }}
            >
              <ButterflySvg />
            </span>
          ))}
        </span>
      )}
      {t.key === 'supernova' && (
        <span aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
          {LIGHTNING_BOLTS.slice(0, 2).map((l, i) => (
            <span
              key={i}
              className="streak-lightning-particle"
              style={{
                left: i === 0 ? '8%' : '78%',
                top: '15%',
                width: '14px',
                height: '21px',
                ['--dur' as any]: `${l.dur}s`,
                ['--delay' as any]: `${l.delay}s`,
                ['--rot' as any]: `${l.rot}deg`,
              }}
            >
              <LightningSvg />
            </span>
          ))}
        </span>
      )}
      {children}
    </div>
  );
};

/** Username rendered in the tier's moving gradient (used on nameplates & profiles). */
export const StreakName: React.FC<{ days: number; children: React.ReactNode; className?: string; override?: Override }> = ({ days, children, className = '', override }) => {
  const t = override || themeFor(days);
  if (!override && t.key === 'none') return <span className={className}>{children}</span>;
  return (
    <span className={`streak-text${fxClass(override)} ${className}`} style={streakVars(t)}>
      {children}
    </span>
  );
};

/**
 * Animated layers for a chat bubble in the sender's streak colours (3+ days).
 * Put inside an element with className `streak-bubble` + streakVars(theme).
 */
export const StreakBubbleLayers: React.FC<{ days: number; override?: Override }> = ({ days, override }) => {
  const t = override || themeFor(days);
  const embers = override
    ? (override.fx === 'flow' ? 0 : 3)
    : t.key === 'supernova' ? 4 : t.key === 'plasma' ? 3 : 0;
  return (
    <>
      <span aria-hidden className="streak-plate__bg" />
      <span aria-hidden className="streak-plate__sheen" />
      {embers > 0 && (
        <span aria-hidden className="streak-plate__embers">
          {EMBERS.slice(0, embers).map((e, i) => (
            <span
              key={i}
              style={{
                ['--x' as any]: e.x,
                ['--sz' as any]: `${Math.max(2, e.size - 2)}px`,
                ['--dur' as any]: `${e.dur * 0.6}s`,
                ['--delay' as any]: `${e.delay}s`,
                ['--dx' as any]: e.dx,
              }}
            />
          ))}
        </span>
      )}
      {t.key === 'plasma' && (
        <span aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
          <span
            className="streak-butterfly-particle"
            style={{
              left: '8%',
              bottom: '12%',
              width: '12px',
              height: '12px',
              ['--dur' as any]: '3.8s',
              ['--delay' as any]: '0.3s',
              ['--fly-x' as any]: '10px',
              ['--rot' as any]: '-12deg',
            }}
          >
            <ButterflySvg />
          </span>
        </span>
      )}
      {t.key === 'supernova' && (
        <span aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
          <span
            className="streak-lightning-particle"
            style={{
              right: '8%',
              top: '12%',
              width: '12px',
              height: '18px',
              ['--dur' as any]: '2.4s',
              ['--delay' as any]: '0.2s',
              ['--rot' as any]: '15deg',
            }}
          >
            <LightningSvg />
          </span>
        </span>
      )}
    </>
  );
};
