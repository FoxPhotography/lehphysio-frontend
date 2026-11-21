import React, { useEffect, useMemo, useRef, useState } from 'react';
import { m } from 'framer-motion';
import { Play, Pause } from 'lucide-react';
import { API_BASE } from '../../services/api';

interface VoiceNotePlayerProps {
  src: string;
  durationHint?: number;
  isMine?: boolean;
  fancyBubble?: boolean;
}

const WAVE_BAR_COUNT = 26;

function resolveMediaUrl(raw: string): string {
  if (!raw) return '';
  if (raw.startsWith('http://') || raw.startsWith('https://') || raw.startsWith('blob:')) return raw;
  return `${API_BASE}${raw.startsWith('/') ? '' : '/'}${raw}`;
}

export const VoiceNotePlayer: React.FC<VoiceNotePlayerProps> = ({
  src,
  durationHint = 0,
  isMine = false,
  fancyBubble = false,
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(durationHint || 0);
  const [speed, setSpeed] = useState<1 | 1.5 | 2>(1);

  const heights = useMemo(() => {
    let seed = 7;
    for (let i = 0; i < src.length; i++) seed = (seed * 31 + src.charCodeAt(i)) % 997;
    return Array.from({ length: WAVE_BAR_COUNT }, (_, idx) => {
      const val = ((seed * (idx + 3) * 17) % 65) + 25;
      return val;
    });
  }, [src]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return undefined;

    const onLoaded = () => {
      if (Number.isFinite(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration);
      }
    };
    const onTime = () => setCurrentTime(audio.currentTime || 0);
    const onEnded = () => {
      setPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('loadedmetadata', onLoaded);
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('ended', onEnded);
    return () => {
      audio.removeEventListener('loadedmetadata', onLoaded);
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('ended', onEnded);
    };
  }, []);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      audio.playbackRate = speed;
      audio.play().then(() => setPlaying(true)).catch(() => {});
    }
  };

  const cycleSpeed = (e: React.MouseEvent) => {
    e.stopPropagation();
    const next: 1 | 1.5 | 2 = speed === 1 ? 1.5 : speed === 1.5 ? 2 : 1;
    setSpeed(next);
    if (audioRef.current) audioRef.current.playbackRate = next;
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    audio.currentTime = ratio * duration;
    setCurrentTime(audio.currentTime);
  };

  const progress = duration > 0 ? Math.min(1, currentTime / duration) : 0;
  const displaySec = Math.round(playing || currentTime > 0 ? currentTime : duration);
  const mins = Math.floor(displaySec / 60);
  const secs = displaySec % 60;
  const timeText = `${mins}:${secs < 10 ? '0' : ''}${secs}`;

  const darkOnLight = isMine && !fancyBubble;

  return (
    <div
      className="flex items-center gap-2.5 py-1 min-w-[210px] sm:min-w-[240px] max-w-full"
      onClick={(e) => e.stopPropagation()}
    >
      <audio ref={audioRef} src={resolveMediaUrl(src)} preload="metadata" />

      <m.button
        type="button"
        whileTap={{ scale: 0.88 }}
        onClick={togglePlay}
        className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 cursor-pointer transition-colors ${
          darkOnLight
            ? 'bg-black/15 hover:bg-black/25 text-black'
            : 'bg-brand-orange/20 hover:bg-brand-orange/30 text-brand-orange border border-brand-orange/35'
        }`}
        aria-label={playing ? 'إيقاف' : 'تشغيل'}
      >
        {playing ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current translate-x-0.5" />}
      </m.button>

      <div className="flex-1 flex flex-col gap-1 min-w-0">
        <div
          role="slider"
          aria-label="شريط تشغيل الصوت"
          aria-valuemin={0}
          aria-valuemax={Math.round(duration)}
          aria-valuenow={Math.round(currentTime)}
          tabIndex={0}
          onClick={handleSeek}
          className="flex items-center gap-[2px] h-6 cursor-pointer"
          dir="ltr"
        >
          {heights.map((h, i) => {
            const active = i / WAVE_BAR_COUNT <= progress;
            return (
              <span
                key={i}
                className={`flex-1 rounded-full transition-colors duration-150 ${
                  active
                    ? darkOnLight ? 'bg-black' : 'bg-brand-orange'
                    : darkOnLight ? 'bg-black/25' : 'bg-white/25'
                }`}
                style={{ height: `${h}%`, minHeight: 4 }}
              />
            );
          })}
        </div>
        <div className="flex items-center justify-between text-[10px] font-bold opacity-80 tabular-nums" dir="ltr">
          <span>{timeText}</span>
          <button
            type="button"
            onClick={cycleSpeed}
            className={`px-1.5 py-0.5 rounded-md font-black cursor-pointer transition-colors ${
              darkOnLight ? 'bg-black/10 hover:bg-black/20 text-black' : 'bg-white/10 hover:bg-white/20 text-zinc-200'
            }`}
          >
            {speed}x
          </button>
        </div>
      </div>
    </div>
  );
};
