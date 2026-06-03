import React from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle, XCircle, MessageSquare, Reply, AtSign,
  FileText, Tv, Trash2
} from 'lucide-react';
import type { AppNotification, NotificationType } from '../../types';

interface NotificationItemProps {
  notification: AppNotification;
  onNavigate: (n: AppNotification) => void;
  onDelete: (id: number) => void;
}

// Type-to-icon mapping
const TYPE_ICONS: Record<NotificationType, React.ReactNode> = {
  post_approved: <CheckCircle className="w-4 h-4 text-green-400" />,
  post_rejected: <XCircle className="w-4 h-4 text-red-400" />,
  episode_approved: <CheckCircle className="w-4 h-4 text-green-400" />,
  episode_rejected: <XCircle className="w-4 h-4 text-red-400" />,
  new_comment: <MessageSquare className="w-4 h-4 text-blue-400" />,
  comment_reply: <Reply className="w-4 h-4 text-purple-400" />,
  mention_comment: <AtSign className="w-4 h-4 text-amber-400" />,
  mention_chat: <AtSign className="w-4 h-4 text-amber-400" />,
  new_post: <FileText className="w-4 h-4 text-sky-400" />,
  new_episode: <Tv className="w-4 h-4 text-brand-orange" style={{ color: 'var(--orange)' }} />,
};

// Type-to-accent color mapping
const TYPE_ACCENT: Record<NotificationType, string> = {
  post_approved: '#22c55e',
  post_rejected: '#ef4444',
  episode_approved: '#22c55e',
  episode_rejected: '#ef4444',
  new_comment: '#3b82f6',
  comment_reply: '#a855f7',
  mention_comment: '#f59e0b',
  mention_chat: '#f59e0b',
  new_post: '#0ea5e9',
  new_episode: '#f26522',
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
  const { _id, type, title, body, is_read, created_at } = notification;
  const accentColor = TYPE_ACCENT[type] || 'var(--orange)';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 30, height: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0 }}
      transition={{ duration: 0.2 }}
      onClick={() => onNavigate(notification)}
      className="relative flex items-start gap-3.5 px-4 py-3.5 cursor-pointer transition-all duration-200 group border-b border-zinc-900/40"
      style={{
        background: is_read ? 'transparent' : 'rgba(242, 101, 34, 0.03)',
        borderLeft: is_read ? '3px solid transparent' : `3px solid ${accentColor}`,
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.035)';
        (e.currentTarget as HTMLElement).style.boxShadow = 'inset 0 1px 0 0 rgba(255,255,255,0.02), 0 4px 20px rgba(0,0,0,0.15)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.background = is_read ? 'transparent' : 'rgba(242, 101, 34, 0.03)';
        (e.currentTarget as HTMLElement).style.boxShadow = 'none';
      }}
    >
      {/* Type Icon */}
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
        style={{
          background: `${accentColor}15`,
          border: `1px solid ${accentColor}25`,
        }}
      >
        {TYPE_ICONS[type] || <FileText className="w-4 h-4 text-zinc-400" />}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p
            className="text-[13px] font-extrabold leading-tight truncate"
            style={{ color: is_read ? 'var(--text-secondary)' : 'var(--text-primary)' }}
          >
            {title}
          </p>
          <span className="text-[10px] font-bold shrink-0 mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {timeAgo(created_at)}
          </span>
        </div>
        <p
          className="text-[11px] mt-1 leading-relaxed line-clamp-2"
          style={{ color: 'var(--text-secondary)' }}
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
        className="absolute top-3 right-3 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 cursor-pointer z-20"
        style={{
          background: 'rgba(239, 68, 68, 0.1)',
          color: '#ef4444',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.background = 'rgba(239, 68, 68, 0.2)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.background = 'rgba(239, 68, 68, 0.1)';
        }}
        aria-label="Delete notification"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>

      {/* Unread dot */}
      {!is_read && (
        <div
          className="absolute top-4 right-4 w-2 h-2 rounded-full group-hover:hidden"
          style={{ background: accentColor, boxShadow: `0 0 6px ${accentColor}60` }}
        />
      )}
    </motion.div>
  );
};
