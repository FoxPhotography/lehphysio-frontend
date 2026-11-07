/** The single progression system: ranks by total XP (same thresholds as the backend). */
export const RANKS = [
  { tier: 1, min: 0, name: 'طالب تشريح', emoji: '🧪' },
  { tier: 2, min: 500, name: 'أخصائي الألم', emoji: '⚡' },
  { tier: 3, min: 1500, name: 'سيد الأورثو', emoji: '🦴' },
  { tier: 4, min: 3000, name: 'النيوروچي', emoji: '🧠' },
  { tier: 5, min: 6000, name: 'أسطورة الريهاب', emoji: '👑' },
] as const;

export function rankProgress(totalXp: number) {
  const xp = Math.max(0, totalXp || 0);
  let index = 0;
  for (let i = 0; i < RANKS.length; i++) if (xp >= RANKS[i].min) index = i;
  const current = RANKS[index];
  const next = RANKS[index + 1] ?? null;
  const pct = next ? Math.min(100, ((xp - current.min) / (next.min - current.min)) * 100) : 100;
  return { current, next, pct, remaining: next ? next.min - xp : 0 };
}
