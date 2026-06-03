import React, { useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCheck, Trash2, Settings, BellOff, Loader2
} from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import { NotificationItem } from './NotificationItem';
import { NotificationPreferencesPanel } from './NotificationPreferences';

export const NotificationCenter: React.FC = () => {
  const {
    notifications,
    isLoading,
    hasMore,
    activeFilter,
    isOpen,
    showPreferences,
    fetchNotifications,
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

  const getGroupedNotifications = useCallback(() => {
    const unread = notifications.filter(n => !n.is_read);
    const read = notifications.filter(n => n.is_read);

    const today: typeof notifications = [];
    const yesterday: typeof notifications = [];
    const earlier: typeof notifications = [];

    const now = new Date();
    const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterdayDate = todayDate - 24 * 60 * 60 * 1000;

    read.forEach((n) => {
      const date = new Date(n.created_at).getTime();
      if (date >= todayDate) {
        today.push(n);
      } else if (date >= yesterdayDate) {
        yesterday.push(n);
      } else {
        earlier.push(n);
      }
    });

    return {
      unread,
      today,
      yesterday,
      earlier,
    };
  }, [notifications]);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;

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

    // Close on Escape key
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

  // Lock page scroll when open
  useEffect(() => {
    if (!isOpen) return;

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
    if (!sentinelRef.current || !isOpen) return;

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

  return (
    <>
      {/* Mobile backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[998] bg-black/40 backdrop-blur-sm md:hidden"
        onClick={() => { setIsOpen(false); setShowPreferences(false); }}
      />

      {/* Panel */}
      <motion.div
        ref={panelRef}
        initial={{ opacity: 0, y: -8, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -8, scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
        className="fixed z-[999] overflow-hidden flex flex-col"
        style={{
          top: 'var(--notification-panel-top, 56px)',
          right: 'var(--notification-panel-right, 16px)',
          left: 'var(--notification-panel-left, auto)',
          bottom: 'var(--notification-panel-bottom, auto)',
          width: 'var(--notification-panel-width, 380px)',
          maxHeight: 'var(--notification-panel-max-height, min(70vh, 520px))',
          borderRadius: '16px',
          background: 'var(--card-bg)',
          border: '1px solid var(--card-border)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.03) inset',
        }}
      >
        <AnimatePresence mode="wait">
          {showPreferences ? (
            <NotificationPreferencesPanel key="preferences" />
          ) : (
            <motion.div
              key="notifications"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col h-full"
            >
              {/* Header */}
              <div
                className="flex items-center justify-between px-4 py-3 border-b shrink-0"
                style={{ borderColor: 'var(--card-border)' }}
              >
                <h3
                  className="text-sm font-black tracking-tight"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Notifications
                </h3>
                <div className="flex items-center gap-1">
                  {/* Mark all as read */}
                  {unreadCount > 0 && (
                    <button
                      onClick={(e) => { e.stopPropagation(); markAllAsRead(); }}
                      className="p-1.5 rounded-lg transition-colors cursor-pointer"
                      style={{ color: 'var(--text-secondary)' }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)';
                        (e.currentTarget as HTMLElement).style.color = 'var(--orange)';
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.background = 'transparent';
                        (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)';
                      }}
                      title="Mark all as read"
                    >
                      <CheckCheck className="w-4 h-4" />
                    </button>
                  )}
                  {/* Settings */}
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowPreferences(true); }}
                    className="p-1.5 rounded-lg transition-colors cursor-pointer"
                    style={{ color: 'var(--text-secondary)' }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)';
                      (e.currentTarget as HTMLElement).style.color = 'var(--orange)';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.background = 'transparent';
                      (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)';
                    }}
                    title="Notification Settings"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Filter tabs */}
              <div
                className="flex items-center gap-1 px-4 py-2 border-b shrink-0"
                style={{ borderColor: 'var(--card-border)' }}
              >
                {(['all', 'unread'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className="px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer capitalize"
                    style={{
                      background: activeFilter === f ? 'rgba(242, 101, 34, 0.15)' : 'transparent',
                      color: activeFilter === f ? 'var(--orange)' : 'var(--text-secondary)',
                      border: activeFilter === f ? '1px solid rgba(242, 101, 34, 0.2)' : '1px solid transparent',
                    }}
                  >
                    {f === 'all' ? 'All' : 'Unread'}
                    {f === 'unread' && unreadCount > 0 && (
                      <span
                        className="ml-1.5 px-1.5 py-0.5 rounded-full text-[9px] font-black"
                        style={{
                          background: 'rgba(239, 68, 68, 0.2)',
                          color: '#ef4444',
                        }}
                      >
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Notification list */}
              <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto overscroll-contain"
                style={{ minHeight: '120px', overscrollBehavior: 'contain' }}
              >
                {notifications.length === 0 && !isLoading ? (
                  <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                    <div
                      className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                      style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid var(--card-border)',
                      }}
                    >
                      <BellOff className="w-7 h-7 text-zinc-500" />
                    </div>
                    <p className="text-sm font-black text-white">
                      {activeFilter === 'unread' ? 'No unread notifications' : 'No notifications'}
                    </p>
                    <p className="text-[11px] mt-1 text-zinc-500 font-bold">
                      Your notifications will show up here
                    </p>
                  </div>
                ) : (
                  <AnimatePresence initial={false}>
                    {(() => {
                      const groups = getGroupedNotifications();
                      return (
                        <div className="flex flex-col divide-y divide-zinc-900/40">
                          {groups.unread.length > 0 && (
                            <div className="flex flex-col">
                              <div className="px-4 py-2 text-[10px] font-black uppercase tracking-wider text-brand-orange bg-zinc-950/30 sticky top-0 backdrop-blur-sm z-[2]">
                                New
                              </div>
                              {groups.unread.map((notif) => (
                                <NotificationItem
                                  key={notif._id}
                                  notification={notif}
                                  onNavigate={navigateToTarget}
                                  onDelete={softDelete}
                                />
                              ))}
                            </div>
                          )}
                          {groups.today.length > 0 && (
                            <div className="flex flex-col">
                              <div className="px-4 py-2 text-[10px] font-black uppercase tracking-wider text-zinc-500 bg-zinc-950/30 sticky top-0 backdrop-blur-sm z-[2]">
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
                              <div className="px-4 py-2 text-[10px] font-black uppercase tracking-wider text-zinc-500 bg-zinc-950/30 sticky top-0 backdrop-blur-sm z-[2]">
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
                          {groups.earlier.length > 0 && (
                            <div className="flex flex-col">
                              <div className="px-4 py-2 text-[10px] font-black uppercase tracking-wider text-zinc-500 bg-zinc-950/30 sticky top-0 backdrop-blur-sm z-[2]">
                                Earlier
                              </div>
                              {groups.earlier.map((notif) => (
                                <NotificationItem
                                  key={notif._id}
                                  notification={notif}
                                  onNavigate={navigateToTarget}
                                  onDelete={softDelete}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </AnimatePresence>
                )}

                {/* Infinite scroll sentinel */}
                <div ref={sentinelRef} className="h-1" />

                {/* Loading indicator */}
                {isLoading && (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-5 h-5 animate-spin" style={{ color: 'var(--orange)' }} />
                  </div>
                )}
              </div>

              {/* Footer: Clear read */}
              {notifications.some(n => n.is_read) && (
                <div
                  className="px-4 py-2.5 border-t shrink-0"
                  style={{ borderColor: 'var(--card-border)' }}
                >
                  <button
                    onClick={(e) => { e.stopPropagation(); clearRead(); }}
                    className="flex items-center justify-center gap-2 w-full py-2 rounded-xl text-[11px] font-bold transition-all cursor-pointer"
                    style={{
                      background: 'rgba(239, 68, 68, 0.06)',
                      color: '#ef4444',
                      border: '1px solid rgba(239, 68, 68, 0.1)',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.background = 'rgba(239, 68, 68, 0.12)';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.background = 'rgba(239, 68, 68, 0.06)';
                    }}
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
