import React from 'react';

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

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-950/90 border border-white/10 ${className}`}
      aria-label={`فاضل ${remaining} من ${max} محاولات XP`}
      title={remaining === 0 ? `استنفدت محاولات اليوم (${max}/${max})` : `فاضل ${remaining} من ${max} محاولات XP`}
    >
      <div className="flex items-center gap-1" aria-hidden="true">
        {Array.from({ length: max }).map((_, idx) => {
          const active = idx < remaining;
          return (
            <span
              key={idx}
              className={`w-2 h-2 rounded-full transition-colors duration-200 ${active ? '' : 'bg-zinc-700'}`}
              style={active ? { backgroundColor: 'rgb(var(--a))' } : undefined}
            />
          );
        })}
      </div>
      <span
        className={`text-[11px] font-black tabular-nums leading-none ${
          remaining === 0 ? 'text-zinc-500' : 'text-zinc-200'
        }`}
        dir="ltr"
      >
        {remaining}/{max}
      </span>
    </div>
  );
};
