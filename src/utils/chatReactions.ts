import type { ChatReaction } from '../types';

/** Quick-reaction set shown on long-press / hover (first one is the double-tap reaction). */
export const QUICK_REACTIONS = ['❤️', '😂', '👍', '🔥', '😮', '😢'];

/** Legacy reactions were stored as words ("heart", "like"…). */
const LEGACY: Record<string, string> = {
  like: '👍', thumbsup: '👍', heart: '❤️', love: '❤️', fire: '🔥', flame: '🔥',
  joy: '😂', laugh: '😂', smile: '😊', clap: '👏', sad: '😢', frown: '😢', cry: '😢',
  wow: '😮', skull: '💀', '100': '💯',
};

export const normalizeEmoji = (emoji: string) => LEGACY[emoji?.toLowerCase?.()] || emoji;

interface RawReaction { emoji: string; user_id: number; username: string }

/** Server socket payload ({ emoji, user_id, username }[]) → grouped list for this viewer. */
export function summarizeRawReactions(raw: RawReaction[], myId?: number | null): ChatReaction[] {
  const groups = new Map<string, { id: number; username: string }[]>();
  for (const r of raw || []) {
    const e = normalizeEmoji(r.emoji);
    if (!groups.has(e)) groups.set(e, []);
    groups.get(e)!.push({ id: r.user_id, username: r.username });
  }
  return [...groups.entries()]
    .map(([emoji, users]) => ({
      emoji,
      count: users.length,
      userReacted: myId != null && users.some(u => String(u.id) === String(myId)),
      users,
    }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Optimistic toggle mirroring the server rule: one reaction per person —
 * same emoji removes it, another emoji replaces it.
 */
export function applyReactionToggle(
  reactions: ChatReaction[] | undefined,
  emoji: string,
  me: { id: number; username: string }
): ChatReaction[] {
  const list = (reactions || []).map(r => ({ ...r, emoji: normalizeEmoji(r.emoji), users: r.users ? [...r.users] : undefined }));
  const mine = list.find(r => r.userReacted);
  const removing = mine && mine.emoji === emoji;

  if (mine) {
    mine.count -= 1;
    mine.userReacted = false;
    if (mine.users) mine.users = mine.users.filter(u => String(u.id) !== String(me.id));
  }
  if (!removing) {
    let target = list.find(r => r.emoji === emoji);
    if (!target) {
      target = { emoji, count: 0, userReacted: false, users: [] };
      list.push(target);
    }
    target.count += 1;
    target.userReacted = true;
    target.users = [...(target.users || []), { id: me.id, username: me.username }];
  }
  return list.filter(r => r.count > 0).sort((a, b) => b.count - a.count);
}
