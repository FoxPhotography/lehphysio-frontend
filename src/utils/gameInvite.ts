/** Online-challenge invites shared in the public chat (rendered there as a join card). */
const INVITE_RE = /\/game\/([A-Z0-9]{3,10})(?![A-Z0-9])/i;
const INVITE_TITLE_RE = /^🎮\s*(.+?)\s*—/;

export const GAME_MODE_LABELS: Record<string, { title: string; badge: string }> = {
  anatomy: { title: 'تحدي التشريح أونلاين', badge: 'تشريح' },
  clinical: { title: 'عيادة الطوارئ أونلاين', badge: 'تشخيص إكلينيكي' },
  special_tests: { title: 'مبارزة الـ Special Tests', badge: 'OSCE' },
};

export function getGameModeLabel(mode?: string | null): { title: string; badge: string } {
  return GAME_MODE_LABELS[mode || 'anatomy'] || { title: 'تحدي أونلاين', badge: 'تحدي' };
}

export function buildGameInvite(code: string, mode?: string | null): string {
  const { title } = getGameModeLabel(mode);
  return `🎮 ${title} — تعالوا العبوا معايا!\n${window.location.origin}/game/${code}`;
}

export function parseGameInvite(text?: string | null): string | null {
  const m = (text || '').match(INVITE_RE);
  return m ? m[1].toUpperCase() : null;
}

export function parseGameInviteTitle(text?: string | null): string {
  const m = (text || '').match(INVITE_TITLE_RE);
  return m ? m[1].trim() : 'تحدي أونلاين';
}

/** Ask the games hook (mounted in App) to join a room — no code typing needed. */
export function joinGameRoomFromInvite(code: string) {
  window.dispatchEvent(new CustomEvent('join-game-room', { detail: { code } }));
}
