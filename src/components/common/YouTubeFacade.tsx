import React, { useEffect, useState } from 'react';
import { Play, ExternalLink } from 'lucide-react';
import { cld } from '../../utils/image';

interface YouTubeFacadeProps {
  embedUrl: string;
  title: string;
  /** Our own Cloudinary thumbnail; falls back to YouTube's when missing. */
  thumbnail?: string | null;
  /** Seconds to start from; changing it (e.g. tapping a timestamp) starts playback there. */
  start?: number | null;
  /** Immediately mount the YouTube player with autoplay when navigated from a play button. */
  autoPlay?: boolean;
  /** Original YouTube link for direct fallback button */
  rawUrl?: string;
}

const videoIdFrom = (embedUrl: string) => embedUrl.match(/embed\/([\w-]{6,})/)?.[1] ?? null;

/**
 * Shows a poster + play button and only loads YouTube's player after a tap.
 * The iframe starts with autoplay so the first tap plays immediately.
 */
export const YouTubeFacade: React.FC<YouTubeFacadeProps> = ({ embedUrl, title, thumbnail, start = null, autoPlay = false, rawUrl }) => {
  const [active, setActive] = useState(Boolean(autoPlay));
  const [posterFailed, setPosterFailed] = useState(false);
  useEffect(() => { if (start != null || autoPlay) setActive(true); }, [start, autoPlay]);
  const id = videoIdFrom(embedUrl);
  const poster = thumbnail ? cld(thumbnail, { w: 720, h: 405, crop: 'fill' }) : id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : '';
  const src = embedUrl + (embedUrl.includes('?') ? '&' : '?') + 'autoplay=1&rel=0&playsinline=1' + (start ? `&start=${Math.floor(start)}` : '');
  const watchUrl = rawUrl || (id ? `https://www.youtube.com/watch?v=${id}` : null);

  return (
    <div className="space-y-2">
      <div className="relative aspect-video rounded-xl overflow-hidden border border-zinc-900/60 bg-zinc-950">
        {active ? (
          <iframe
            key={start ?? 'play'}
            src={src}
            className="absolute inset-0 w-full h-full border-none"
            allowFullScreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
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
                l.rel = 'preconnect'; l.href = 'https://www.youtube.com'; l.dataset.ytPreconnect = '1';
                document.head.appendChild(l);
              }
            }}
            className="group absolute inset-0 w-full h-full cursor-pointer"
            aria-label={`تشغيل: ${title}`}
          >
            {poster && !posterFailed && <img src={poster} alt="" loading="lazy" decoding="async" onError={() => setPosterFailed(true)} className="absolute inset-0 w-full h-full object-cover" />}
            <span className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors" />
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="w-16 h-16 rounded-full bg-brand-orange text-black flex items-center justify-center shadow-[0_8px_30px_rgba(255,106,0,0.45)] group-active:scale-95 transition-transform">
                <Play className="w-7 h-7 fill-current ms-1" />
              </span>
            </span>
          </button>
        )}
      </div>

      {watchUrl && (
        <div className="flex justify-end px-1">
          <a
            href={watchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-[11px] font-bold text-zinc-400 hover:text-brand-orange transition-colors py-1 px-2 rounded-lg hover:bg-white/5"
          >
            <span>مشاهدة على YouTube</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      )}
    </div>
  );
};
