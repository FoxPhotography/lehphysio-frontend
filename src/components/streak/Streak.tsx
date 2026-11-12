import React, { useId } from 'react';
import { m } from 'framer-motion';
import { getStreakTheme, streakVars, type StreakTheme } from '../../utils/streakTheme';
import { daysLabel } from '../../utils/format';

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

const themeFor = (days: number) => getStreakTheme(days);

// ─── Animated flame ──────────────────────────────────────────────────────────

export const StreakFlame: React.FC<{ days: number; size?: number; className?: string }> = ({ days, size = 32, className = '' }) => {
  const t = themeFor(days);
  const id = useId().replace(/:/g, '');
  const off = t.key === 'none';
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      aria-hidden
      className={`select-none overflow-visible ${className}`}
      style={{ filter: off ? 'grayscale(1) opacity(0.55)' : `drop-shadow(0 0 ${Math.round(size / 4)}px rgb(${t.glow} / 0.75))` }}
    >
      <defs>
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
      <m.path
        d="M50,95 C70,95 85,80 82,58 C80,38 65,30 50,2 C35,30 20,38 18,58 C15,80 30,95 50,95 Z"
        fill={`url(#o${id})`}
        animate={off ? undefined : { scaleY: [1, 1.08, 0.96, 1.05, 1], scaleX: [1, 0.95, 1.05, 0.98, 1], skewX: [0, -3, 3, -2, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        style={{ transformOrigin: '50px 95px' }}
      />
      <m.path
        d="M50,90 C65,90 75,78 72,58 C70,40 60,32 50,15 C40,32 30,40 28,58 C25,78 35,90 50,90 Z"
        fill={`url(#m${id})`}
        animate={off ? undefined : { scaleY: [1, 0.93, 1.1, 0.97, 1], scaleX: [1, 1.08, 0.92, 1.03, 1], skewX: [0, 4, -4, 2, 0] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
        style={{ transformOrigin: '50px 90px' }}
      />
      <m.path
        d="M50,85 C60,85 68,75 66,58 C64,42 58,35 50,28 C42,35 36,42 34,58 C32,75 40,85 50,85 Z"
        fill={`url(#i${id})`}
        animate={off ? undefined : { scaleY: [1, 1.12, 0.9, 1.08, 1], scaleX: [1, 0.9, 1.1, 0.95, 1] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        style={{ transformOrigin: '50px 85px' }}
      />
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

export const StreakAura: React.FC<{ days: number; density?: 'full' | 'lite'; className?: string }> = ({ days, density = 'full', className = '' }) => {
  const t: StreakTheme = themeFor(days);
  if (t.key === 'none') {
    return <div aria-hidden className={`streak-aura streak-aura--off ${className}`} />;
  }
  const emberCount = density === 'lite' ? Math.round(4 + t.intensity * 4) : Math.round(6 + t.intensity * 8);
  const showSparkles = t.key === 'supernova' || t.key === 'plasma';
  return (
    <div aria-hidden className={`streak-aura streak-aura--${t.key} ${className}`} style={streakVars(t)}>
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
          {SPARKLES.slice(0, t.key === 'supernova' ? 10 : 6).map((s, i) => (
            <span key={i} style={{ left: s.x, top: s.y, width: s.size, height: s.size, animationDelay: `${s.delay}s` }} />
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
} & React.HTMLAttributes<HTMLDivElement>> = ({ days, className = '', children, style, ...rest }) => {
  const t = themeFor(days);
  if (t.key === 'none') {
    return <div className={className} style={style} {...rest}>{children}</div>;
  }
  const embers = t.key === 'supernova' ? 6 : t.key === 'plasma' ? 4 : 0;
  return (
    <div
      {...rest}
      className={`streak-plate streak-plate--${t.key} ${className}`}
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
      {children}
    </div>
  );
};

/** Username rendered in the tier's moving gradient (used on nameplates & profiles). */
export const StreakName: React.FC<{ days: number; children: React.ReactNode; className?: string }> = ({ days, children, className = '' }) => {
  const t = themeFor(days);
  if (t.key === 'none') return <span className={className}>{children}</span>;
  return (
    <span className={`streak-text ${className}`} style={streakVars(t)}>
      {children}
    </span>
  );
};
