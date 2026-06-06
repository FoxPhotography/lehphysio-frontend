export interface User {
  id: number;
  username: string;
  email: string;
  batch: string;
  avatar_url: string | null;
  equipped_frame: string;
  equipped_title: string;
  total_xp: number;
  weekly_xp: number;
  streak_count: number;
  role: 'user' | 'admin' | 'owner';
  last_poll_vote_date?: string;
  last_spin_wheel_date?: string;
  last_surprise_box_date?: string;
  global_rank?: number;
  total_users?: number;
}

export interface Episode {
  id: number;
  title_ar: string;
  title_en: string;
  description: string;
  thumbnail_url: string;
  youtube_url: string;
  quiz_question: string;
  quiz_options: string[];
  quiz_correct: number;
  likes_count: number;
  comments_count: number;
  isLiked?: boolean;
}

export interface Comment {
  id: number;
  post_id?: number;
  episode_id?: number;
  username: string;
  avatar_url: string | null;
  equipped_frame?: string;
  content: string;
  created_at: string;
  parent_id?: number | null;
  likes_count: number;
  has_liked?: boolean;
  replies?: Comment[];
}

export interface Post {
  id: number;
  title: string;
  content: string;
  image_url?: string | null;
  username: string;
  avatar_url: string | null;
  equipped_frame: string;
  created_at: string;
  likes_count: number;
  comments_count: number;
  isLiked?: boolean;
  comments?: Comment[];
  is_news?: boolean;
}

export interface ChatMessage {
  id: number;
  username: string;
  avatar_url: string | null;
  equipped_frame: string;
  message: string;
  timestamp: string;
  reply_to?: {
    id: number;
    username: string;
    message: string;
  } | null;
  reactions?: {
    emoji: string;
    usernames: string[];
  }[];
  isPending?: boolean;
}

export interface XpSettings {
  like: number;
  comment: number;
  share: number;
  comment_like: number;
  daily_login: number;
  streak_bonus: number;
  game_play: number;
  referral: number;
  surprise_box: number;
  poll_vote: number;
  quiz_solve: number;
  suggestion_create?: number;
}

export interface Suggestion {
  id: number;
  title: string;
  content: string;
  username: string;
  created_at: string;
  status: 'pending' | 'approved' | 'rejected';
  upvotes_count: number;
  upvotes?: number;
  has_upvoted?: boolean;
  hasUpvoted?: boolean;
  edit_draft?: { title: string; content: string } | null;
  delete_pending?: boolean;
  rejection_reason?: string | null;
  user_id?: number;
}

export interface GameRoom {
  code: string;
  status: 'waiting' | 'playing' | 'finished';
  rounds: number;
  currentRound: number;
  roundDuration: number;
  players: {
    username: string;
    score: number;
    hasSubmitted: boolean;
    isCorrect?: boolean;
  }[];
  host: string;
  question?: string;
  options?: string[];
  correctOption?: number;
}

export type NotificationType =
  | 'post_approved' | 'post_rejected'
  | 'post_update_approved' | 'post_update_rejected'
  | 'episode_approved' | 'episode_rejected'
  | 'new_comment' | 'comment_reply'
  | 'mention_comment' | 'mention_chat'
  | 'new_post' | 'new_episode'
  | 'suggestion_approved' | 'suggestion_rejected'
  | 'user_muted' | 'user_unmuted'
  | 'user_banned' | 'user_unbanned'
  | 'user_role_updated'
  | 'moderation_post_pending' | 'moderation_post_edited' | 'moderation_suggestion_pending' | 'moderation_report_pending';

export interface AppNotification {
  _id: number;
  recipient_id: number;
  actor_id: { id: number; username: string; avatar_url: string | null } | number | null;
  type: NotificationType;
  target_id: number | null;
  target_type: 'post' | 'comment' | 'episode' | 'chat_message' | 'suggestion' | 'report' | 'user' | null;
  title: string;
  body: string;
  metadata: Record<string, any>;
  is_read: boolean;
  is_deleted: boolean;
  created_at: string;
}

export interface NotificationPreferences {
  comments: boolean;
  replies: boolean;
  mentions: boolean;
  community: boolean;
  moderation: boolean;
}

export interface NotificationPagination {
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

export interface Report {
  id: number;
  reporter: { id: number; username: string; avatar_url: string | null };
  target_user: { id: number; username: string; avatar_url: string | null };
  target_type: 'post' | 'comment' | 'message';
  target_id: number;
  reason: string;
  content_preview: string | null;
  status: 'pending' | 'resolved' | 'dismissed';
  created_at: string;
}
