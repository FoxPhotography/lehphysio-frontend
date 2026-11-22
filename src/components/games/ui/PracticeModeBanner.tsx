import React from 'react';
import { Mascot, type MascotCharacter } from './Mascot';

interface PracticeModeBannerProps {
  character?: MascotCharacter;
  className?: string;
}

export const PracticeModeBanner: React.FC<PracticeModeBannerProps> = ({
  character = 'doctor',
  className = '',
}) => {
  return (
    <div
      className={`rounded-2xl bg-amber-500/10 border border-amber-500/30 p-3.5 flex items-center gap-3 text-start ${className}`}
      role="status"
    >
      <Mascot character={character} mood="encouraging" size={44} />
      <div className="flex-1 min-w-0 space-y-0.5">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-xs font-black text-amber-300">خلصت محاولات الـ XP!</p>
          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-zinc-900 border border-white/10 text-zinc-300">
            وضع التدريب · بدون XP
          </span>
        </div>
        <p className="text-[11px] font-semibold text-zinc-300 leading-relaxed">
          كمّل تدريب عادي واكتسب خبرة لحد ما محاولاتك تتجدد.
        </p>
      </div>
    </div>
  );
};
