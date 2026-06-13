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
  const navItems = [
    { page: 'home', label: 'Home', icon: Home },
    { page: 'episodes', label: 'Episodes', icon: Tv },
    { 
      page: 'community', 
      label: 'Chat', 
      icon: MessageSquare, 
      onClick: () => { setCurrentPage('community'); setCommunityTab('chat'); },
      badge: unseenCount > 0 ? unseenCount : null
    },
    { page: 'games', label: 'Games', icon: Gamepad2 },
    { 
      page: 'profile', 
      label: 'Account', 
      icon: User, 
      onClick: () => {
        if (user) setCurrentPage('profile');
        else setCurrentPage('login');
      }
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-18 bg-zinc-950/95 border-t border-zinc-900/60 z-[100] flex justify-around items-center xl:hidden pb-safe backdrop-blur-md shadow-2xl">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = currentPage === item.page || (item.page === 'episodes' && currentPage === 'episode-detail') || (item.page === 'games' && currentPage === 'play-game') || (item.page === 'profile' && currentPage === 'login') || (item.page === 'profile' && currentPage === 'register');
        const handler = item.onClick || (() => setCurrentPage(item.page));

        return (
          <button 
            key={item.page}
            className={`flex-1 h-full flex flex-col items-center justify-center gap-1 cursor-pointer transition-all duration-200 ${
              isActive ? 'text-brand-orange font-bold' : 'text-zinc-500 hover:text-zinc-300'
            }`}
            onClick={handler}
          >
            <div className="relative">
              <Icon className={`w-5 h-5 transition-transform duration-200 ${isActive ? 'scale-110 drop-shadow-[0_0_8px_rgba(255,106,0,0.5)]' : ''}`} />
              {item.badge && (
                <span className="absolute -top-1.5 -right-2 bg-red-500 text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center border border-zinc-950">
                  {item.badge}
                </span>
              )}
            </div>
            <span className="text-[10px] tracking-wide font-medium">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
