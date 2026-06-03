import React, { useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCheck, Trash2, Settings, BellOff, Loader2, MessageSquare, AtSign, Tv, Shield
} from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import { NotificationItem } from './NotificationItem';
import { NotificationPreferencesPanel } from './NotificationPreferences';
import type { AppNotification } from '../../types';

export const NotificationCenter: React.FC = () => {
  const {
    notifications,
    isLoading,
    hasMore,
    activeFilter,
    isOpen,
    showPreferences,
    loadMore,
    markAllAsRead,
    clearRead,
    softDelete,
    setFilter,
    setIsOpen,
    setShowPreferences,
    navigateToTarget,
    unreadCount,
  } = useNotifications();

  const panelRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Group notifications chronologically
  const getGroupedNotifications = useCallback(() => {
    const todayGroup: AppNotification[] = [];
    const yesterdayGroup: AppNotification[] = [];
    const thisWeekGroup: AppNotification[] = [];
    const olderGroup: AppNotification[] = [];

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfYesterday = startOfToday - 24 * 60 * 60 * 1000;
    const startOfThisWeek = startOfToday - 7 * 24 * 60 * 60 * 1000;

    notifications.forEach((n) => {
      const date = new Date(n.created_at).getTime();
      if (date >= startOfToday) {
        todayGroup.push(n);
      } else if (date >= startOfYesterday) {
        yesterdayGroup.push(n);
      } else if (date >= startOfThisWeek) {
        thisWeekGroup.push(n);
      } else {
        olderGroup.push(n);
      }
    });

    return {
      today: todayGroup,
      yesterday: yesterdayGroup,
      thisWeek: thisWeekGroup,
      older: olderGroup,
    };
  }, [notifications]);

  // Close on click outside or escape key
  useEffect(() => {
    if (!isOpen) return () => {};

    const handleClickOutside = (e: MouseEvent) => {
      const clickedBell = (e.target as HTMLElement).closest('.notification-bell-btn');
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        !clickedBell
      ) {
        setIsOpen(false);
        setShowPreferences(false);
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        setShowPreferences(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, setIsOpen, setShowPreferences]);

  // Lock body scroll when open
  useEffect(() => {
    if (!isOpen) return () => {};

    const origHtmlOverflow = document.documentElement.style.overflow;
    const origBodyOverflow = document.body.style.overflow;

    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';

    return () => {
      document.documentElement.style.overflow = origHtmlOverflow;
      document.body.style.overflow = origBodyOverflow;
    };
  }, [isOpen]);

  // Infinite scroll observer
  useEffect(() => {
    if (!sentinelRef.current || !isOpen) return () => {};

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [isOpen, hasMore, isLoading, loadMore]);

  if (!isOpen) return null;

  const renderEmptyState = () => {
    let title = 'No notifications yet';
    let description = 'We\'ll notify you when something important happens.';
    let icon = <BellOff className="w-8 h-8 text-zinc-500" />;

    if (activeFilter === 'unread') {
      title = 'You\'re all caught up';
      description = 'No unread notifications to review.';
      icon = (
        <div className="relative">
          <CheckCheck className="w-8 h-8 text-emerald-400" />
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400"
          />
        </div>
      );
    } else if (activeFilter === 'mentions') {
      title = 'No mentions found';
      description = 'Notifications where you are mentioned will appear here.';
      icon = <AtSign className="w-8 h-8 text-zinc-500" />;
    } else if (activeFilter === 'comments') {
      title = 'No comments or replies';
      description = 'Activity on your posts and comments will show up here.';
      icon = <MessageSquare className="w-8 h-8 text-zinc-500" />;
    } else if (activeFilter === 'posts') {
      title = 'No posts or episodes';
      description = 'New content updates from the community will appear here.';
      icon = <Tv className="w-8 h-8 text-zinc-500" />;
    } else if (activeFilter === 'moderation') {
      title = 'No moderation updates';
      description = 'Updates on your post approvals and settings will show here.';
      icon = <Shield className="w-8 h-8 text-zinc-500" />;
    }

    return (
      <div className="flex flex-col items-center justify-center py-14 px-6 text-center select-none">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 bg-white/2 border border-white/5 shadow-inner"
        >
          {icon}
        </div>
        <p className="text-sm font-black text-white">{title}</p>
        <p className="text-[11px] mt-1 text-zinc-500 font-bold max-w-[200px] leading-relaxed">
          {description}
        </p>
      </div>
    );
  };

  return (
    <>
      {/* Mobile backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[998] bg-black/50 backdrop-blur-sm md:hidden"
        onClick={() => { setIsOpen(false); setShowPreferences(false); }}
      />

      {/* Panel Container */}
      <motion.div
        ref={panelRef}
        initial={{ opacity: 0, y: -8, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -8, scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 450, damping: 30 }}
        className="fixed z-[999] overflow-hidden flex flex-col"
        style={{
          top: 'var(--notification-panel-top, 56px)',
          right: 'var(--notification-panel-right, 16px)',
          left: 'var(--notification-panel-left, auto)',
          bottom: 'var(--notification-panel-bottom, auto)',
          width: 'var(--notification-panel-width, 380px)',
          maxHeight: 'var(--notification-panel-max-height, min(70vh, 520px))',
          borderRadius: '20px',
          background: 'var(--color-bg-card)',
          border: '1px solid var(--color-border-card)',
          boxShadow: '0 25px 65px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
        }}
      >
        <AnimatePresence mode="wait">
          {showPreferences ? (
            <NotificationPreferencesPanel key="preferences" />
          ) : (
            <motion.div
              key="notifications"
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.18 }}
              className="flex flex-col max-h-[inherit] h-full min-h-0"
            >
              {/* Header */}
              <div
                className="flex items-center justify-between px-4 py-3.5 border-b shrink-0"
                style={{ borderColor: 'rgba(255,255,255,0.06)' }}
              >
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black tracking-tight text-white">
                    Notifications
                  </h3>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-brand-orange/15 text-brand-orange border border-brand-orange/20 animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  {unreadCount > 0 && (
                    <button
                      onClick={(e) => { e.stopPropagation(); markAllAsRead(); }}
                      className="p-2 rounded-xl transition-all cursor-pointer bg-white/3 border border-white/5 text-zinc-400 hover:text-brand-orange hover:border-brand-orange/25 active:scale-95"
                      title="Mark all as read"
                    >
                      <CheckCheck className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowPreferences(true); }}
                    className="p-2 rounded-xl transition-all cursor-pointer bg-white/3 border border-white/5 text-zinc-400 hover:text-brand-orange hover:border-brand-orange/25 active:scale-95"
                    title="Notification Settings"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Filter tabs */}
              <div
                className="flex items-center gap-1.5 px-4 py-2 border-b shrink-0 overflow-x-auto scrollbar-none"
                style={{ borderColor: 'rgba(255,255,255,0.06)' }}
              >
                {([
                  { id: 'all', label: 'All' },
                  { id: 'unread', label: 'Unread' },
                  { id: 'mentions', label: 'Mentions' },
                  { id: 'comments', label: 'Comments' },
                  { id: 'posts', label: 'Posts' },
                  { id: 'moderation', label: 'Moderation' }
                ] as const).map((filterItem) => {
                  const isActive = activeFilter === filterItem.id;
                  return (
                    <button
                      key={filterItem.id}
                      onClick={() => setFilter(filterItem.id)}
                      className="relative px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer capitalize shrink-0 focus-visible:outline-none"
                      style={{
                        color: isActive ? 'var(--color-brand-orange)' : 'var(--text-secondary)',
                      }}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="activeFilterTab"
                          className="absolute inset-0 rounded-xl bg-brand-orange/10 border border-brand-orange/20"
                          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        />
                      )}
                      <span className="relative z-10 flex items-center gap-1">
                        {filterItem.label}
                        {filterItem.id === 'unread' && unreadCount > 0 && (
                          <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black bg-red-500/15 text-red-500 border border-red-500/20">
                            {unreadCount > 99 ? '99+' : unreadCount}
                          </span>
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Notification list */}
              <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto overscroll-contain min-h-0"
                style={{ overscrollBehavior: 'contain' }}
              >
                {notifications.length === 0 && !isLoading ? (
                  renderEmptyState()
                ) : (
                  <div className="flex flex-col divide-y divide-white/3">
                    {(() => {
                      const groups = getGroupedNotifications();
                      return (
                        <>
                          {groups.today.length > 0 && (
                            <div className="flex flex-col">
                              <div className="px-4 py-2 text-[10px] font-black uppercase tracking-wider text-zinc-500 bg-zinc-950/20 sticky top-0 backdrop-blur-sm z-[2] border-b border-white/3">
                                Today
                              </div>
                              {groups.today.map((notif) => (
                                <NotificationItem
                                  key={notif._id}
                                  notification={notif}
                                  onNavigate={navigateToTarget}
                                  onDelete={softDelete}
                                />
                              ))}
                            </div>
                          )}
                          {groups.yesterday.length > 0 && (
                            <div className="flex flex-col">
                              <div className="px-4 py-2 text-[10px] font-black uppercase tracking-wider text-zinc-500 bg-zinc-950/20 sticky top-0 backdrop-blur-sm z-[2] border-b border-white/3">
                                Yesterday
                              </div>
                              {groups.yesterday.map((notif) => (
                                <NotificationItem
                                  key={notif._id}
                                  notification={notif}
                                  onNavigate={navigateToTarget}
                                  onDelete={softDelete}
                                />
                              ))}
                            </div>
                          )}
                          {groups.thisWeek.length > 0 && (
                            <div className="flex flex-col">
                              <div className="px-4 py-2 text-[10px] font-black uppercase tracking-wider text-zinc-500 bg-zinc-950/20 sticky top-0 backdrop-blur-sm z-[2] border-b border-white/3">
                                This Week
                              </div>
                              {groups.thisWeek.map((notif) => (
                                <NotificationItem
                                  key={notif._id}
                                  notification={notif}
                                  onNavigate={navigateToTarget}
                                  onDelete={softDelete}
                                />
                              ))}
                            </div>
                          )}
                          {groups.older.length > 0 && (
                            <div className="flex flex-col">
                              <div className="px-4 py-2 text-[10px] font-black uppercase tracking-wider text-zinc-500 bg-zinc-950/20 sticky top-0 backdrop-blur-sm z-[2] border-b border-white/3">
                                Older
                              </div>
                              {groups.older.map((notif) => (
                                <NotificationItem
                                  key={notif._id}
                                  notification={notif}
                                  onNavigate={navigateToTarget}
                                  onDelete={softDelete}
                                />
                              ))}
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                )}

                {/* Infinite scroll sentinel */}
                <div ref={sentinelRef} className="h-1 shrink-0" />

                {/* Loading indicator */}
                {isLoading && (
                  <div className="flex items-center justify-center py-5">
                    <Loader2 className="w-5 h-5 animate-spin text-brand-orange" />
                  </div>
                )}
              </div>

              {/* Footer: Clear read */}
              {notifications.some(n => n.is_read) && (
                <div
                  className="px-4 py-3 border-t shrink-0 bg-zinc-950/30"
                  style={{ borderColor: 'rgba(255,255,255,0.06)' }}
                >
                  <button
                    onClick={(e) => { e.stopPropagation(); clearRead(); }}
                    className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer border border-red-500/15 bg-red-500/5 text-red-400 hover:bg-red-500/10 active:scale-[0.99]"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Clear read notifications
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );
};
