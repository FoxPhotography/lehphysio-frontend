import React from 'react';
import { Home, Tv, MessageSquare, Gamepad2, User } from 'lucide-react';

interface BottomNavProps {
  currentPage: string;
  setCurrentPage: (page: string) => void;
  setCommunityTab: (tab: 'feed' | 'chat') => void;
  unseenCount: number;
  user: any;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentPage,
  setCurrentPage,
  setCommunityTab,
  unseenCount,
  user
}) => {
  if (currentPage === 'play-game') return null;

  const navItems = [
    { page: 'home', label: 'الرئيسية', icon: Home, active: ['home'] },
    { page: 'episodes', label: 'الحلقات', icon: Tv, active: ['episodes', 'episode-detail'] },
    {
      page: 'community',
      label: 'الشات',
      icon: MessageSquare,
      active: ['community'],
      onClick: () => { setCurrentPage('community'); setCommunityTab('chat'); },
      badge: unseenCount > 0 ? (unseenCount > 99 ? '99+' : String(unseenCount)) : null
    },
    { page: 'games', label: 'الألعاب', icon: Gamepad2, active: ['games', 'play-game'] },
    {
      page: 'profile',
      label: user ? 'حسابي' : 'دخول',
      icon: User,
      active: ['profile', 'login', 'register', 'confirm', 'forgot-password', 'reset-password'],
      onClick: () => setCurrentPage(user ? 'profile' : 'login')
    },
  ];

  return (
    <nav
      aria-label="التنقل الرئيسي"
      className="fixed bottom-0 inset-x-0 z-[100] xl:hidden bg-zinc-950/95 border-t border-zinc-900/60 pb-safe"
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
              onClick={handler}
            >
              {isActive && <span className="absolute top-0 inset-x-6 h-0.5 rounded-full bg-brand-orange" aria-hidden />}
              <span className="relative">
                <Icon className="w-[22px] h-[22px]" strokeWidth={isActive ? 2.4 : 2} />
                {item.badge && (
                  <span className="absolute -top-1.5 -end-2.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-2xs font-black rounded-full flex items-center justify-center border-2 border-zinc-950 leading-none">
                    {item.badge}
                  </span>
                )}
              </span>
              <span className={`text-2xs leading-none ${isActive ? 'font-bold' : 'font-medium'}`}>{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
