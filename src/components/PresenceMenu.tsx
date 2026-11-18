import React, { useEffect, useRef } from 'react';
import { AnimatePresence, m } from 'framer-motion';
import { Check, User as UserIcon } from 'lucide-react';
import { usePresence, type PresenceChoice } from '../context/PresenceContext';

export const STATUS_OPTIONS: { id: PresenceChoice; label: string; sub: string; dot: string }[] = [
  { id: 'online', label: 'أونلاين', sub: 'ظاهر للكل', dot: 'bg-emerald-500' },
  { id: 'dnd', label: 'عدم إزعاج', sub: 'مشغول دلوقتي', dot: 'bg-red-500' },
  { id: 'invisible', label: 'متخفي', sub: 'بتظهر أوفلاين', dot: 'bg-zinc-500' },
];

interface PresenceMenuProps {
  open: boolean;
  onClose: () => void;
  onOpenProfile?: () => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
  /** 'down' drops below avatar (header); 'up' opens above avatar (bottom sidebar). */
  direction?: 'down' | 'up';
  alignClass?: string;
}

export const PresenceMenu: React.FC<PresenceMenuProps> = ({
  open,
  onClose,
  onOpenProfile,
  containerRef,
  direction = 'down',
  alignClass = 'top-12 end-0 origin-top-end',
}) => {
  const { myStatus, setMyStatus } = usePresence();

  useEffect(() => {
    if (!open) return undefined;
    const handleOutside = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('touchstart', handleOutside);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('touchstart', handleOutside);
    };
  }, [open, onClose, containerRef]);

  const yOffset = direction === 'down' ? -12 : 12;

  return (
    <AnimatePresence>
      {open && (
        <m.div
          initial={{ opacity: 0, y: yOffset, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: yOffset, scale: 0.95 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          onClick={(e) => e.stopPropagation()}
          className={`absolute ${alignClass} w-52 rounded-2xl bg-zinc-900/95 backdrop-blur-xl border border-white/10 shadow-2xl p-2 z-[150]`}
        >
          <div className="px-2.5 py-1.5 text-[11px] font-bold text-zinc-500">
            حالتك الآن
          </div>
          <div className="space-y-1">
            {STATUS_OPTIONS.map((opt) => {
              const active = myStatus === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    setMyStatus(opt.id);
                    onClose();
                  }}
                  className={`w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-xl text-start transition-colors cursor-pointer ${
                    active ? 'bg-white/10 text-white' : 'text-zinc-300 hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${opt.dot}`} />
                    <div className="min-w-0">
                      <div className="text-xs font-extrabold leading-tight">{opt.label}</div>
                      <div className="text-[10px] text-zinc-400 leading-tight mt-0.5">{opt.sub}</div>
                    </div>
                  </div>
                  {active && <Check className="w-3.5 h-3.5 text-brand-orange shrink-0" />}
                </button>
              );
            })}
          </div>
          {onOpenProfile && (
            <>
              <div className="my-1.5 border-t border-white/10" />
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenProfile();
                }}
                className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-bold text-zinc-200 hover:bg-white/5 transition-colors cursor-pointer"
              >
                <UserIcon className="w-3.5 h-3.5 text-brand-orange" />
                <span>عرض حسابي</span>
              </button>
            </>
          )}
        </m.div>
      )}
    </AnimatePresence>
  );
};
