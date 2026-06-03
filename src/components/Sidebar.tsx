import React from 'react';
import { UserAvatar } from './UserAvatar';
import logo from '../assets/LOGO.svg';
import { NotificationBell } from './notifications/NotificationBell';
import { 
  Mic, 
  Home, 
  Tv, 
  MessageSquare, 
  Gamepad2, 
  Trophy, 
  Store, 
  User,
  ShieldCheck,
  LayoutDashboard
} from 'lucide-react';

interface SidebarProps {
  currentPage: string;
  setCurrentPage: (page: string) => void;
  setCommunityTab: (tab: 'feed' | 'chat') => void;
  unseenCount: number;
  user: any;
  equippedTitle: string;
  getAvatarFrameClass: () => string;
}

// Helper to strip any emojis from text
const stripEmojis = (str: string) => {
  if (!str) return '';
  return str.replace(/[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]/g, '').trim();
};

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  setCurrentPage,
  setCommunityTab,
  unseenCount,
  user,
  equippedTitle,
  getAvatarFrameClass
}) => {
  const getCleanTitle = () => {
    if (equippedTitle && equippedTitle !== 'none') {
      return stripEmojis(equippedTitle);
    }
    if (user?.rank?.name_en) {
      return stripEmojis(user.rank.name_en);
    }
    return '';
  };

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
    { page: 'leaderboard', label: 'Leaderboard', icon: Trophy },
    { page: 'rewards', label: 'Shop', icon: Store },
  ];

  return (
    <aside className="fixed top-0 left-0 bottom-0 w-[280px] bg-zinc-950/80 border-r border-zinc-900/60 p-8 flex flex-col z-50 hidden lg:flex backdrop-blur-md">
      {/* Logo */}
      <a 
        href="#" 
        className="flex items-center justify-center w-full mb-6 hover:opacity-90 transition-opacity" 
        onClick={(e) => { e.preventDefault(); setCurrentPage('home'); }}
        style={{ overflow: 'hidden', height: '72px' }}
      >
        <img 
          src={logo} 
          alt="Leh Physio Logo" 
          style={{ 
            width: '280px', 
            height: '280px', 
            objectFit: 'none',
            objectPosition: 'center center',
            marginTop: '-104px',
            marginBottom: '-104px',
            flexShrink: 0
          }} 
        />
      </a>

      {user && (
        <div className="flex items-center justify-between mb-6 px-3.5 py-1.5 bg-zinc-900/20 rounded-xl border border-zinc-900/40 shrink-0">
          <span className="text-xs font-bold text-zinc-400">Notifications</span>
          <NotificationBell />
        </div>
      )}

      {/* Navigation List */}
      <nav className="flex-1">
        <ul className="flex flex-col gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.page || (item.page === 'episodes' && currentPage === 'episode-detail') || (item.page === 'games' && currentPage === 'play-game');
            const handler = item.onClick || (() => setCurrentPage(item.page));

            return (
              <li key={item.page}>
                <button
                  className={`w-full flex items-center justify-between p-3.5 rounded-xl font-bold text-sm transition-all duration-200 cursor-pointer text-right group ${
                    isActive 
                      ? 'bg-gradient-to-r from-brand-orange/15 to-transparent text-white border-r-4 border-brand-orange' 
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-900/40'
                  }`}
                  onClick={handler}
                >
                  <span className="flex items-center gap-3.5">
                    <Icon className={`w-5 h-5 transition-transform duration-200 group-hover:scale-105 ${isActive ? 'text-brand-orange' : 'text-zinc-400 group-hover:text-white'}`} />
                    <span>{item.label}</span>
                  </span>
                  {item.badge && (
                    <span className="bg-red-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-md">
                      {item.badge}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
          {user && (
            <li>
              <button
                className={`w-full flex items-center p-3.5 rounded-xl font-bold text-sm transition-all duration-200 cursor-pointer text-right group ${
                  currentPage === 'profile'
                    ? 'bg-gradient-to-r from-brand-orange/15 to-transparent text-white border-r-4 border-brand-orange' 
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900/40'
                }`}
                onClick={() => setCurrentPage('profile')}
              >
                <span className="flex items-center gap-3.5">
                  <User className={`w-5 h-5 transition-transform duration-200 group-hover:scale-105 ${currentPage === 'profile' ? 'text-brand-orange' : 'text-zinc-400 group-hover:text-white'}`} />
                  <span>Profile</span>
                </span>
              </button>
            </li>
          )}
          {user && (() => {
            const ROLE_WEIGHTS = { user: 0, moderator: 1, admin: 2, owner: 3 };
            const weight = ROLE_WEIGHTS[user.role] || 0;
            return (
              <>
                {weight >= 1 && (
                  <li>
                    <button
                      className={`w-full flex items-center p-3.5 rounded-xl font-bold text-sm transition-all duration-200 cursor-pointer text-right group ${
                        currentPage === 'moderator-dashboard'
                          ? 'bg-gradient-to-r from-brand-orange/15 to-transparent text-white border-r-4 border-brand-orange' 
                          : 'text-zinc-400 hover:text-white hover:bg-zinc-900/40'
                      }`}
                      onClick={() => setCurrentPage('moderator-dashboard')}
                    >
                      <span className="flex items-center gap-3.5">
                        <ShieldCheck className={`w-5 h-5 transition-transform duration-200 group-hover:scale-105 ${currentPage === 'moderator-dashboard' ? 'text-brand-orange' : 'text-zinc-400 group-hover:text-white'}`} />
                        <span>Moderator Panel</span>
                      </span>
                    </button>
                  </li>
                )}
                {weight >= 2 && (
                  <li>
                    <button
                      className={`w-full flex items-center p-3.5 rounded-xl font-bold text-sm transition-all duration-200 cursor-pointer text-right group ${
                        currentPage === 'admin'
                          ? 'bg-gradient-to-r from-brand-orange/15 to-transparent text-white border-r-4 border-brand-orange' 
                          : 'text-zinc-400 hover:text-white hover:bg-zinc-900/40'
                      }`}
                      onClick={() => setCurrentPage('admin')}
                    >
                      <span className="flex items-center gap-3.5">
                        <LayoutDashboard className={`w-5 h-5 transition-transform duration-200 group-hover:scale-105 ${currentPage === 'admin' ? 'text-brand-orange' : 'text-zinc-400 group-hover:text-white'}`} />
                        <span>Admin Panel</span>
                      </span>
                    </button>
                  </li>
                )}
              </>
            );
          })()}
        </ul>
      </nav>

      {/* User Section */}
      <div className="border-t border-zinc-900/60 pt-6 mt-auto">
        {user ? (
          <div className="flex items-center gap-3 p-2 bg-zinc-900/20 rounded-2xl border border-zinc-900/40">
            <UserAvatar 
              username={user.username} 
              avatarUrl={user.avatar_url} 
              equippedFrame={user.equipped_frame} 
              size={40} 
            />
            <div className="min-w-0 flex-1">
              <div className="font-extrabold text-sm text-white truncate">
                {user.username}
              </div>
              <div className="text-[10px] text-zinc-500 font-medium tracking-wide flex items-center gap-1 uppercase">
                {user.role === 'owner' || user.role === 'admin' ? (
                  <span className="flex items-center gap-0.5 text-brand-orange font-bold">
                    <ShieldCheck className="w-3 h-3" />
                    {user.role}
                  </span>
                ) : (
                  <span>{getCleanTitle()}</span>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <button 
              className="w-full bg-gradient-to-r from-brand-orange to-brand-amber hover:opacity-90 active:scale-95 text-black font-extrabold text-xs py-3 px-4 rounded-xl cursor-pointer shadow-orange-glow transition-all" 
              onClick={() => setCurrentPage('login')}
            >
              Login
            </button>
            <button 
              className="w-full border border-zinc-800 hover:border-brand-orange hover:bg-brand-orange/5 text-white font-bold text-xs py-3 px-4 rounded-xl cursor-pointer transition-all" 
              onClick={() => setCurrentPage('register')}
            >
              Register
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
