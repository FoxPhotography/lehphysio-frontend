import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { m, AnimatePresence } from 'framer-motion';
import { Menu, X, ChevronLeft, type LucideIcon } from 'lucide-react';

export interface DashboardNavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  /** Short helper line shown under the label in the sidebar. */
  hint?: string;
  /** Pending-items badge. Hidden when 0 / undefined. */
  count?: number;
  /** Items sharing a group render under one heading. */
  group?: string;
}

type Accent = 'orange' | 'emerald';

const ACCENTS: Record<Accent, {
  headerIcon: string;
  activeRow: string;
  activeIcon: string;
  activeLabel: string;
  bar: string;
  badge: string;
  badgeActive: string;
  dot: string;
  chip: string;
  chipIcon: string;
}> = {
  orange: {
    headerIcon: 'bg-gradient-to-br from-orange-500/25 to-amber-500/5 border-orange-500/30 text-orange-400',
    activeRow: 'bg-gradient-to-l from-orange-500/[0.14] to-orange-500/[0.03] border-orange-500/25',
    activeIcon: 'bg-orange-500 text-black shadow-lg shadow-orange-500/30',
    activeLabel: 'text-white',
    bar: 'bg-orange-500',
    badge: 'bg-orange-500/15 text-orange-300 border border-orange-500/20',
    badgeActive: 'bg-orange-500 text-black',
    dot: 'bg-orange-500',
    chip: 'border-orange-500/25 bg-orange-500/[0.07]',
    chipIcon: 'bg-orange-500 text-black',
  },
  emerald: {
    headerIcon: 'bg-gradient-to-br from-emerald-500/25 to-teal-500/5 border-emerald-500/30 text-emerald-400',
    activeRow: 'bg-gradient-to-l from-emerald-500/[0.14] to-emerald-500/[0.03] border-emerald-500/25',
    activeIcon: 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/30',
    activeLabel: 'text-white',
    bar: 'bg-emerald-500',
    badge: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/20',
    badgeActive: 'bg-emerald-500 text-black',
    dot: 'bg-emerald-500',
    chip: 'border-emerald-500/25 bg-emerald-500/[0.07]',
    chipIcon: 'bg-emerald-500 text-black',
  },
};

interface DashboardShellProps {
  accent: Accent;
  title: string;
  subtitle: string;
  headerIcon: LucideIcon;
  /** Small pill next to the title inside the sidebar (e.g. the viewer's role). */
  roleLabel?: string;
  items: DashboardNavItem[];
  activeId: string;
  onSelect: (id: string) => void;
  children: React.ReactNode;
}

/**
 * Admin / moderator layout: a sticky sidebar on desktop (xl+) and, on smaller
 * screens, a sticky "current section" bar that opens the same navigation as a
 * slide-in drawer. Replaces the wrapped row of tab pills.
 */
