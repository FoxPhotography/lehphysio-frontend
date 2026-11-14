import React, { useEffect, useState } from 'react';
import { DEFAULT_FIT, getCachedFit, measureFrame, type FrameFit } from '../utils/frameFit';
import { getFrameImage } from '../utils/helpers';
import { cld } from '../utils/image';
import CrystalizedBall from './streak/CrystalizedBall';

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
  const isCrystalized =
    equippedFrame === 'crystalized' ||
    equippedFrame === 'crystalized-ball' ||
    frameImageUrl === 'crystalized';

  // Measured once per frame image: how big the frame must be so its hole wraps the photo
  const probeUrl = frameImageUrl && frameImageUrl !== 'crystalized' ? cld(frameImageUrl, { w: 60 }) : '';
  const [fit, setFit] = useState<FrameFit>(() => (probeUrl && getCachedFit(probeUrl)) || DEFAULT_FIT);
  useEffect(() => {
    if (!probeUrl) return undefined;
    const cached = getCachedFit(probeUrl);
    if (cached) { setFit(cached); return undefined; }
    let alive = true;
    measureFrame(probeUrl).then(f => { if (alive) setFit(f); });
    return () => { alive = false; };
  }, [probeUrl]);
  const framePct = fit.scale * 100;
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
            onError={(e) => {
              setImgFailed(true);
              (e.currentTarget as HTMLElement).style.display = 'none';
            }}
            className="w-full h-full object-cover rounded-full"
          />
        ) : (
          <span aria-hidden>{getInitials(username)}</span>
        )}
      </span>

      {/* Crystalized Ball animated WebGL frame (highest XP frame) - tuned to hug the avatar snugly */}
      {isCrystalized && (
        <div
          aria-hidden
          className="absolute pointer-events-none z-10 select-none flex items-center justify-center"
          style={{
            width: `${Math.round(numericSize * 1.35)}px`,
            height: `${Math.round(numericSize * 1.35)}px`,
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        >
          <CrystalizedBall
            preset="ember"
            color="#FF8A2A"
            size={0.78}
            crackle={0.9}
            fill={0.35}
            interactive={numericSize >= 80}
            hoverStrength={0.7}
            strands={5}
            flares={0.8}
            glow={1}
            sparks={0.8}
            particleCount={Math.min(10000, Math.max(1000, numericSize * 35))}
            particleShape="round"
            depth={0.7}
            sway={0.3}
            twinkle={0.7}
            haze={0.9}
            dustSpeed={1.6}
            className="w-full h-full pointer-events-none"
          />
        </div>
      )}

      {/* PNG frame overlay, auto-sized so its inner hole matches the photo (ring wraps it from outside) */}
      {frameImageUrl && frameImageUrl !== 'crystalized' && !frameFailed && (
        <img
          onError={(e) => {
            setFrameFailed(true);
            (e.currentTarget as HTMLElement).style.display = 'none';
          }}
          src={frameImageUrl.startsWith('/') ? frameImageUrl : cld(frameImageUrl, { w: Math.round(numericSize * Math.max(1.15, fit.scale)) })}
          alt=""
          aria-hidden
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          className="absolute pointer-events-none z-10 select-none object-contain"
          style={{
            width: `${framePct}%`,
            height: `${framePct}%`,
            left: `${50 - (0.5 + fit.ox) * framePct}%`,
            top: `${50 - (0.5 + fit.oy) * framePct}%`,
            maxWidth: 'none',
          }}
        />
      )}
    </div>
  );
};

// Not memoized on purpose: frame images resolve from a module-level cache that fills after first render.
export const UserAvatar = UserAvatarImpl;
