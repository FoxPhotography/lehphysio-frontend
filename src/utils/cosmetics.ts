import type { StreakTheme } from './streakTheme';

/**
 * Shop cosmetics (visual side). Ids are "<category>:<theme>"; prices mirror
 * backend/types/cosmetics.js. Items unlock when total XP reaches the price —
 * XP is never deducted (same rule as frames).
 */
export type CosmeticCategory = 'name' | 'bubble' | 'nameplate' | 'profile';
export type CosmeticFx = 'flow' | 'embers' | 'shine' | 'stars' | 'holo';
export type Rarity = 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';

export interface CosmeticVisual extends StreakTheme {
  fx: CosmeticFx;
}

export interface CosmeticTheme {
  key: string;
  name: string;
  vibe: string;
  rarity: Rarity;
  base: number;
  c1: string; c2: string; c3: string; glow: string; text: string;
  intensity: number;
  fx: CosmeticFx;
}

export const COSMETIC_THEMES: CosmeticTheme[] = [
  { key: 'mint',   name: 'نعناع',     vibe: 'هادي ورايق',          rarity: 'common',    base: 300,  c1: '#047857', c2: '#10f2b0', c3: '#d1fff0', glow: '16 242 176',  text: '#6ee7b7', intensity: 0.45, fx: 'flow' },
  { key: 'rose',   name: 'بينكي',     vibe: 'كيوت بس خطير',        rarity: 'common',    base: 700,  c1: '#9d174d', c2: '#ff4fa3', c3: '#ffe0ef', glow: '255 79 163',  text: '#f9a8d4', intensity: 0.5,  fx: 'flow' },
  { key: 'sunset', name: 'غروب',      vibe: 'دافي ومولّع',         rarity: 'rare',      base: 1200, c1: '#b91c1c', c2: '#ff7849', c3: '#ffd38a', glow: '255 120 73',  text: '#fdba74', intensity: 0.6,  fx: 'embers' },
  { key: 'ocean',  name: 'بحر',       vibe: 'موج رايح جاي',        rarity: 'rare',      base: 2000, c1: '#0c4a6e', c2: '#06b6d4', c3: '#cffafe', glow: '6 182 212',   text: '#67e8f9', intensity: 0.65, fx: 'flow' },
  { key: 'royal',  name: 'ملكي',      vibe: 'دهب وبرستيج',         rarity: 'epic',      base: 3000, c1: '#713f12', c2: '#facc15', c3: '#fff7cc', glow: '250 204 21',  text: '#fde047', intensity: 0.8,  fx: 'shine' },
  { key: 'galaxy', name: 'مجرّة',     vibe: 'نجوم بتلمع حواليك',   rarity: 'legendary', base: 4500, c1: '#1e1b4b', c2: '#8b5cf6', c3: '#f0abfc', glow: '139 92 246',  text: '#c4b5fd', intensity: 0.9,  fx: 'stars' },
  { key: 'holo',   name: 'هولوجرام',  vibe: 'كل الألوان مرة واحدة', rarity: 'mythic',    base: 7000, c1: '#7c3aed', c2: '#00e5ff', c3: '#fff3a3', glow: '190 120 255', text: '#f5d0fe', intensity: 1,    fx: 'holo' },
];

export const COSMETIC_CATEGORIES: { key: CosmeticCategory; label: string; hint: string; mult: number; field: string }[] = [
  { key: 'nameplate', label: 'النيم بليت',     hint: 'شكل صفّك في الليدربورد',          mult: 1.2, field: 'equipped_nameplate' },
  { key: 'bubble',    label: 'خلفية الرسايل',  hint: 'رسايلك في الشات العام',            mult: 1,   field: 'equipped_bubble' },
  { key: 'profile',   label: 'ثيم البروفايل',  hint: 'خلفية بروفايلك قدام الناس',        mult: 1.4, field: 'equipped_profile_theme' },
  { key: 'name',      label: 'لون الاسم',      hint: 'اسمك في الشات والليدربورد',        mult: 0.8, field: 'equipped_name_fx' },
];

export const RARITY: Record<Rarity, { label: string; color: string; bg: string }> = {
  common:    { label: 'عادي',   color: '#a1a1aa', bg: 'rgba(161,161,170,0.12)' },
  rare:      { label: 'نادر',   color: '#38bdf8', bg: 'rgba(56,189,248,0.12)' },
  epic:      { label: 'إبيك',   color: '#c084fc', bg: 'rgba(192,132,252,0.14)' },
  legendary: { label: 'أسطوري', color: '#fbbf24', bg: 'rgba(251,191,36,0.14)' },
  mythic:    { label: 'ميثيك',  color: '#f472b6', bg: 'rgba(244,114,182,0.16)' },
};

export interface UserCosmetics {
  nameplate?: string;
  bubble?: string;
  profile?: string;
  name?: string;
}

export const cosmeticId = (category: CosmeticCategory, theme: string) => `${category}:${theme}`;

export function cosmeticPrice(category: CosmeticCategory, themeKey: string): number {
  const theme = COSMETIC_THEMES.find(t => t.key === themeKey);
  const cat = COSMETIC_CATEGORIES.find(c => c.key === category);
  if (!theme || !cat) return 0;
  return Math.round((theme.base * cat.mult) / 50) * 50;
}

/** "bubble:galaxy" → visual theme usable by the Streak* components, or null. */
export function cosmeticVisual(id?: string | null): CosmeticVisual | null {
  if (!id || id === 'none') return null;
  const themeKey = id.split(':')[1];
  const t = COSMETIC_THEMES.find(x => x.key === themeKey);
  if (!t) return null;
  return {
    key: `cos-${t.key}` as any,
    name: t.name,
    tagline: t.vibe,
    c1: t.c1, c2: t.c2, c3: t.c3, glow: t.glow, text: t.text,
    intensity: t.intensity,
    next: null,
    fx: t.fx,
  };
}