export const DashboardShell: React.FC<DashboardShellProps> = ({
  accent,
  title,
  subtitle,
  headerIcon: HeaderIcon,
  roleLabel,
  items,
  activeId,
  onSelect,
  children,
}) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const a = ACCENTS[accent];
  const active = items.find(i => i.id === activeId) || items[0];
  const ActiveIcon = active?.icon;
  const totalPending = items.reduce((sum, i) => sum + (i.count || 0), 0);

  // Lock page scroll + close on Escape while the drawer is open
  useEffect(() => {
    if (!drawerOpen) return undefined;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setDrawerOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', onKey);
    };
  }, [drawerOpen]);

  const handleSelect = (id: string) => {
    onSelect(id);
    setDrawerOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const groups = useMemo(() => {
    const out: { name: string; items: DashboardNavItem[] }[] = [];
    for (const item of items) {
      const name = item.group || '';
      let g = out.find(x => x.name === name);
      if (!g) { g = { name, items: [] }; out.push(g); }
      g.items.push(item);
    }
    return out;
  }, [items]);

  const navList = (
    <nav className="space-y-5" aria-label={title}>
      {groups.map(group => (
        <div key={group.name || 'default'} className="space-y-1">
          {group.name && (
            <p className="px-3 pb-1 text-[10px] font-black tracking-[0.14em] text-zinc-600">{group.name}</p>
          )}
          {group.items.map(item => {
            const Icon = item.icon;
            const isActive = item.id === activeId;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelect(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`relative w-full flex items-center gap-3 rounded-2xl border px-2.5 py-2.5 text-start transition-all cursor-pointer group ${
                  isActive
                    ? a.activeRow
                    : 'border-transparent hover:bg-white/[0.04] hover:border-white/[0.06]'
                }`}
              >
                {isActive && (
                  <m.span
                    layoutId={`dash-bar-${accent}`}
                    className={`absolute start-0 top-1/2 -translate-y-1/2 h-7 w-[3px] rounded-e-full ${a.bar}`}
                  />
                )}
                <span
                  className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                    isActive ? a.activeIcon : 'bg-white/[0.05] text-zinc-400 group-hover:text-zinc-200'
                  }`}
                >
                  <Icon className="w-[18px] h-[18px]" strokeWidth={2.25} />
                </span>
                <span className="flex-1 min-w-0">
                  <span className={`block text-[13px] font-extrabold leading-tight truncate ${isActive ? a.activeLabel : 'text-zinc-300 group-hover:text-white'}`}>
                    {item.label}
                  </span>
                  {item.hint && (
                    <span className="block text-[11px] text-zinc-500 leading-snug truncate mt-0.5">{item.hint}</span>
                  )}
                </span>
                {!!item.count && item.count > 0 && (
                  <span className={`shrink-0 min-w-[22px] h-[22px] px-1.5 rounded-full text-[11px] font-black flex items-center justify-center tabular-nums ${isActive ? a.badgeActive : a.badge}`}>
                    {item.count > 99 ? '99+' : item.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      ))}
    </nav>
  );

  const brand = (
    <div className="flex items-center gap-3">
      <div className={`shrink-0 w-11 h-11 rounded-2xl border flex items-center justify-center ${a.headerIcon}`}>
        <HeaderIcon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-black text-white leading-tight truncate">{title}</h1>
          {roleLabel && (
            <span className="shrink-0 text-[10px] font-black px-1.5 py-0.5 rounded-md bg-white/[0.06] border border-white/[0.08] text-zinc-400">
              {roleLabel}
            </span>
          )}
        </div>
        <p className="text-xs text-zinc-500 truncate">{subtitle}</p>
      </div>
    </div>
  );

  return (
    <div className="w-full max-w-3xl xl:max-w-6xl mx-auto px-4 xl:pt-6">
      <div className="xl:grid xl:grid-cols-[260px_minmax(0,1fr)] xl:gap-8 xl:items-start">
        {/* ── Desktop sidebar ─────────────────────────────── */}
        <aside className="hidden xl:block sticky top-6">
          <div className="rounded-3xl border border-white/[0.07] bg-zinc-950/70 p-4 space-y-5 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.8)]">
            {brand}
            <div className="h-px bg-white/[0.06]" />
            {navList}
          </div>
        </aside>

        {/* ── Content column ─────────────────────────────── */}
        <div className="min-w-0 space-y-5">
          {/* Mobile: title row — menu button on the right, same side the drawer slides in from */}
          <div className="xl:hidden flex items-center gap-3">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label="افتح قائمة الأقسام"
              className="relative shrink-0 w-11 h-11 rounded-2xl border border-white/[0.08] bg-white/[0.04] flex items-center justify-center text-zinc-200 active:scale-95 transition-transform cursor-pointer"
            >
              <Menu className="w-5 h-5" />
              {totalPending > 0 && (
                <span className={`absolute -top-1 -end-1 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-black text-black flex items-center justify-center ring-2 ring-black ${a.dot}`}>
                  {totalPending > 99 ? '99+' : totalPending}
                </span>
              )}
            </button>
            {brand}
          </div>

          {/* Mobile: sticky current-section bar */}
          {active && ActiveIcon && (
            <div className="xl:hidden sticky z-30 top-[calc(4rem+env(safe-area-inset-top,0px)+0.5rem)] -mx-1">
              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                className={`w-full flex items-center gap-3 rounded-2xl border px-3 py-2.5 bg-zinc-950/90 backdrop-blur-md shadow-lg shadow-black/40 active:scale-[0.99] transition-transform cursor-pointer ${a.chip}`}
              >
                <span className={`shrink-0 w-8 h-8 rounded-xl flex items-center justify-center ${a.chipIcon}`}>
                  <ActiveIcon className="w-4 h-4" strokeWidth={2.4} />
                </span>
                <span className="flex-1 min-w-0 text-start">
                  <span className="block text-[10px] font-bold text-zinc-500 leading-none mb-1">القسم الحالي</span>
                  <span className="block text-sm font-black text-white leading-none truncate">{active.label}</span>
                </span>
                {!!active.count && active.count > 0 && (
                  <span className={`shrink-0 min-w-[22px] h-[22px] px-1.5 rounded-full text-[11px] font-black flex items-center justify-center ${a.badgeActive}`}>
                    {active.count}
                  </span>
                )}
                <span className="shrink-0 flex items-center gap-1 text-[11px] font-bold text-zinc-400">
                  غيّر
                  <ChevronLeft className="w-4 h-4 rtl:rotate-0 ltr:rotate-180" />
                </span>
              </button>
            </div>
          )}

          {/* Desktop: section heading */}
          {active && ActiveIcon && (
            <div className="hidden xl:flex items-center gap-3 pb-1">
              <span className={`w-10 h-10 rounded-xl flex items-center justify-center ${a.chipIcon}`}>
                <ActiveIcon className="w-5 h-5" strokeWidth={2.4} />
              </span>
              <div>
                <h2 className="text-xl font-black text-white leading-tight">{active.label}</h2>
                {active.hint && <p className="text-xs text-zinc-500">{active.hint}</p>}
              </div>
            </div>
          )}

          {children}
        </div>
      </div>

      {/* ── Mobile drawer ───────────────────────────────── */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {drawerOpen && (
            <div className="fixed inset-0 z-[1000] xl:hidden" role="dialog" aria-modal="true" aria-label={title}>
              <m.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => setDrawerOpen(false)}
                className="absolute inset-0 bg-black/70 backdrop-blur-[2px]"
              />
              <m.aside
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', stiffness: 380, damping: 38 }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={{ left: 0, right: 0.5 }}
                onDragEnd={(_, info) => { if (info.offset.x > 80 || info.velocity.x > 500) setDrawerOpen(false); }}
                className="absolute inset-y-0 right-0 w-[86%] max-w-[330px] bg-[#0a0a0b] border-s border-white/[0.07] shadow-[-20px_0_60px_rgba(0,0,0,0.7)] flex flex-col pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)]"
              >
                <div className="flex items-start justify-between gap-3 p-4 pb-3">
                  {brand}
                  <button
                    type="button"
                    onClick={() => setDrawerOpen(false)}
                    aria-label="اقفل القائمة"
                    className="shrink-0 w-9 h-9 rounded-xl bg-white/[0.05] border border-white/[0.06] flex items-center justify-center text-zinc-400 hover:text-white cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="mx-4 h-px bg-white/[0.06]" />
                <div className="flex-1 overflow-y-auto overscroll-contain p-3 pt-4">
                  {navList}
                </div>
              </m.aside>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
};
