import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';
import { notificationService } from '../services/notificationService';
import { feedCacheService } from '../services/feedCacheService';
import { playChatSound } from '../utils/helpers';
import type { AppNotification, NotificationPreferences, NotificationPagination } from '../types';

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  isLoading: boolean;
  hasMore: boolean;
  activeFilter: 'all' | 'unread' | 'mentions' | 'comments' | 'posts' | 'moderation';
  preferences: NotificationPreferences;
  isOpen: boolean;
  showPreferences: boolean;
  deepLinkTarget: any;

  // Actions
  fetchNotifications: (reset?: boolean) => Promise<void>;
  loadMore: () => Promise<void>;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  clearRead: () => Promise<void>;
  softDelete: (id: number) => Promise<void>;
  setFilter: (filter: 'all' | 'unread' | 'mentions' | 'comments' | 'posts' | 'moderation') => void;
  updatePreferences: (prefs: Partial<NotificationPreferences>) => Promise<void>;
  setIsOpen: (open: boolean) => void;
  setShowPreferences: (show: boolean) => void;
  setDeepLinkTarget: (target: any) => void;

  // Deep link navigation
  navigateToTarget: (notification: AppNotification) => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

const DEFAULT_PREFERENCES: NotificationPreferences = {
  comments: true,
  replies: true,
  mentions: true,
  community: true,
  moderation: true,
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, user, changePage } = useAuth();
  const socket = useSocket();

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [pagination, setPagination] = useState<NotificationPagination>({
    page: 1,
    limit: 20,
    total: 0,
    hasMore: false,
  });
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'mentions' | 'comments' | 'posts' | 'moderation'>('all');
  const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULT_PREFERENCES);
  const [isOpen, setIsOpen] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [deepLinkTarget, setDeepLinkTarget] = useState<any>(null);

  const isInitialized = useRef(false);
  const currentPage = useRef(1);

  // Fetch notifications (paginated)
  const fetchNotifications = useCallback(async (reset = false) => {
    if (!token) return;
    setIsLoading(true);

    try {
      const page = reset ? 1 : currentPage.current;
      const res = await notificationService.fetchNotifications(page, 20, activeFilter, token);
      if (res.ok) {
        const data = await res.json();
        const userId = user?.id;
        if (reset) {
          setNotifications(data.notifications || []);
          currentPage.current = 1;
          if (userId) {
            feedCacheService.set(`notifications_${userId}_${activeFilter}`, {
              notifications: data.notifications || [],
              unreadCount
            });
          }
        } else {
          setNotifications(prev => {
            const existingIds = new Set(prev.map(n => n._id));
            const newNotifs = (data.notifications || []).filter((n: AppNotification) => !existingIds.has(n._id));
            const merged = [...prev, ...newNotifs];
            if (userId) {
              feedCacheService.set(`notifications_${userId}_${activeFilter}`, {
                notifications: merged,
                unreadCount
              });
            }
            return merged;
          });
        }
        setPagination(data.pagination || { page: 1, limit: 20, total: 0, hasMore: false });
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setIsLoading(false);
    }
  }, [token, activeFilter, user?.id, unreadCount]);

  // Load more (infinite scroll)
  const loadMore = useCallback(async () => {
    if (!pagination.hasMore || isLoading) return;
    currentPage.current = currentPage.current + 1;
    await fetchNotifications(false);
  }, [pagination.hasMore, isLoading, fetchNotifications]);

  // Mark single as read
  const markAsRead = useCallback(async (id: number) => {
    if (!token) return;
    // Optimistic update
    setNotifications(prev => {
      const updated = prev.map(n => n._id === id ? { ...n, is_read: true } : n);
      const userId = user?.id;
      if (userId) {
        feedCacheService.set(`notifications_${userId}_${activeFilter}`, {
          notifications: updated,
          unreadCount: Math.max(0, unreadCount - 1)
        });
      }
      return updated;
    });
    setUnreadCount(prev => Math.max(0, prev - 1));

    try {
      await notificationService.markAsRead(id, token);
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  }, [token, user?.id, activeFilter, unreadCount]);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    if (!token) return;
    // Optimistic update
    setNotifications(prev => {
      const updated = prev.map(n => ({ ...n, is_read: true }));
      const userId = user?.id;
      if (userId) {
        feedCacheService.set(`notifications_${userId}_${activeFilter}`, {
          notifications: updated,
          unreadCount: 0
        });
      }
      return updated;
    });
    setUnreadCount(0);

    try {
      await notificationService.markAllAsRead(token);
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  }, [token, user?.id, activeFilter]);

  // Clear read
  const clearRead = useCallback(async () => {
    if (!token) return;
    // Optimistic update
    setNotifications(prev => {
      const updated = prev.filter(n => !n.is_read);
      const userId = user?.id;
      if (userId) {
        feedCacheService.set(`notifications_${userId}_${activeFilter}`, {
          notifications: updated,
          unreadCount
        });
      }
      return updated;
    });

    try {
      await notificationService.clearRead(token);
    } catch (err) {
      console.error('Error clearing read notifications:', err);
    }
  }, [token, user?.id, activeFilter, unreadCount]);

  // Soft delete single
  const softDelete = useCallback(async (id: number) => {
    if (!token) return;
    const notif = notifications.find(n => n._id === id);
    const isUnread = notif && !notif.is_read;
    const nextUnreadCount = isUnread ? Math.max(0, unreadCount - 1) : unreadCount;

    // Optimistic update
    setNotifications(prev => {
      const updated = prev.filter(n => n._id !== id);
      const userId = user?.id;
      if (userId) {
        feedCacheService.set(`notifications_${userId}_${activeFilter}`, {
          notifications: updated,
          unreadCount: nextUnreadCount
        });
      }
      return updated;
    });
    if (isUnread) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }

    try {
      await notificationService.softDelete(id, token);
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  }, [token, notifications, user?.id, activeFilter, unreadCount]);

  // Set filter
  const setFilter = useCallback((filter: 'all' | 'unread' | 'mentions' | 'comments' | 'posts' | 'moderation') => {
    setActiveFilter(filter);
    currentPage.current = 1;
  }, []);

  // Update preferences
  const updatePreferences = useCallback(async (prefs: Partial<NotificationPreferences>) => {
    if (!token) return;
    // Optimistic update
    setPreferences(prev => ({ ...prev, ...prefs }));

    try {
      const res = await notificationService.updatePreferences(prefs as Record<string, boolean>, token);
      if (res.ok) {
        const data = await res.json();
        if (data.preferences) setPreferences(data.preferences);
      }
    } catch (err) {
      console.error('Error updating notification preferences:', err);
    }
  }, [token]);

  // Navigate to notification target (deep linking)
  const navigateToTarget = useCallback((notification: AppNotification) => {
    // Mark as read first
    if (!notification.is_read) {
      markAsRead(notification._id);
    }
    setIsOpen(false);

    const { type, target_id, target_type, metadata } = notification;

    switch (type) {
      case 'new_post':
      case 'post_approved':
      case 'post_rejected':
      case 'post_update_approved':
      case 'post_update_rejected': {
        const postId = metadata?.postId || target_id;
        if (postId) {
          setDeepLinkTarget({ type: 'post', targetId: postId, postId });
          changePage('home');
          window.history.replaceState({}, '', `/post/${postId}`);
        }
        break;
      }
      case 'new_comment':
      case 'comment_reply':
      case 'mention_comment': {
        const postId = metadata?.postId;
        const commentId = metadata?.commentId || target_id;
        if (postId) {
          setDeepLinkTarget({ type: 'comment', targetId: commentId, postId, commentId });
          changePage('home');
          window.history.replaceState({}, '', `/post/${postId}?comment=${commentId}`);
        }
        break;
      }
      case 'new_episode':
      case 'episode_approved':
      case 'episode_rejected': {
        const episodeId = metadata?.episodeId || target_id;
        if (episodeId) {
          setDeepLinkTarget({ type: 'episode', targetId: episodeId, episodeId });
          changePage('episode-detail', { id: episodeId });
          window.history.replaceState({}, '', `/episodes/${episodeId}`);
        } else {
          changePage('episodes');
        }
        break;
      }
      case 'mention_chat': {
        const messageId = metadata?.messageId || target_id;
        if (messageId) {
          setDeepLinkTarget({ type: 'chat_message', targetId: messageId, messageId });
          changePage('community');
          window.history.replaceState({}, '', `/chat#message-${messageId}`);
        }
        break;
      }
      case 'suggestion_approved':
      case 'suggestion_rejected': {
        const suggestionId = metadata?.suggestionId || target_id;
        setDeepLinkTarget({ type: 'suggestion', targetId: suggestionId, suggestionId });
        changePage('community');
        window.history.replaceState({}, '', `/chat?tab=suggestions`);
        break;
      }
      case 'moderation_post_pending': {
        localStorage.setItem('moderator_active_tab', 'posts');
        changePage('moderator-dashboard');
        window.history.replaceState({}, '', `/moderator?tab=posts`);
        window.dispatchEvent(new CustomEvent('change_moderator_tab', { detail: 'posts' }));
        break;
      }
      case 'moderation_post_edited': {
        localStorage.setItem('moderator_active_tab', 'revisions');
        changePage('moderator-dashboard');
        window.history.replaceState({}, '', `/moderator?tab=revisions`);
        window.dispatchEvent(new CustomEvent('change_moderator_tab', { detail: 'revisions' }));
        break;
      }
      case 'moderation_suggestion_pending': {
        localStorage.setItem('moderator_active_tab', 'suggestions');
        changePage('moderator-dashboard');
        window.history.replaceState({}, '', `/moderator?tab=suggestions`);
        window.dispatchEvent(new CustomEvent('change_moderator_tab', { detail: 'suggestions' }));
        break;
      }
      case 'moderation_report_pending': {
        localStorage.setItem('moderator_active_tab', 'reports');
        changePage('moderator-dashboard');
        window.history.replaceState({}, '', `/moderator?tab=reports`);
        window.dispatchEvent(new CustomEvent('change_moderator_tab', { detail: 'reports' }));
        break;
      }
      case 'user_muted':
      case 'user_unmuted':
      case 'user_banned':
      case 'user_unbanned':
      case 'user_role_updated': {
        changePage('profile');
        window.history.replaceState({}, '', `/profile`);
        break;
      }
      default:
        changePage('home');
    }
  }, [changePage, markAsRead]);

  // Load cached notifications immediately on mount/filter change
  useEffect(() => {
    const userId = user?.id;
    if (userId) {
      feedCacheService.get(`notifications_${userId}_${activeFilter}`).then(cache => {
        if (cache && cache.data) {
          setNotifications(cache.data.notifications || []);
          setUnreadCount(cache.data.unreadCount || 0);
        }
      });
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [user?.id, token, activeFilter]);

  // Initialize: fetch notifications, preferences, and unread count on token change
  useEffect(() => {
    if (token) {
      currentPage.current = 1;
      fetchNotifications(true);

      // Fetch unread count
      notificationService.fetchUnreadCount(token)
        .then(async (res) => {
          if (res.ok) {
            const data = await res.json();
            setUnreadCount(data.unreadCount || 0);
            const userId = user?.id;
            if (userId) {
              feedCacheService.get(`notifications_${userId}_${activeFilter}`).then(cache => {
                const notifs = cache ? cache.data.notifications : [];
                feedCacheService.set(`notifications_${userId}_${activeFilter}`, {
                  notifications: notifs,
                  unreadCount: data.unreadCount || 0
                });
              });
            }
          }
        })
        .catch(err => console.error('Error fetching unread count:', err));

      // Fetch preferences
      notificationService.getPreferences(token)
        .then(async (res) => {
          if (res.ok) {
            const data = await res.json();
            setPreferences(data || DEFAULT_PREFERENCES);
          }
        })
        .catch(err => console.error('Error fetching preferences:', err));

      // Authenticate socket
      if (user?.id && socket?.connected) {
        socket.emit('authenticate', user.id);
      }
      
      isInitialized.current = true;
    } else {
      // Logged out: reset state
      setNotifications([]);
      setUnreadCount(0);
      setPagination({ page: 1, limit: 20, total: 0, hasMore: false });
      isInitialized.current = false;
    }
  }, [token]);

  // Re-authenticate socket when user.id becomes available (delayed login)
  useEffect(() => {
    if (user?.id && socket?.connected) {
      socket.emit('authenticate', user.id);
    }
  }, [user?.id, socket]);

  // Refetch when filter changes
  useEffect(() => {
    if (isInitialized.current) {
      fetchNotifications(true);
    }
  }, [activeFilter]);

  // Listen to socket reconnection event to resync
  useEffect(() => {
    const handleReconnectSync = () => {
      fetchNotifications(true);
      if (token) {
        notificationService.fetchUnreadCount(token)
          .then(async (res) => {
            if (res.ok) {
              const data = await res.json();
              setUnreadCount(data.unreadCount || 0);
            }
          })
          .catch(err => console.error(err));
      }
    };
    window.addEventListener('socket_reconnect', handleReconnectSync);
    return () => window.removeEventListener('socket_reconnect', handleReconnectSync);
  }, [token, activeFilter, fetchNotifications]);

  // Socket listeners for real-time updates
  useEffect(() => {
    if (!socket) return () => {};

    const handleNewNotification = (notif: AppNotification) => {
      // Deduplicate: only add if not already in the list
      setNotifications(prev => {
        if (prev.some(n => n._id === notif._id)) return prev;
        const updated = [notif, ...prev];
        const userId = user?.id;
        if (userId) {
          feedCacheService.set(`notifications_${userId}_${activeFilter}`, {
            notifications: updated,
            unreadCount: unreadCount + 1
          });
        }
        return updated;
      });
      setUnreadCount(prev => prev + 1);
      // Play sound
      playChatSound('success');
    };

    const handleCountUpdate = (data: { unreadCount: number }) => {
      setUnreadCount(data.unreadCount);
      const userId = user?.id;
      if (userId) {
        feedCacheService.get(`notifications_${userId}_${activeFilter}`).then(cache => {
          const notifs = cache ? cache.data.notifications : [];
          feedCacheService.set(`notifications_${userId}_${activeFilter}`, {
            notifications: notifs,
            unreadCount: data.unreadCount
          });
        });
      }
    };

    const handleNotificationRead = (data: { notificationId: number }) => {
      setNotifications(prev => {
        const updated = prev.map(n => n._id === data.notificationId ? { ...n, is_read: true } : n);
        const userId = user?.id;
        if (userId) {
          feedCacheService.set(`notifications_${userId}_${activeFilter}`, {
            notifications: updated,
            unreadCount: Math.max(0, unreadCount - 1)
          });
        }
        return updated;
      });
      setUnreadCount(prev => Math.max(0, prev - 1));
    };

    const handleAllRead = () => {
      setNotifications(prev => {
        const updated = prev.map(n => ({ ...n, is_read: true }));
        const userId = user?.id;
        if (userId) {
          feedCacheService.set(`notifications_${userId}_${activeFilter}`, {
            notifications: updated,
            unreadCount: 0
          });
        }
        return updated;
      });
      setUnreadCount(0);
    };

    socket.on('new_notification', handleNewNotification);
    socket.on('notification_created', handleNewNotification);
    socket.on('notification_count_update', handleCountUpdate);
    socket.on('notification_read', handleNotificationRead);
    socket.on('notifications_all_read', handleAllRead);

    return () => {
      socket.off('new_notification', handleNewNotification);
      socket.off('notification_created', handleNewNotification);
      socket.off('notification_count_update', handleCountUpdate);
      socket.off('notification_read', handleNotificationRead);
      socket.off('notifications_all_read', handleAllRead);
    };
  }, [socket, user?.id, activeFilter, unreadCount]);

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    isLoading,
    hasMore: pagination.hasMore,
    activeFilter,
    preferences,
    isOpen,
    showPreferences,
    deepLinkTarget,
    fetchNotifications,
    loadMore,
    markAsRead,
    markAllAsRead,
    clearRead,
    softDelete,
    setFilter,
    updatePreferences,
    setIsOpen,
    setShowPreferences,
    setDeepLinkTarget,
    navigateToTarget,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
