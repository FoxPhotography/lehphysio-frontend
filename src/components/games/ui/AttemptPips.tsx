import React from 'react';
import { Zap } from 'lucide-react';

interface AttemptPipsProps {
  used: number;
  max?: number;
  className?: string;
}

export const AttemptPips: React.FC<AttemptPipsProps> = ({
  used,
  max = 3,
  className = '',
}) => {
  const clampedUsed = Math.max(0, Math.min(max, used));
  const remaining = Math.max(0, max - clampedUsed);

  if (remaining === 0) {
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-900 border border-zinc-700/80 ${className}`}
        aria-label={`استنفدت محاولات الـ XP اليوم (${max}/${max}) — متاح وضع التدريب`}
        title="خلصت محاولات الـ XP النهارده — متاح تدريب عادي بدون XP"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-zinc-500" aria-hidden="true" />
        <span className="text-[10px] font-black text-zinc-300 leading-none">وضع التدريب</span>
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-950/90 border border-white/10 ${className}`}
      aria-label={`فاضل ${remaining} من ${max} محاولات XP`}
      title={`فاضل ${remaining} من ${max} محاولات XP النهارده`}
    >
      <div className="flex items-center gap-1" aria-hidden="true">
        {Array.from({ length: max }).map((_, idx) => {
          const active = idx < remaining;
          return (
            <span
              key={idx}
              className={`w-3.5 h-3.5 rounded-full flex items-center justify-center transition-colors duration-200 ${
                active ? 'text-black' : 'bg-zinc-800 text-zinc-600'
              }`}
              style={active ? { backgroundColor: 'rgb(var(--a))' } : undefined}
            >
              <Zap className="w-2 h-2 fill-current" />
            </span>
          );
        })}
      </div>
      <span className="text-[11px] font-black text-zinc-200 tabular-nums leading-none" dir="ltr">
        {remaining}/{max}
      </span>
    </div>
  );
};
