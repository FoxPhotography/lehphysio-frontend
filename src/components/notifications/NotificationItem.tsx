import React, { useRef, useState } from 'react';
import { m, useMotionValue, useTransform, animate, type PanInfo } from 'framer-motion';
import {
  MessageCircle, Reply, AtSign, FileText, Tv, Check, X, VolumeX, Volume2, Lock, Unlock, Award, Shield, Flag, Trash2, SmilePlus, Flame,
} from 'lucide-react';
import type { AppNotification, NotificationType } from '../../types';
import { UserAvatar } from '../UserAvatar';
import { timeAgo } from '../../utils/format';
import { describe, TONE_STYLE } from './notificationCopy';

interface NotificationItemProps {
  notification: AppNotification;
  onNavigate: (n: AppNotification) => void;
  onDelete: (id: number) => void;
}

const ICON: Partial<Record<NotificationType, React.ElementType>> = {
  new_comment: MessageCircle,
  comment_reply: Reply,
  mention_comment: AtSign,
  mention_chat: AtSign,
  chat_reply: Reply,
  chat_reaction: SmilePlus,
  new_post: FileText,
  new_episode: Tv,
  post_approved: Check,
  post_update_approved: Check,
  episode_approved: Check,
  suggestion_approved: Check,
  post_rejected: X,
  post_update_rejected: X,
  episode_rejected: X,
  suggestion_rejected: X,
  user_muted: VolumeX,
  user_unmuted: Volume2,
  user_banned: Lock,
  user_unbanned: Unlock,
  user_role_updated: Award,
  moderation_post_pending: Shield,
  moderation_post_edited: Shield,
  moderation_suggestion_pending: Shield,
  moderation_report_pending: Flag,
  streak_reminder: Flame,
};

const SWIPE_DELETE = 96;

/**
 * Instagram-style row: avatar with an action badge, one flowing sentence
 * ("**Moemen** علّق على بوستك: …  ·  5د"), unread dot at the end.
 * Swipe sideways on touch to delete; hover shows a delete button on desktop.
 */
export const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onNavigate, onDelete }) => {
  const { _id, type, is_read, created_at } = notification;
  const d = describe(notification);
  const tone = TONE_STYLE[d.tone];
  const Icon = ICON[type] ?? Shield;

  const x = useMotionValue(0);
  const revealOpacity = useTransform(x, [-SWIPE_DELETE, -24, 0, 24, SWIPE_DELETE], [1, 0.2, 0, 0.2, 1]);
  const [removing, setRemoving] = useState(false);
  const dragged = useRef(false);

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (Math.abs(info.offset.x) > SWIPE_DELETE || Math.abs(info.velocity.x) > 700) {
      setRemoving(true);
      animate(x, info.offset.x > 0 ? 480 : -480, { duration: 0.18 }).then(() => onDelete(_id));
    } else {
      animate(x, 0, { type: 'spring', stiffness: 500, damping: 35 });
    }
    setTimeout(() => { dragged.current = false; }, 0);
  };

  return (
    <m.li
      layout="position"
      initial={{ opacity: 0 }}
      animate={{ opacity: removing ? 0 : 1 }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.18 }}
      className="relative overflow-hidden list-none"
    >
      {/* Revealed behind the row while swiping */}
      <m.div aria-hidden style={{ opacity: revealOpacity }} className="absolute inset-0 bg-red-600 flex items-center justify-between px-6 text-white">
        <Trash2 className="w-5 h-5" />
        <Trash2 className="w-5 h-5" />
      </m.div>

      <m.div
        drag="x"
        dragDirectionLock
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.9}
        style={{ x }}
        onDragStart={() => { dragged.current = true; }}
        onDragEnd={onDragEnd}
        role="button"
        tabIndex={0}
        onClick={() => { if (!dragged.current) onNavigate(notification); }}
        onKeyDown={(e) => { if (e.key === 'Enter') onNavigate(notification); }}
        className={`group relative flex items-center gap-3 px-4 py-3 cursor-pointer select-none touch-pan-y transition-colors ${
          is_read ? 'bg-[#0b0b0c] hover:bg-white/[0.03]' : 'bg-[#120c07] hover:bg-[#1a1108]'
        }`}
      >
        {/* Avatar + action badge */}
        <div className="relative shrink-0">
          {d.system ? (
            <div className="w-11 h-11 rounded-full overflow-hidden ring-1 ring-white/10 bg-zinc-900">
              <img src="/icon-192.webp" alt="" width={44} height={44} className="w-full h-full object-cover" />
            </div>
          ) : (
            <UserAvatar username={d.actorName || '?'} avatarUrl={d.actorAvatar} size={44} />
          )}
          <span
            className="absolute -bottom-0.5 -end-0.5 w-[22px] h-[22px] rounded-full flex items-center justify-center ring-[2.5px] ring-[#0b0b0c] z-20"
            style={{ background: tone.bg, color: tone.fg }}
            aria-hidden
          >
            <Icon className="w-3 h-3" strokeWidth={2.75} />
          </span>
        </div>

        {/* Sentence */}
        <p className={`flex-1 min-w-0 text-sm leading-snug ${is_read ? 'text-zinc-400' : 'text-zinc-200'}`}>
          {!d.system && d.actorName && (
            <bdi className="font-extrabold text-white">{d.actorName}</bdi>
          )}
          {d.system && <span className="font-extrabold text-white">ليه فيزيو</span>}{' '}
          <span>{d.action}</span>
          {d.snippet && (
            <>
              {': '}
              <bdi dir="auto" className="text-zinc-400 line-clamp-2 inline">«{d.snippet}»</bdi>
            </>
          )}{' '}
          <time dateTime={created_at} className="text-zinc-500 whitespace-nowrap text-xs">· {timeAgo(created_at)}</time>
        </p>

        {/* Unread dot / desktop delete */}
        <div className="shrink-0 w-6 flex items-center justify-center">
          {!is_read && <span className="w-2 h-2 rounded-full bg-brand-orange group-hover:md:hidden" aria-label="جديد" />}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onDelete(_id); }}
            className="hidden md:group-hover:flex w-7 h-7 rounded-full items-center justify-center text-zinc-500 hover:text-red-400 hover:bg-red-500/10"
            aria-label="امسح الإشعار"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </m.div>
    </m.li>
  );
};
