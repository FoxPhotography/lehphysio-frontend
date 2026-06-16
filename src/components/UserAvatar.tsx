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

  const isValidUrl = (url: string | null | undefined): boolean => {
    if (!url) return false;
    const cleanUrl = url.trim();
    // Class lists or corrupt text won't start with these typical image URL patterns
    return cleanUrl.startsWith('http://') || 
           cleanUrl.startsWith('https://') || 
           cleanUrl.startsWith('/') || 
           cleanUrl.startsWith('data:') || 
           cleanUrl.includes('.');
  };

  return (
    <div 
      className={`relative flex items-center justify-center shrink-0 rounded-full select-none ${!hasPngFrame ? frameClass : ''} ${className}`}
      onClick={onClick}
      style={{ 
        width: sizePx, 
        height: sizePx, 
        cursor: onClick ? 'pointer' : 'default',
        boxShadow: '0 2px 10px rgba(0,0,0,0.4)',
        background: frameClass ? undefined : 'var(--color-bg-darker)',
        ...style
      }}
    >
      <div 
        className="w-full h-full rounded-full flex items-center justify-center overflow-hidden font-extrabold text-brand-orange bg-brand-orange/10"
        style={{ 
          fontSize: typeof size === 'number' ? `${Math.max(10, Math.floor(size * 0.38))}px` : '12px',
        }}
      >
        {isValidUrl(avatarUrl) ? (
          <img 
            src={avatarUrl!} 
            alt={username} 
            className="w-full h-full object-cover rounded-full" 
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
          className="absolute pointer-events-none z-10 select-none"
          style={{
            top: '-7.5%',
            left: '-7.5%',
            width: '115%',
            height: '115%',
            maxWidth: 'none'
          }}
        />
      )}
    </div>
  );
};
