import React from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { Home, Tv, MessageSquare, Gamepad2, User } from 'lucide-react';
import { playSound } from '../utils/soundEngine';
import { haptic } from './games/ui/feedback';

interface BottomNavProps {
  currentPage: string;
  setCurrentPage: (page: string) => void;
  setCommunityTab: (tab: 'feed' | 'chat') => void;
  unseenCount: number;
  unseenPostsCount?: number;
  unseenEpisodesCount?: number;
  availableGamesCount?: number;
  user: any;
}

const formatBadge = (n: number) => (n > 9 ? '9+' : String(n));

export const BottomNav: React.FC<BottomNavProps> = ({
  currentPage,
  setCurrentPage,
  setCommunityTab,
  unseenCount,
  unseenPostsCount = 0,
  unseenEpisodesCount = 0,
  availableGamesCount = 0,
  user
}) => {
  if (currentPage === 'play-game') return null;

  const navItems = [
    {
      page: 'home',
      label: 'الرئيسية',
      icon: Home,
      active: ['home'],
      badge: unseenPostsCount > 0 ? formatBadge(unseenPostsCount) : null,
      badgeClass: 'bg-gradient-to-br from-brand-orange to-amber-400 text-black shadow-[0_0_10px_rgba(255,106,0,0.55)]',
      pulse: false,
    },
    {
      page: 'episodes',
      label: 'الحلقات',
      icon: Tv,
      active: ['episodes', 'episode-detail'],
      badge: unseenEpisodesCount > 0 ? formatBadge(unseenEpisodesCount) : null,
      badgeClass: 'bg-gradient-to-br from-sky-400 to-blue-500 text-black shadow-[0_0_10px_rgba(56,189,248,0.55)]',
      pulse: false,
    },
    {
      page: 'community',
      label: 'الشات',
      icon: MessageSquare,
      active: ['community'],
      onClick: () => { setCurrentPage('community'); setCommunityTab('chat'); },
      badge: unseenCount > 0 ? formatBadge(unseenCount) : null,
      badgeClass: 'bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-[0_0_10px_rgba(244,63,94,0.6)]',
      pulse: true,
    },
    {
      page: 'games',
      label: 'الألعاب',
      icon: Gamepad2,
      active: ['games', 'play-game'],
      badge: availableGamesCount > 0 ? formatBadge(availableGamesCount) : null,
      badgeClass: 'bg-gradient-to-br from-emerald-400 to-teal-500 text-black shadow-[0_0_10px_rgba(16,185,129,0.5)]',
      pulse: false,
    },
    {
      page: 'profile',
      label: user ? 'حسابي' : 'دخول',
      icon: User,
      active: ['profile', 'login', 'register', 'social-register', 'confirm', 'forgot-password', 'reset-password'],
      onClick: () => setCurrentPage(user ? 'profile' : 'login'),
      badge: null,
      badgeClass: '',
      pulse: false,
    },
  ];

  return (
    <nav
      aria-label="التنقل الرئيسي"
      className="fixed bottom-0 inset-x-0 z-[100] xl:hidden bg-zinc-950/95 backdrop-blur-md border-t border-zinc-900/60 pb-safe"
    >
      <div className="h-nav flex items-stretch justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.active.includes(currentPage);
          const handler = item.onClick || (() => setCurrentPage(item.page));

          return (
            <button
              key={item.page}
              type="button"
              aria-current={isActive ? 'page' : undefined}
              className={`relative flex-1 min-w-0 flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors duration-150 active:scale-95 ${
                isActive ? 'text-brand-orange' : 'text-zinc-500 hover:text-zinc-300'
              }`}
              onClick={() => {
                playSound('nav');
                haptic('tap');
                handler();
              }}
            >
              {isActive && <span className="absolute top-0 inset-x-6 h-0.5 rounded-full bg-brand-orange" aria-hidden />}
              <span className="relative">
                <Icon className="w-[22px] h-[22px]" strokeWidth={isActive ? 2.4 : 2} />
                <AnimatePresence>
                  {item.badge && (
                    <m.span
                      key={`${item.page}-${item.badge}`}
                      initial={{ scale: 0, opacity: 0, y: 4 }}
                      animate={{ scale: 1, opacity: 1, y: 0 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ type: 'spring', stiffness: 480, damping: 24 }}
                      className={`absolute -top-2 -end-2.5 min-w-[18px] h-[18px] px-1 text-[10px] font-black rounded-full flex items-center justify-center border-2 border-zinc-950 leading-none tabular-nums ${item.badgeClass}`}
                    >
                      {item.pulse && (
                        <span className="absolute inset-0 rounded-full bg-rose-500 animate-ping opacity-40 pointer-events-none" />
                      )}
                      <span className="relative z-10">{item.badge}</span>
                    </m.span>
                  )}
                </AnimatePresence>
              </span>
              <span className={`text-2xs leading-none ${isActive ? 'font-bold' : 'font-medium'}`}>{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
