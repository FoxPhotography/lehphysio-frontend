/**
 * The single progression system: ranks by total XP (same thresholds as the backend).
 * Names follow a PT career ladder: amateur → trainee → therapist → consultant → legend.
 */
export const RANKS = [
  { tier: 1, min: 0, name: 'هاوٍ', emoji: '🧪' },
  { tier: 2, min: 500, name: 'متدرّب', emoji: '⚡' },
  { tier: 3, min: 1500, name: 'ثيرابيست', emoji: '🦴' },
  { tier: 4, min: 3000, name: 'استشاري', emoji: '🧠' },
  { tier: 5, min: 6000, name: 'أسطورة فيزيو', emoji: '👑' },
] as const;

/** Display name for a rank object from the API (uses the tier, so old server names are replaced too). */
export function rankName(rank: { tier?: number; name_ar?: string; name_en?: string } | null | undefined): string {
  const t = rank?.tier;
  if (t && RANKS[t - 1]) return RANKS[t - 1].name;
  return rank?.name_ar || rank?.name_en || RANKS[0].name;
}

export function rankEmoji(rank: { tier?: number; emoji?: string } | null | undefined): string {
  const t = rank?.tier;
  return (t && RANKS[t - 1]?.emoji) || rank?.emoji || RANKS[0].emoji;
}

export function rankProgress(totalXp: number) {
  const xp = Math.max(0, totalXp || 0);
  let index = 0;
  for (let i = 0; i < RANKS.length; i++) if (xp >= RANKS[i].min) index = i;
  const current = RANKS[index];
  const next = RANKS[index + 1] ?? null;
  const pct = next ? Math.min(100, ((xp - current.min) / (next.min - current.min)) * 100) : 100;
  return { current, next, pct, remaining: next ? next.min - xp : 0 };
}
