import React from 'react';
import { UserAvatar } from './UserAvatar';

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
    <header className="app-mobile-header">
      <a href="#" className="mobile-logo" onClick={(e) => { e.preventDefault(); setCurrentPage('home'); }}>
        Leh <span>Physio?</span>
      </a>
      
      <div className="mobile-header-actions">
        <button className="mobile-btn" onClick={() => setCurrentPage('rewards')} title="Rewards Shop">
          <i className="ti ti-building-store"></i>
        </button>
        
        {user ? (
          <UserAvatar 
            username={user.username} 
            avatarUrl={user.avatar_url} 
            equippedFrame={user.equipped_frame} 
            size={32} 
            onClick={() => setCurrentPage('profile')}
            style={{ cursor: 'pointer' }}
          />
        ) : (
          <button className="mobile-btn" onClick={() => setCurrentPage('login')}>
            <i className="ti ti-login"></i>
          </button>
        )}
      </div>
    </header>
  );
};
