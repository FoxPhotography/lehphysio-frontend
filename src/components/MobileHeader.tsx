import React, { useRef, useState } from 'react';
import { UserAvatar } from './UserAvatar';
import { Store, LogIn } from 'lucide-react';
import logo from '../assets/logo-wordmark.webp';
import { NotificationBell } from './notifications/NotificationBell';
import { PresenceMenu } from './PresenceMenu';
import { SoundSettingsButton } from './common/SoundSettings';
import { playSound } from '../utils/soundEngine';
import { haptic } from './games/ui/feedback';

interface MobileHeaderProps {
  setCurrentPage: (page: string) => void;
  user: any;
  getAvatarFrameClass: () => string;
}

const iconBtn =
  'w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300 hover:text-white hover:border-brand-orange active:scale-95 transition-all cursor-pointer';

export const MobileHeader: React.FC<MobileHeaderProps> = ({ setCurrentPage, user }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  return (
    <header className="fixed top-0 inset-x-0 z-[100] xl:hidden pt-safe bg-zinc-950/95 border-b border-zinc-900/60">
      <div className="h-16 flex items-center justify-between px-4">
        <button
          type="button"
          className="flex items-center hover:opacity-90 transition-opacity cursor-pointer select-none bg-transparent border-0 p-0"
          style={{ WebkitTouchCallout: 'none', WebkitUserSelect: 'none' }}
          onContextMenu={(e) => e.preventDefault()}
          onClick={() => {
            playSound('nav');
            haptic('tap');
            setCurrentPage('home');
          }}
          aria-label="ليه فيزيو؟ — الرئيسية"
        >
          <img
            src={logo}
            alt="Leh Physio"
            width={148}
            height={30}
            className="h-[30px] w-auto pointer-events-none select-none"
            draggable={false}
            decoding="async"
            fetchPriority="high"
          />
        </button>

        <div className="flex items-center gap-2">
          <SoundSettingsButton />

          <button
            className={iconBtn}
            onClick={() => {
              playSound('nav');
              haptic('tap');
              setCurrentPage('rewards');
            }}
            aria-label="متجر المكافآت"
            title="متجر المكافآت"
          >
            <Store className="w-[18px] h-[18px]" />
          </button>

          {user && <NotificationBell />}

          {user ? (
            <div className="relative" ref={menuRef}>
              <UserAvatar
                username={user.username}
                avatarUrl={user.avatar_url}
                equippedFrame={user.equipped_frame}
                size={36}
                onClick={() => setMenuOpen((prev) => !prev)}
                style={{ cursor: 'pointer' }}
              />
              <PresenceMenu
                open={menuOpen}
                onClose={() => setMenuOpen(false)}
                onOpenProfile={() => {
                  playSound('nav');
                  haptic('tap');
                  setCurrentPage('profile');
                }}
                containerRef={menuRef}
                direction="down"
                alignClass="top-12 end-0 origin-top-end"
              />
            </div>
          ) : (
            <button
              className={iconBtn}
              onClick={() => {
                playSound('nav');
                haptic('tap');
                setCurrentPage('login');
              }}
              aria-label="تسجيل الدخول"
              title="تسجيل الدخول"
            >
              <LogIn className="rtl:-scale-x-100 w-[18px] h-[18px]" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
