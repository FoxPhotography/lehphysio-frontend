import React, { useState } from 'react';
import { getFrameImage } from '../utils/helpers';
import { cld } from '../utils/image';

interface UserAvatarProps {
  username: string;
  avatarUrl?: string | null;
  equippedFrame?: string | null;
  size?: number | string; // size in pixels, e.g., 32, 48, 108
  className?: string;
  onClick?: () => void;
  style?: React.CSSProperties;
  /** Above-the-fold avatars (profile header) can opt out of lazy loading. */
  eager?: boolean;
}

const getInitials = (name: string) => {
  if (!name) return '?';
  const clean = name.trim().toUpperCase();
  if (clean.length <= 2) return clean;
  const parts = clean.split(/[\s_-]+/);
  if (parts.length >= 2 && parts[0] && parts[1]) return parts[0][0] + parts[1][0];
  return clean.substring(0, 2);
};

const isValidUrl = (url: string | null | undefined): boolean => {
  if (!url) return false;
  const u = url.trim();
  return u.startsWith('http://') || u.startsWith('https://') || u.startsWith('/') || u.startsWith('data:') || u.includes('.');
};

const UserAvatarImpl: React.FC<UserAvatarProps> = ({
  username,
  avatarUrl,
  equippedFrame,
  size = 32,
  className = '',
  onClick,
  style = {},
  eager = false,
}) => {
  const [imgFailed, setImgFailed] = useState(false);
  const [frameFailed, setFrameFailed] = useState(false);
  const sizePx = typeof size === 'number' ? `${size}px` : size;
  const numericSize = typeof size === 'number' ? size : 64;

  const frameImageUrl = getFrameImage(equippedFrame);
  const showImage = isValidUrl(avatarUrl) && !imgFailed;

  return (
    <div
      {...(onClick
        ? {
            role: 'button',
            tabIndex: 0,
            'aria-label': username,
            onKeyDown: (e: React.KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } },
          }
        : {})}
      className={`relative flex items-center justify-center shrink-0 rounded-full select-none ${className}`}
      onClick={onClick}
      style={{
        width: sizePx,
        height: sizePx,
        cursor: onClick ? 'pointer' : 'default',
        boxShadow: '0 2px 10px rgba(0,0,0,0.4)',
        background: 'var(--color-bg-darker)',
        ...style,
      }}
    >
      <span
        className="w-full h-full rounded-full flex items-center justify-center overflow-hidden font-extrabold text-brand-orange bg-brand-orange/10"
        style={{ fontSize: `${Math.max(11, Math.floor(numericSize * 0.38))}px` }}
      >
        {showImage ? (
          <img
            src={cld(avatarUrl, { w: numericSize, h: numericSize, crop: 'fill' })}
            alt=""
            width={numericSize}
            height={numericSize}
            loading={eager ? 'eager' : 'lazy'}
            decoding="async"
            onError={() => setImgFailed(true)}
            className="w-full h-full object-cover rounded-full"
          />
        ) : (
          <span aria-hidden>{getInitials(username)}</span>
        )}
      </span>

      {/* PNG frame overlay, slightly larger than the avatar so the ring extends beyond the edge */}
      {frameImageUrl && !frameFailed && (
        <img
          onError={() => setFrameFailed(true)}
          src={cld(frameImageUrl, { w: Math.round(numericSize * 1.15) })}
          alt=""
          aria-hidden
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          className="absolute pointer-events-none z-10 select-none"
          style={{ top: '-7.5%', left: '-7.5%', width: '115%', height: '115%', maxWidth: 'none' }}
        />
      )}
    </div>
  );
};

// Not memoized on purpose: frame images resolve from a module-level cache that fills after first render.
export const UserAvatar = UserAvatarImpl;
