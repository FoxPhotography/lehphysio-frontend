import React, { useState } from 'react';
import { cld } from '../../utils/image';

interface ThumbProps {
  src?: string | null;
  /** CSS width the image is shown at (used to request the right size). */
  width: number;
  eager?: boolean;
  className?: string;
}

/** Cover image that fills its (relative) parent. Falls back to a branded gradient when there is no image. */
export const Thumb: React.FC<ThumbProps> = ({ src, width, eager = false, className = '' }) => {
  const [failed, setFailed] = useState(false);
  return src && !failed ? (
    <img
      src={cld(src, { w: width, h: Math.round((width * 9) / 16), crop: 'fill' })}
      alt=""
      loading={eager ? 'eager' : 'lazy'}
      fetchPriority={eager ? 'high' : 'auto'}
      decoding="async"
      onError={() => setFailed(true)}
      className={`absolute inset-0 w-full h-full object-cover ${className}`}
    />
  ) : (
    <div aria-hidden className={`absolute inset-0 bg-gradient-to-br from-zinc-900 via-zinc-950 to-brand-orange/20 ${className}`} />
  );
};
