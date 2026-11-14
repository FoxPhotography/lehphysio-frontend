// Episode numbering restarts every season (season 1 = the original 5 episodes).
const ORDINALS = ['', 'الأول', 'الثاني', 'الثالث', 'الرابع', 'الخامس', 'السادس', 'السابع', 'الثامن', 'التاسع', 'العاشر'];

export function episodeSeason(ep: any): number {
  return Number(ep?.season) || 1;
}

export function episodeNumber(ep: any): number {
  return Number(ep?.episode_number) || Number(ep?.id ?? ep?._id) || 1;
}

/** "الموسم الثاني" */
export function seasonName(season: number): string {
  return `الموسم ${ORDINALS[season] || season}`;
}

/** "الموسم 2 · الحلقة 1" */
export function episodeLabel(ep: any): string {
  return `الموسم ${episodeSeason(ep)} · الحلقة ${episodeNumber(ep)}`;
}

/** Seasons newest first, episodes newest first inside each season */
export function groupBySeason<T>(episodes: T[]): { season: number; episodes: T[] }[] {
  const map = new Map<number, T[]>();
  for (const ep of episodes) {
    const s = episodeSeason(ep);
    if (!map.has(s)) map.set(s, []);
    map.get(s)!.push(ep);
  }
  return [...map.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([season, eps]) => ({ season, episodes: eps.sort((a, b) => episodeNumber(b) - episodeNumber(a)) }));
}
