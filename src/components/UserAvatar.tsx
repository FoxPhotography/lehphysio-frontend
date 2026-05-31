import React from 'react';
import { getFrameImage } from '../utils/helpers';

interface UserAvatarProps {
  username: string;
  avatarUrl?: string | null;
  equippedFrame?: string | null;
  size?: number | string; // size in pixels, e.g., 32, 48, 108
  className?: string;
  onClick?: () => void;
  style?: React.CSSProperties;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  username,
  avatarUrl,
  equippedFrame,
  size = 32,
  className = '',
  onClick,
  style = {}
}) => {
  const getFrameClass = (frame: string | null | undefined) => {
    if (frame === 'gold-glow') return 'avatar-frame-gold-glow';
    if (frame === 'neon-ring') return 'avatar-frame-neon-ring';
    return '';
  };

  const frameClass = getFrameClass(equippedFrame);
  const sizePx = typeof size === 'number' ? `${size}px` : size;

  // Render initials (1 or 2 characters) as a fallback
  const getInitials = (name: string) => {
    if (!name) return '?';
    const clean = name.trim().toUpperCase();
    if (clean.length <= 2) return clean;
    const parts = clean.split(/[\s_-]+/);
    if (parts.length >= 2 && parts[0] && parts[1]) {
      return parts[0][0] + parts[1][0];
    }
    return clean.substring(0, 2);
  };

  const frameImageUrl = getFrameImage(equippedFrame);
  const hasPngFrame = !!frameImageUrl;

  return (
    <div 
      className={`mobile-avatar-ring ${!hasPngFrame ? frameClass : ''} ${className}`}
      onClick={onClick}
      style={{ 
        width: sizePx, 
        height: sizePx, 
        flexShrink: 0,
        boxShadow: hasPngFrame ? '0 2px 10px rgba(0,0,0,0.4)' : '0 2px 10px rgba(0,0,0,0.4)',
        cursor: onClick ? 'pointer' : 'default',
        borderRadius: '50%',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-secondary)',
        ...style
      }}
    >
      <div 
        className="mobile-avatar-inner" 
        style={{ 
          width: '100%', 
          height: '100%', 
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          fontWeight: 800,
          fontSize: typeof size === 'number' ? `${Math.max(10, Math.floor(size * 0.38))}px` : '12px',
          color: 'var(--orange)',
          background: 'rgba(255, 106, 0, 0.12)'
        }}
      >
        {avatarUrl ? (
          <img 
            src={avatarUrl} 
            alt={username} 
            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} 
          />
        ) : (
          getInitials(username)
        )}
      </div>

      {/* PNG Frame Overlay - slightly larger than avatar so ring extends beyond edges */}
      {hasPngFrame && (
        <img
          src={frameImageUrl}
          alt="Avatar frame"
          className="avatar-frame-overlay"
          style={{
            position: 'absolute',
            top: '-7.5%',
            left: '-7.5%',
            width: '115%',
            height: '115%',
            pointerEvents: 'none',
            zIndex: 2,
            userSelect: 'none'
          }}
        />
      )}
    </div>
  );
};
