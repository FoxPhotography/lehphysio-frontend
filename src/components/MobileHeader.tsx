import React from 'react';

interface MobileHeaderProps {
  setCurrentPage: (page: string) => void;
  user: any;
  getAvatarFrameClass: () => string;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({
  setCurrentPage,
  user,
  getAvatarFrameClass
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
          <div className={`mobile-avatar-ring ${getAvatarFrameClass()}`} onClick={() => setCurrentPage('profile')}>
            <div className="mobile-avatar-inner">
              {user.avatar_url ? (
                <img src={user.avatar_url} alt={user.username} />
              ) : (
                user.username[0].toUpperCase()
              )}
            </div>
          </div>
        ) : (
          <button className="mobile-btn" onClick={() => setCurrentPage('login')}>
            <i className="ti ti-login"></i>
          </button>
        )}
      </div>
    </header>
  );
};
