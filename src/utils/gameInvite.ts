/** Online-challenge invites shared in the public chat (rendered there as a join card). */
const INVITE_RE = /\/game\/([A-Z0-9]{3,10})(?![A-Z0-9])/i;

export function buildGameInvite(code: string): string {
  return `🎮 تحدي التشريح أونلاين — تعالوا العبوا معايا!\n${window.location.origin}/game/${code}`;
}

export function parseGameInvite(text?: string | null): string | null {
  const m = (text || '').match(INVITE_RE);
  return m ? m[1].toUpperCase() : null;
}

/** Ask the games hook (mounted in App) to join a room — no code typing needed. */
export function joinGameRoomFromInvite(code: string) {
  window.dispatchEvent(new CustomEvent('join-game-room', { detail: { code } }));
}
