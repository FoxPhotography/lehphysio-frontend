import React, { useEffect, useMemo, useRef } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { CheckCheck, Settings, X, BellRing, AtSign, MessageCircle, Tv, Shield, Trash2, Loader2 } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import { NotificationItem } from './NotificationItem';
import { NotificationPreferencesPanel } from './NotificationPreferences';
import type { AppNotification } from '../../types';

type Filter = 'all' | 'unread' | 'mentions' | 'comments' | 'posts' | 'moderation';

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'الكل' },
  { id: 'mentions', label: 'المنشن' },
  { id: 'comments', label: 'التعليقات' },
  { id: 'posts', label: 'المحتوى' },
  { id: 'moderation', label: 'المراجعة' },
];

const EMPTY: Record<Filter, { icon: React.ElementType; title: string; body: string }> = {
  all: { icon: BellRing, title: 'مفيش إشعارات لسه', body: 'لما حد يعلّق أو يعملك منشن أو تنزل حلقة جديدة، هتلاقيها هنا.' },
  unread: { icon: CheckCheck, title: 'قريت كل حاجة', body: 'مفيش جديد دلوقتي.' },
  mentions: { icon: AtSign, title: 'مفيش منشنات', body: 'لما حد يكتب @اسمك في تعليق أو في الشات هتظهر هنا.' },
  comments: { icon: MessageCircle, title: 'مفيش تعليقات', body: 'التعليقات والردود على بوستاتك هتظهر هنا.' },
  posts: { icon: Tv, title: 'مفيش محتوى جديد', body: 'الحلقات والبوستات الجديدة هتظهر هنا.' },
  moderation: { icon: Shield, title: 'مفيش تحديثات', body: 'قبول ورفض بوستاتك واقتراحاتك هيظهر هنا.' },
};

/** "جديد" first (unread), then the rest by recency – the way Instagram/TikTok read. */
function groupNotifications(list: AppNotification[]) {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfWeek = startOfToday - 6 * 864e5;
  const groups: { key: string; label: string; items: AppNotification[] }[] = [
    { key: 'new', label: 'جديد', items: [] },
    { key: 'today', label: 'النهارده', items: [] },
    { key: 'week', label: 'الأسبوع ده', items: [] },
    { key: 'older', label: 'قبل كده', items: [] },
  ];
  for (const n of list) {
    const t = new Date(n.created_at).getTime();
    if (!n.is_read) groups[0].items.push(n);
    else if (t >= startOfToday) groups[1].items.push(n);
    else if (t >= startOfWeek) groups[2].items.push(n);
    else groups[3].items.push(n);
  }
  return groups.filter((g) => g.items.length > 0);
}

const RowSkeleton = () => (
  <div className="flex items-center gap-3 px-4 py-3 animate-pulse" aria-hidden>
    <div className="w-11 h-11 rounded-full bg-zinc-900 shrink-0" />
    <div className="flex-1 space-y-2">
      <div className="h-3 rounded bg-zinc-900 w-4/5" />
      <div className="h-3 rounded bg-zinc-900 w-2/5" />
    </div>
  </div>
);

