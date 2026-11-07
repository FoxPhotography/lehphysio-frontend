import React from 'react';
import { UserAvatar } from './UserAvatar';
import { Store, LogIn } from 'lucide-react';
import logo from '../assets/logo-wordmark.webp';
import { NotificationBell } from './notifications/NotificationBell';

interface MobileHeaderProps {
  setCurrentPage: (page: string) => void;
  user: any;
  getAvatarFrameClass: () => string;
}

const iconBtn =
  'w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300 hover:text-white hover:border-brand-orange active:scale-95 transition-all cursor-pointer';

export const MobileHeader: React.FC<MobileHeaderProps> = ({ setCurrentPage, user }) => {
  return (
    <header className="fixed top-0 inset-x-0 z-[100] xl:hidden pt-safe bg-zinc-950/95 border-b border-zinc-900/60">
      <div className="h-16 flex items-center justify-between px-4">
        <a
          href="/"
          className="flex items-center hover:opacity-90 transition-opacity"
          onClick={(e) => { e.preventDefault(); setCurrentPage('home'); }}
          aria-label="ليه فيزيو؟ — الرئيسية"
        >
          <img src={logo} alt="Leh Physio" width={148} height={30} className="h-[30px] w-auto" decoding="async" fetchPriority="high" />
        </a>

        <div className="flex items-center gap-2">
          <button className={iconBtn} onClick={() => setCurrentPage('rewards')} aria-label="متجر المكافآت" title="متجر المكافآت">
            <Store className="w-[18px] h-[18px]" />
          </button>

          {user && <NotificationBell />}

          {user ? (
            <UserAvatar
              username={user.username}
              avatarUrl={user.avatar_url}
              equippedFrame={user.equipped_frame}
              size={36}
              onClick={() => setCurrentPage('profile')}
              style={{ cursor: 'pointer' }}
            />
          ) : (
            <button className={iconBtn} onClick={() => setCurrentPage('login')} aria-label="تسجيل الدخول" title="تسجيل الدخول">
              <LogIn className="rtl:-scale-x-100 w-[18px] h-[18px]" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
