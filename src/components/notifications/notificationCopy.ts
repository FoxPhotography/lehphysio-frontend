import type { AppNotification, NotificationType } from '../../types';

/** Which visual family a notification belongs to (drives the badge colour and icon). */
export type Tone = 'social' | 'mention' | 'content' | 'success' | 'danger' | 'warning' | 'staff';

interface Copy {
  /** Short Arabic action shown after the actor's name ("علّق على بوستك"). */
  action: string;
  tone: Tone;
  /** Notifications that come from the platform itself, not a person. */
  system?: boolean;
}

const COPY: Record<NotificationType, Copy> = {
  new_comment: { action: 'علّق على بوستك', tone: 'social' },
  comment_reply: { action: 'رد على تعليقك', tone: 'social' },
  mention_comment: { action: 'عملك منشن في تعليق', tone: 'mention' },
  mention_chat: { action: 'عملك منشن في الشات', tone: 'mention' },
  new_post: { action: 'نشر بوست جديد', tone: 'content' },
  new_episode: { action: 'نزّلت حلقة جديدة 🎙️', tone: 'content', system: true },
  post_approved: { action: 'بوستك اتقبل واتنشر', tone: 'success', system: true },
  post_rejected: { action: 'بوستك محتاج تعديل قبل النشر', tone: 'danger', system: true },
  post_update_approved: { action: 'تعديل بوستك اتقبل', tone: 'success', system: true },
  post_update_rejected: { action: 'تعديل بوستك اترفض', tone: 'danger', system: true },
  episode_approved: { action: 'الحلقة اتقبلت', tone: 'success', system: true },
  episode_rejected: { action: 'الحلقة اترفضت', tone: 'danger', system: true },
  suggestion_approved: { action: 'اقتراحك اتقبل 💡', tone: 'success', system: true },
  suggestion_rejected: { action: 'اقتراحك اترفض', tone: 'danger', system: true },
  user_muted: { action: 'حسابك اتكتم مؤقتًا', tone: 'warning', system: true },
  user_unmuted: { action: 'الكتم اتشال من حسابك', tone: 'success', system: true },
  user_banned: { action: 'حسابك اتحظر', tone: 'danger', system: true },
  user_unbanned: { action: 'الحظر اتشال من حسابك', tone: 'success', system: true },
  user_role_updated: { action: 'صلاحيتك على المنصة اتغيرت 🎖️', tone: 'success', system: true },
  moderation_post_pending: { action: 'بعت بوست مستني مراجعتك', tone: 'staff' },
  moderation_post_edited: { action: 'عدّل بوست ومستني مراجعتك', tone: 'staff' },
  moderation_suggestion_pending: { action: 'بعت اقتراح مستني مراجعتك', tone: 'staff' },
  moderation_report_pending: { action: 'بلّغ عن محتوى', tone: 'danger' },
};

export interface DescribedNotification extends Copy {
  actorName: string | null;
  actorAvatar: string | null;
  /** Quoted excerpt of the content the notification is about, when there is one. */
  snippet: string | null;
}

/** The backend sends English titles; the app composes its own Arabic sentence from type + actor + metadata. */
export function describe(n: AppNotification): DescribedNotification {
  const copy = COPY[n.type] ?? { action: n.title || 'إشعار جديد', tone: 'content' as Tone };
  const actor = n.actor_id && typeof n.actor_id === 'object' ? n.actor_id : null;

  let snippet: string | null = null;
  const quoted = n.body?.match(/"([^"]{2,})"/);
  if (quoted) snippet = quoted[1].replace(/\.\.\.$/, '…');
  if (!snippet && n.metadata?.reason) snippet = String(n.metadata.reason);
  if (!snippet && n.type === 'new_episode' && n.body) snippet = n.body;

  return {
    ...copy,
    system: copy.system || !actor,
    actorName: actor?.username ?? null,
    actorAvatar: actor?.avatar_url ?? null,
    snippet,
  };
}

export const TONE_STYLE: Record<Tone, { bg: string; fg: string }> = {
  social: { bg: '#3b82f6', fg: '#fff' },
  mention: { bg: '#f59e0b', fg: '#111' },
  content: { bg: '#FF6A00', fg: '#111' },
  success: { bg: '#10b981', fg: '#fff' },
  danger: { bg: '#ef4444', fg: '#fff' },
  warning: { bg: '#f59e0b', fg: '#111' },
  staff: { bg: '#8b5cf6', fg: '#fff' },
};
