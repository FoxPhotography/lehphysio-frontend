import React from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle, XCircle, MessageSquare, Reply, AtSign,
  FileText, Tv, Trash2, Shield, UserPlus, VolumeX, Volume2, Lock, Unlock
} from 'lucide-react';
import type { AppNotification, NotificationType } from '../../types';
import { UserAvatar } from '../UserAvatar';

interface NotificationItemProps {
  notification: AppNotification;
  onNavigate: (n: AppNotification) => void;
  onDelete: (id: number) => void;
}

const TYPE_ICONS: Record<NotificationType, React.ReactNode> = {
  post_approved: <CheckCircle className="w-3 h-3" />,
  post_rejected: <XCircle className="w-3 h-3" />,
  post_update_approved: <CheckCircle className="w-3 h-3" />,
  post_update_rejected: <XCircle className="w-3 h-3" />,
  episode_approved: <CheckCircle className="w-3 h-3" />,
  episode_rejected: <XCircle className="w-3 h-3" />,
  new_comment: <MessageSquare className="w-3 h-3" />,
  comment_reply: <Reply className="w-3 h-3" />,
  mention_comment: <AtSign className="w-3 h-3" />,
  mention_chat: <AtSign className="w-3 h-3" />,
  new_post: <FileText className="w-3 h-3" />,
  new_episode: <Tv className="w-3 h-3" />,
  suggestion_approved: <CheckCircle className="w-3 h-3" />,
  suggestion_rejected: <XCircle className="w-3 h-3" />,
  user_muted: <VolumeX className="w-3 h-3" />,
  user_unmuted: <Volume2 className="w-3 h-3" />,
  user_banned: <Lock className="w-3 h-3" />,
  user_unbanned: <Unlock className="w-3 h-3" />,
  user_role_updated: <UserPlus className="w-3 h-3" />,
};

const TYPE_ACCENT: Record<NotificationType, string> = {
  post_approved: '#10b981',
  post_rejected: '#ef4444',
  post_update_approved: '#10b981',
  post_update_rejected: '#ef4444',
  episode_approved: '#10b981',
  episode_rejected: '#ef4444',
  new_comment: '#3b82f6',
  comment_reply: '#8b5cf6',
  mention_comment: '#f59e0b',
  mention_chat: '#f59e0b',
  new_post: '#0ea5e9',
  new_episode: '#f26522',
  suggestion_approved: '#10b981',
  suggestion_rejected: '#ef4444',
  user_muted: '#f59e0b',
  user_unmuted: '#10b981',
  user_banned: '#ef4444',
  user_unbanned: '#10b981',
  user_role_updated: '#f26522',
};

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffSec = Math.floor((now - then) / 1000);

  if (diffSec < 60) return 'Just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;
  return `${Math.floor(diffSec / 604800)}w ago`;
}

export const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onNavigate, onDelete }) => {
  const { _id, type, title, body, is_read, created_at, actor_id } = notification;
  const accentColor = TYPE_ACCENT[type] || 'var(--color-brand-orange)';

  const actorObj = actor_id && typeof actor_id === 'object' ? actor_id : null;
  const senderName = actorObj?.username || 'System';
  const senderAvatar = actorObj?.avatar_url || null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, height: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0 }}
      transition={{ duration: 0.18 }}
      onClick={() => onNavigate(notification)}
      className={`relative flex items-start gap-3.5 px-4 py-3.5 cursor-pointer transition-all duration-200 group border-b border-white/3 select-none ${
        is_read ? 'bg-transparent hover:bg-white/[0.015]' : 'bg-brand-orange/[0.02] hover:bg-brand-orange/[0.04]'
      }`}
    >
      {/* Sender Avatar + Type Icon Overlay */}
      <div className="relative shrink-0 mt-0.5">
        <UserAvatar
          username={senderName}
          avatarUrl={senderAvatar}
          size={36}
        />
        <div
          className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center border shadow-md"
          style={{
            background: '#0a0a0a',
            borderColor: `${accentColor}40`,
            color: accentColor,
            boxShadow: `0 2px 6px ${accentColor}15`,
          }}
        >
          {TYPE_ICONS[type] || <Shield className="w-3 h-3" />}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-0.5 text-left">
        <div className="flex items-start justify-between gap-2">
          <h4
            className={`text-[12.5px] leading-tight truncate ${
              is_read ? 'text-zinc-300 font-bold' : 'text-white font-extrabold'
            }`}
          >
            {title}
          </h4>
          <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
            <span className="text-[10px] font-bold text-zinc-500">
              {timeAgo(created_at)}
            </span>
            {!is_read && (
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{
                  backgroundColor: accentColor,
                  boxShadow: `0 0 6px ${accentColor}`,
                }}
              />
            )}
          </div>
        </div>
        <p
          className={`text-[11px] leading-relaxed line-clamp-2 ${
            is_read ? 'text-zinc-500' : 'text-zinc-400 font-medium'
          }`}
        >
          {body}
        </p>
      </div>

      {/* Delete button (appears on hover) */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete(_id);
        }}
        className="absolute top-3.5 right-3.5 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-150 cursor-pointer z-20 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/10 hover:border-red-500/20 active:scale-95"
        aria-label="Delete notification"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </motion.div>
  );
};
