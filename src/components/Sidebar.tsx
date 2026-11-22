import React, { useRef, useState } from 'react';
import { rankName } from '../utils/ranks';
import { UserAvatar } from './UserAvatar';
import { PresenceMenu } from './PresenceMenu';
import logo from '../assets/logo-wordmark.webp';
import { NotificationBell } from './notifications/NotificationBell';
import { SoundSettingsButton } from './common/SoundSettings';
import { playSound } from '../utils/soundEngine';
import { haptic } from './games/ui/feedback';
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
  unseenPostsCount?: number;
  unseenEpisodesCount?: number;
  availableGamesCount?: number;
  user: any;
  equippedTitle: string;
  getAvatarFrameClass: () => string;
}

const formatBadge = (n: number) => (n > 9 ? '9+' : String(n));

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
  unseenPostsCount = 0,
  unseenEpisodesCount = 0,
  availableGamesCount = 0,
  user,
  equippedTitle,
  getAvatarFrameClass
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const getCleanTitle = () => {
    if (equippedTitle && equippedTitle !== 'none') {
      return stripEmojis(equippedTitle);
    }
    if (user?.rank) {
      return rankName(user.rank);
    }
    return '';
  };

  const navItems = [
    { page: 'home', label: 'الرئيسية', icon: Home, badge: unseenPostsCount > 0 ? formatBadge(unseenPostsCount) : null, badgeClass: 'bg-brand-orange text-black' },
    { page: 'episodes', label: 'الحلقات', icon: Tv, badge: unseenEpisodesCount > 0 ? formatBadge(unseenEpisodesCount) : null, badgeClass: 'bg-sky-400 text-black' },
    { 
      page: 'community', 
      label: 'الشات', 
      icon: MessageSquare, 
      onClick: () => { setCurrentPage('community'); setCommunityTab('chat'); },
      badge: unseenCount > 0 ? formatBadge(unseenCount) : null,
      badgeClass: 'bg-red-500 text-white'
    },
    { page: 'games', label: 'الألعاب', icon: Gamepad2, badge: availableGamesCount > 0 ? formatBadge(availableGamesCount) : null, badgeClass: 'bg-emerald-400 text-black' },
    { page: 'leaderboard', label: 'الترتيب', icon: Trophy },
    { page: 'rewards', label: 'المتجر', icon: Store },
  ];

  return (
    <aside className="fixed top-0 start-0 bottom-0 w-[280px] bg-zinc-950/80 border-e border-zinc-900/60 p-8 flex flex-col z-50 hidden xl:flex">
      {/* Logo */}
      <button
        type="button"
        className="flex items-center justify-center w-full mb-8 mt-2 hover:opacity-90 transition-opacity cursor-pointer select-none bg-transparent border-0 p-0"
        style={{ WebkitTouchCallout: 'none', WebkitUserSelect: 'none' }}
        onContextMenu={(e) => e.preventDefault()}
        onClick={() => setCurrentPage('home')}
        aria-label="ليه فيزيو؟ — الرئيسية"
      >
        <img
          src={logo}
          alt="Leh Physio"
          width={210}
          height={43}
          className="w-[210px] h-auto pointer-events-none select-none"
          draggable={false}
          decoding="async"
        />
      </button>

      <div className="flex items-center justify-between gap-2 mb-6 px-3 py-1.5 bg-zinc-900/20 rounded-xl border border-zinc-900/40 shrink-0">
        {user ? (
          <div className="flex items-center gap-2">
            <NotificationBell />
            <span className="text-xs font-bold text-zinc-400">الإشعارات</span>
          </div>
        ) : (
          <span className="text-xs font-bold text-zinc-400">الصوت والمؤثرات</span>
        )}
        <SoundSettingsButton className="w-8 h-8" />
      </div>

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
                  className={`w-full flex items-center justify-between p-3.5 rounded-xl font-bold text-sm transition-all duration-200 cursor-pointer text-end group ${
                    isActive 
                      ? 'bg-gradient-to-r from-brand-orange/15 to-transparent text-white border-e-4 border-brand-orange' 
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-900/40'
                  }`}
                  onClick={() => {
                    playSound('nav');
                    haptic('tap');
                    handler();
                  }}
                >
                  <span className="flex items-center gap-3.5">
                    <Icon className={`w-5 h-5 transition-transform duration-200 group-hover:scale-105 ${isActive ? 'text-brand-orange' : 'text-zinc-400 group-hover:text-white'}`} />
                    <span>{item.label}</span>
                  </span>
                  {item.badge && (
                    <span className={`${(item as any).badgeClass || 'bg-red-500 text-white'} text-2xs font-black px-2 py-0.5 rounded-full shadow-md tabular-nums`}>
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
                className={`w-full flex items-center p-3.5 rounded-xl font-bold text-sm transition-all duration-200 cursor-pointer text-end group ${
                  currentPage === 'profile'
                    ? 'bg-gradient-to-r from-brand-orange/15 to-transparent text-white border-e-4 border-brand-orange' 
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900/40'
                }`}
                onClick={() => {
                  playSound('nav');
                  haptic('tap');
                  setCurrentPage('profile');
                }}
              >
                <span className="flex items-center gap-3.5">
                  <User className={`w-5 h-5 transition-transform duration-200 group-hover:scale-105 ${currentPage === 'profile' ? 'text-brand-orange' : 'text-zinc-400 group-hover:text-white'}`} />
                  <span>حسابي</span>
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
                      className={`w-full flex items-center p-3.5 rounded-xl font-bold text-sm transition-all duration-200 cursor-pointer text-end group ${
                        currentPage === 'moderator-dashboard'
                          ? 'bg-gradient-to-r from-brand-orange/15 to-transparent text-white border-e-4 border-brand-orange' 
                          : 'text-zinc-400 hover:text-white hover:bg-zinc-900/40'
                      }`}
                      onClick={() => {
                        playSound('nav');
                        haptic('tap');
                        setCurrentPage('moderator-dashboard');
                      }}
                    >
                      <span className="flex items-center gap-3.5">
                        <ShieldCheck className={`w-5 h-5 transition-transform duration-200 group-hover:scale-105 ${currentPage === 'moderator-dashboard' ? 'text-brand-orange' : 'text-zinc-400 group-hover:text-white'}`} />
                        <span>لوحة المشرفين</span>
                      </span>
                    </button>
                  </li>
                )}
                {weight >= 2 && (
                  <li>
                    <button
                      className={`w-full flex items-center p-3.5 rounded-xl font-bold text-sm transition-all duration-200 cursor-pointer text-end group ${
                        currentPage === 'admin'
                          ? 'bg-gradient-to-r from-brand-orange/15 to-transparent text-white border-e-4 border-brand-orange' 
                          : 'text-zinc-400 hover:text-white hover:bg-zinc-900/40'
                      }`}
                      onClick={() => {
                        playSound('nav');
                        haptic('tap');
                        setCurrentPage('admin');
                      }}
                    >
                      <span className="flex items-center gap-3.5">
                        <LayoutDashboard className={`w-5 h-5 transition-transform duration-200 group-hover:scale-105 ${currentPage === 'admin' ? 'text-brand-orange' : 'text-zinc-400 group-hover:text-white'}`} />
                        <span>لوحة الإدارة</span>
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
          <button 
            type="button"
            onClick={() => setCurrentPage('profile')}
            className={`w-full flex items-center gap-3 p-2.5 rounded-2xl border transition-all duration-200 cursor-pointer text-start group ${
              currentPage === 'profile'
                ? 'bg-brand-orange/10 border-brand-orange/40 shadow-orange-glow'
                : 'bg-zinc-900/20 border-zinc-900/40 hover:bg-zinc-900/60 hover:border-zinc-800 active:scale-[0.98]'
            }`}
            title="روح لحسابك"
          >
            <div
              className="relative shrink-0"
              ref={menuRef}
              onClick={(e) => e.stopPropagation()}
            >
              <UserAvatar
                username={user.username}
                avatarUrl={user.avatar_url}
                equippedFrame={user.equipped_frame}
                size={40}
                onClick={() => setMenuOpen((prev) => !prev)}
                style={{ cursor: 'pointer' }}
              />
              <PresenceMenu
                open={menuOpen}
                onClose={() => setMenuOpen(false)}
                onOpenProfile={() => setCurrentPage('profile')}
                containerRef={menuRef}
                direction="up"
                alignClass="bottom-12 start-0 origin-bottom-start"
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-extrabold text-sm text-white truncate group-hover:text-brand-orange transition-colors">
                {user.username}
              </div>
              <div className="text-2xs text-zinc-500 font-medium tracking-wide flex items-center gap-1 uppercase">
                {user.role === 'owner' || user.role === 'admin' ? (
                  <span className="flex items-center gap-0.5 text-brand-orange font-bold">
                    <ShieldCheck className="w-3 h-3" />
                    {user.role === 'owner' ? 'المالك' : 'أدمن'}
                  </span>
                ) : (
                  <span>{getCleanTitle()}</span>
                )}
              </div>
            </div>
          </button>
        ) : (
          <div className="flex flex-col gap-2">
            <button 
              className="w-full bg-gradient-to-r from-brand-orange to-brand-amber hover:opacity-90 active:scale-95 text-black font-extrabold text-xs py-3 px-4 rounded-xl cursor-pointer shadow-orange-glow transition-all" 
              onClick={() => setCurrentPage('login')}
            >
              تسجيل الدخول
            </button>
            <button 
              className="w-full border border-zinc-800 hover:border-brand-orange hover:bg-brand-orange/5 text-white font-bold text-xs py-3 px-4 rounded-xl cursor-pointer transition-all" 
              onClick={() => setCurrentPage('register')}
            >
              حساب جديد
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