export const NotificationCenter: React.FC = () => {
  const {
    notifications, isLoading, hasMore, activeFilter, isOpen, showPreferences, unreadCount,
    loadMore, markAllAsRead, clearRead, softDelete, setFilter, setIsOpen, setShowPreferences, navigateToTarget,
  } = useNotifications();

  const panelRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const close = () => { setIsOpen(false); setShowPreferences(false); };

  const groups = useMemo(() => groupNotifications(notifications), [notifications]);

  // Outside click (desktop dropdown) + Escape
  useEffect(() => {
    if (!isOpen) return undefined;
    const onDown = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest('.notification-bell-btn')) return;
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Full-screen on phones: lock the page behind
  useEffect(() => {
    if (!isOpen) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [isOpen]);

  // Infinite scroll
  useEffect(() => {
    if (!isOpen || !sentinelRef.current) return undefined;
    const io = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !isLoading) loadMore();
    }, { rootMargin: '200px' });
    io.observe(sentinelRef.current);
    return () => io.disconnect();
  }, [isOpen, hasMore, isLoading, loadMore]);

  const empty = EMPTY[activeFilter as Filter] ?? EMPTY.all;
  const EmptyIcon = empty.icon;
  const hasRead = notifications.some((n) => n.is_read);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Desktop: dim the page slightly behind the dropdown */}
          <m.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="hidden md:block fixed inset-0 z-[998] bg-black/40"
            onClick={close}
          />

          <m.section
            key="panel"
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="الإشعارات"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ type: 'spring', stiffness: 420, damping: 36 }}
            className="notif-panel fixed z-[999] flex flex-col bg-[#0b0b0c] overflow-hidden
                       inset-0 pt-safe pb-safe
                       md:inset-auto md:pt-0 md:pb-0 md:rounded-3xl md:border md:border-white/10 md:shadow-[0_30px_80px_rgba(0,0,0,0.7)]"
          >
            <AnimatePresence mode="wait" initial={false}>
              {showPreferences ? (
                <NotificationPreferencesPanel key="prefs" />
              ) : (
                <m.div
                  key="list"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.12 }}
                  className="flex flex-col h-full min-h-0"
                >
                  {/* Header */}
                  <header className="flex items-center gap-2 px-2 h-14 shrink-0">
                    <button onClick={close} aria-label="إغلاق" className="w-10 h-10 rounded-full flex items-center justify-center text-zinc-300 hover:bg-white/5 md:hidden">
                      <X className="w-6 h-6" />
                    </button>
                    <h2 className="flex-1 text-xl font-black text-white px-2 md:px-3">الإشعارات</h2>
                    {unreadCount > 0 && (
                      <button
                        onClick={(e) => { e.stopPropagation(); markAllAsRead(); }}
                        className="h-9 px-3 rounded-full flex items-center gap-1.5 text-xs font-bold text-zinc-300 hover:bg-white/5 active:scale-95 transition"
                      >
                        <CheckCheck className="w-4 h-4" />
                        <span>قريت الكل</span>
                      </button>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); setShowPreferences(true); }}
                      aria-label="إعدادات الإشعارات"
                      className="w-10 h-10 rounded-full flex items-center justify-center text-zinc-300 hover:bg-white/5 active:scale-95 transition"
                    >
                      <Settings className="w-5 h-5" />
                    </button>
                  </header>

                  {/* Filter chips */}
                  <nav aria-label="فلترة الإشعارات" className="flex gap-2 px-4 pb-3 overflow-x-auto shrink-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {FILTERS.map((f) => {
                      const active = activeFilter === f.id;
                      return (
                        <button
                          key={f.id}
                          onClick={() => setFilter(f.id)}
                          aria-pressed={active}
                          className={`shrink-0 h-8 px-4 rounded-full text-[13px] font-bold transition-colors active:scale-95 ${
                            active ? 'bg-white text-black' : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800'
                          }`}
                        >
                          {f.label}
                        </button>
                      );
                    })}
                  </nav>

                  <div className="h-px bg-white/[0.06] shrink-0" />

                  {/* List */}
                  <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
                    {isLoading && notifications.length === 0 ? (
                      <div role="status" aria-label="جاري التحميل">{Array.from({ length: 7 }, (_, i) => <RowSkeleton key={i} />)}</div>
                    ) : notifications.length === 0 ? (
                      <div className="flex flex-col items-center justify-center text-center px-8 py-20">
                        <div className="w-20 h-20 rounded-full border-2 border-zinc-800 flex items-center justify-center mb-5">
                          <EmptyIcon className="w-9 h-9 text-zinc-400" strokeWidth={1.6} />
                        </div>
                        <p className="text-lg font-black text-white">{empty.title}</p>
                        <p className="text-sm text-zinc-500 mt-1.5 max-w-[260px] leading-relaxed">{empty.body}</p>
                      </div>
                    ) : (
                      groups.map((g) => (
                        <section key={g.key} aria-label={g.label}>
                          <h3 className="sticky top-0 z-30 bg-[#0b0b0c]/95 px-4 pt-4 pb-2 text-[15px] font-black text-white flex items-center gap-2">
                            {g.label}
                            {g.key === 'new' && <span className="min-w-5 h-5 px-1.5 rounded-full bg-brand-orange text-black text-2xs font-black flex items-center justify-center">{g.items.length}</span>}
                          </h3>
                          <ul>
                            <AnimatePresence initial={false}>
                              {g.items.map((n) => (
                                <NotificationItem key={n._id} notification={n} onNavigate={navigateToTarget} onDelete={softDelete} />
                              ))}
                            </AnimatePresence>
                          </ul>
                        </section>
                      ))
                    )}

                    <div ref={sentinelRef} className="h-1" />
                    {isLoading && notifications.length > 0 && (
                      <div className="flex justify-center py-5"><Loader2 className="w-5 h-5 animate-spin text-zinc-500" /></div>
                    )}

                    {hasRead && !hasMore && (
                      <div className="flex justify-center py-6">
                        <button
                          onClick={(e) => { e.stopPropagation(); clearRead(); }}
                          className="flex items-center gap-2 text-xs font-bold text-zinc-500 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          امسح الإشعارات المقروءة
                        </button>
                      </div>
                    )}
                    <p className="md:hidden text-center text-2xs text-zinc-600 pb-6">اسحب أي إشعار للجنب عشان تمسحه</p>
                  </div>
                </m.div>
              )}
            </AnimatePresence>
          </m.section>
        </>
      )}
    </AnimatePresence>
  );
};
