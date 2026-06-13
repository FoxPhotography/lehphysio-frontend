import React from 'react';
import { UserAvatar } from './UserAvatar';
import { Store, LogIn } from 'lucide-react';
import logo from '../assets/LOGO.svg';
import { NotificationBell } from './notifications/NotificationBell';

interface MobileHeaderProps {
  setCurrentPage: (page: string) => void;
  user: any;
  getAvatarFrameClass: () => string;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({
  setCurrentPage,
  user
}) => {
  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-zinc-950/90 border-b border-zinc-900/60 z-[100] flex items-center justify-between px-6 xl:hidden backdrop-blur-md">
      <a 
        href="#" 
        className="flex items-center justify-center hover:opacity-90 transition-opacity" 
        onClick={(e) => { e.preventDefault(); setCurrentPage('home'); }}
        style={{ overflow: 'hidden', height: '48px', width: '180px' }}
      >
        <img 
          src={logo} 
          alt="Leh Physio Logo" 
          style={{ 
            width: '180px', 
            height: '180px', 
            objectFit: 'none',
            objectPosition: 'center center',
            marginTop: '-66px',
            marginBottom: '-66px',
            flexShrink: 0
          }} 
        />
      </a>
      
      <div className="flex items-center gap-3">
        <button 
          className="w-9 h-9 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300 hover:text-white hover:border-brand-orange active:scale-95 transition-all cursor-pointer" 
          onClick={() => setCurrentPage('rewards')} 
          title="Rewards Shop"
        >
          <Store className="w-4 h-4" />
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
          <button 
            className="w-9 h-9 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300 hover:text-white hover:border-brand-orange active:scale-95 transition-all cursor-pointer" 
            onClick={() => setCurrentPage('login')}
            title="Login"
          >
            <LogIn className="w-4 h-4" />
          </button>
        )}
      </div>
    </header>
  );
};
