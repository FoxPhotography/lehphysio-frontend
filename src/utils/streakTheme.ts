import type React from 'react';
/**
 * Single source of truth for streak tiers — every place that shows a streak
 * (profile, public profile, leaderboard nameplates, home, stats) reads its
 * colours from here so they always match.
 */
export type StreakTierKey = 'none' | 'spark' | 'gold' | 'plasma' | 'supernova';

export interface StreakTheme {
  key: StreakTierKey;
  /** Arabic tier name shown in badges. */
  name: string;
  /** Short hype line. */
  tagline: string;
  /** Deep → bright → hot-core colours. */
  c1: string;
  c2: string;
  c3: string;
  /** Glow colour as "r g b" (for rgb(var(--sg) / a)). */
  glow: string;
  /** Readable accent text colour on dark backgrounds. */
  text: string;
  /** 0..1 — how loud the effects get. */
  intensity: number;
  /** Days needed to reach the next tier (null at the top). */
  next: { name: string; at: number } | null;
}

const TIERS: (StreakTheme & { min: number })[] = [
  {
    key: 'supernova', min: 15, name: 'سوبرنوفا', tagline: 'فحل',
    c1: '#0040ff', c2: '#00d4ff', c3: '#e6ffff', glow: '0 200 255', text: '#67e8f9', intensity: 1, next: null,
  },
  {
    key: 'plasma', min: 7, name: 'بلازما', tagline: 'ولعة ومحدش قدك',
    c1: '#6d28ff', c2: '#ff2bd6', c3: '#ffd1fb', glow: '236 72 255', text: '#f0abfc', intensity: 0.8, next: { name: 'سوبرنوفا', at: 15 },
  },
  {
    key: 'gold', min: 3, name: 'اون فاير', tagline: 'انت اون فاير',
    c1: '#b8860b', c2: '#ffc400', c3: '#fff4b8', glow: '255 200 0', text: '#fde047', intensity: 0.6, next: { name: 'بلازما', at: 7 },
  },
  {
    key: 'spark', min: 1, name: 'شرارة', tagline: 'لسه بتسخّن 🔥',
    c1: '#e11d00', c2: '#ff7a00', c3: '#ffd166', glow: '255 106 0', text: '#fb923c', intensity: 0.4, next: { name: 'اون فاير', at: 3 },
  },
  {
    key: 'none', min: 0, name: 'مطفي', tagline: 'ادخل النهارده وولّعها 🔥',
    c1: '#27272a', c2: '#52525b', c3: '#a1a1aa', glow: '113 113 122', text: '#a1a1aa', intensity: 0, next: { name: 'شرارة', at: 1 },
  },
];

export function getStreakTheme(days: number | null | undefined): StreakTheme {
  const d = Math.max(0, Number(days) || 0);
  const tier = TIERS.find(t => d >= t.min) || TIERS[TIERS.length - 1];
  return tier;
}

/** CSS custom properties consumed by the .streak-* classes in index.css. */
/** "فاضلك يومين وتبقى ولعة" — Egyptian countdown to the next tier. */
export function nextTierLine(theme: StreakTheme, days: number): string {
  if (!theme.next) return theme.tagline;
  const left = Math.max(1, theme.next.at - (Number(days) || 0));
  const unit = left === 1 ? 'يوم' : left === 2 ? 'يومين' : `${left} أيام`;
  return `فاضلك ${unit} وتبقى ${theme.next.name}`;
}

export function streakVars(theme: StreakTheme): React.CSSProperties {
  return {
    ['--s1' as any]: theme.c1,
    ['--s2' as any]: theme.c2,
    ['--s3' as any]: theme.c3,
    ['--sg' as any]: theme.glow,
    ['--si' as any]: String(theme.intensity),
  };
}
