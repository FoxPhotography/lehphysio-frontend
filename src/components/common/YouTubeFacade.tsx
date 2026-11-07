import React, { useState } from 'react';
import { Play } from 'lucide-react';
import { cld } from '../../utils/image';

interface YouTubeFacadeProps {
  embedUrl: string;
  title: string;
  /** Our own Cloudinary thumbnail; falls back to YouTube's when missing. */
  thumbnail?: string | null;
}

const videoIdFrom = (embedUrl: string) => embedUrl.match(/embed\/([\w-]{6,})/)?.[1] ?? null;

/**
 * Shows a poster + play button and only loads YouTube's ~1MB player after a tap.
 * The iframe starts with autoplay so the first tap plays immediately.
 */
export const YouTubeFacade: React.FC<YouTubeFacadeProps> = ({ embedUrl, title, thumbnail }) => {
  const [active, setActive] = useState(false);
  const id = videoIdFrom(embedUrl);
  const poster = thumbnail ? cld(thumbnail, { w: 720, h: 405, crop: 'fill' }) : id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : '';
  const src = embedUrl + (embedUrl.includes('?') ? '&' : '?') + 'autoplay=1&rel=0&playsinline=1';

  return (
    <div className="relative aspect-video rounded-xl overflow-hidden border border-zinc-900/60 bg-zinc-950">
      {active ? (
        <iframe
          src={src}
          className="absolute inset-0 w-full h-full border-none"
          allowFullScreen
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          title={title}
        />
      ) : (
        <button
          type="button"
          onClick={() => setActive(true)}
          onPointerEnter={() => {
            // Warm up the connection on hover/touch-start so playback starts faster
            if (!document.querySelector('link[data-yt-preconnect]')) {
              const l = document.createElement('link');
              l.rel = 'preconnect'; l.href = 'https://www.youtube-nocookie.com'; l.dataset.ytPreconnect = '1';
              document.head.appendChild(l);
            }
          }}
          className="group absolute inset-0 w-full h-full cursor-pointer"
          aria-label={`تشغيل: ${title}`}
        >
          {poster && <img src={poster} alt="" loading="lazy" decoding="async" className="absolute inset-0 w-full h-full object-cover" />}
          <span className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors" />
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="w-16 h-16 rounded-full bg-brand-orange text-black flex items-center justify-center shadow-[0_8px_30px_rgba(255,106,0,0.45)] group-active:scale-95 transition-transform">
              <Play className="w-7 h-7 fill-current ms-1" />
            </span>
          </span>
        </button>
      )}
    </div>
  );
};
