import React, { useEffect, useRef, useState } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { Zap, Gift, RotateCw, Sparkles } from 'lucide-react';

export interface SpinResult {
  label: string;
  xp: number;
  tryAgain: boolean;
  isMystery: boolean;
}

interface LuckyWheelProps {
  wheelRotation: number;
  isSpinning: boolean;
  hasSpunToday: boolean;
  onSpin: () => void;
  lastSpinResult?: SpinResult | null;
}

interface WheelSegment {
  label: string;
  subLabel?: string;
  fill: string;
  textFill: string;
  isMystery?: boolean;
  isTryAgain?: boolean;
  isHigh?: boolean;
}

const SEGMENTS: WheelSegment[] = [
  { label: 'MYSTERY', subLabel: '500 XP', fill: 'url(#lw-grad-mystery)', textFill: '#fef08a', isMystery: true },
  { label: '+5', subLabel: 'XP', fill: '#18181b', textFill: '#e4e4e7' },
  { label: '+30', subLabel: 'XP', fill: '#2a170a', textFill: '#ffb000' },
  { label: '+100', subLabel: 'XP', fill: 'url(#lw-grad-orange)', textFill: '#ffffff', isHigh: true },
  { label: 'لفة تاني', subLabel: '🍀', fill: '#0f241c', textFill: '#34d399', isTryAgain: true },
  { label: '+15', subLabel: 'XP', fill: '#23160d', textFill: '#fdba74' },
  { label: '+5', subLabel: 'XP', fill: '#18181b', textFill: '#e4e4e7' },
  { label: '+50', subLabel: 'XP', fill: 'url(#lw-grad-amber)', textFill: '#ffffff', isHigh: true },
  { label: 'لفة تاني', subLabel: '🍀', fill: '#0f241c', textFill: '#34d399', isTryAgain: true },
  { label: '+20', subLabel: 'XP', fill: '#2a170a', textFill: '#ffb000' },
  { label: '+10', subLabel: 'XP', fill: '#202024', textFill: '#f4f4f5' },
  { label: '+5', subLabel: 'XP', fill: '#18181b', textFill: '#e4e4e7' },
];

const LED_COUNT = 24;
const JACKPOT_CONFETTI = Array.from({ length: 24 }, (_, i) => {
  const angle = (i / 24) * Math.PI * 2;
  const dist = 90 + ((i * 29) % 110);
  return {
    id: i,
    x: Math.cos(angle) * dist,
    y: Math.sin(angle) * dist,
    color: i % 3 === 0 ? 'bg-amber-400' : i % 3 === 1 ? 'bg-brand-orange' : 'bg-yellow-200',
    size: 6 + (i % 3) * 3,
  };
});

export const LuckyWheel: React.FC<LuckyWheelProps> = ({
  wheelRotation,
  isSpinning,
  hasSpunToday,
  onSpin,
  lastSpinResult,
}) => {
  const [flapperAngle, setFlapperAngle] = useState(0);
  const prevSegRef = useRef<number>(Math.floor((wheelRotation - 15) / 30));
  const prevRotRef = useRef<number>(wheelRotation);
  const flapperTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Deflect the top flapper whenever a peg crosses 12 o'clock
  useEffect(() => {
    const seg = Math.floor((wheelRotation - 15) / 30);
    const delta = wheelRotation - prevRotRef.current;
    prevRotRef.current = wheelRotation;

    if (seg !== prevSegRef.current && Math.abs(delta) > 0.05) {
      prevSegRef.current = seg;
      const kick = delta > 0 ? -28 : 20;
      setFlapperAngle(kick);
      if (flapperTimeoutRef.current) clearTimeout(flapperTimeoutRef.current);
      flapperTimeoutRef.current = setTimeout(() => setFlapperAngle(0), 75);
    }
  }, [wheelRotation]);

  useEffect(() => {
    return () => {
      if (flapperTimeoutRef.current) clearTimeout(flapperTimeoutRef.current);
    };
  }, []);

  const canSpin = !isSpinning && !hasSpunToday;

  return (
    <div className="flex flex-col items-center space-y-6 py-2">
      {/* Header */}
      <div className="space-y-1.5 text-center">
        <h3 className="text-lg md:text-xl font-black text-white flex items-center justify-center gap-2">
          <Zap className="w-5 h-5 text-brand-orange fill-brand-orange" />
          <span>عجلة الحظ اليومية</span>
        </h3>
        <p className="text-xs text-zinc-400 font-semibold">
          لف العجلة كل يوم واكسب XP — الـ <span className="text-amber-300 font-black">Mystery</span> بتدي 500 XP!
        </p>
      </div>

      {/* Wheel Stage */}
      <div className="relative flex flex-col items-center justify-center">
        {/* Ambient Aura */}
        <div
          className={`absolute -inset-4 rounded-full blur-2xl transition-opacity duration-500 pointer-events-none ${
            isSpinning
              ? 'bg-gradient-radial from-brand-orange/35 via-brand-amber/15 to-transparent opacity-100'
              : 'bg-gradient-radial from-brand-orange/15 via-transparent to-transparent opacity-70'
          }`}
        />

        {/* Spring-loaded Physical Flapper Pointer */}
        <div
          className="absolute -top-4 z-30 flex flex-col items-center pointer-events-none"
          style={{
            transform: `rotate(${flapperAngle}deg)`,
            transformOrigin: '50% 10px',
            transition: 'transform 85ms cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        >
          <svg width="34" height="42" viewBox="0 0 34 42" className="drop-shadow-[0_4px_10px_rgba(255,106,0,0.65)]">
            <defs>
              <linearGradient id="lw-pointer-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ffb000" />
                <stop offset="100%" stopColor="#ff6a00" />
              </linearGradient>
            </defs>
            <path
              d="M17 40 L4 12 C2 6 7 1 17 1 C27 1 32 6 30 12 Z"
              fill="url(#lw-pointer-grad)"
              stroke="#18181b"
              strokeWidth="2.5"
            />
            <circle cx="17" cy="11" r="4" fill="#18181b" />
            <circle cx="17" cy="11" r="2" fill="#fef08a" />
          </svg>
        </div>

        {/* Outer Metallic Bezel + Perimeter LED Bulbs */}
        <div className="relative w-72 h-72 md:w-[340px] md:h-[340px] rounded-full p-3 bg-gradient-to-b from-zinc-800 via-zinc-900 to-black border-2 border-brand-orange/40 shadow-[0_0_45px_rgba(255,106,0,0.22),inset_0_2px_10px_rgba(255,255,255,0.08)] flex items-center justify-center">
          {/* 24 Perimeter LED Bulbs */}
          {Array.from({ length: LED_COUNT }).map((_, i) => {
            const deg = (i * 360) / LED_COUNT;
            const isEven = i % 2 === 0;
            return (
              <span
                key={i}
                style={{
                  transform: `rotate(${deg}deg) translateY(-138px)`,
                }}
                className={`hidden md:block absolute w-2 h-2 rounded-full transition-opacity ${
                  isEven
                    ? 'bg-brand-amber shadow-[0_0_6px_#ffb000]'
                    : 'bg-brand-orange shadow-[0_0_6px_#ff6a00]'
                } ${isSpinning ? (isEven ? 'animate-pulse' : 'opacity-90') : isEven ? 'opacity-85' : 'opacity-35'}`}
              />
            );
          })}
          {Array.from({ length: LED_COUNT }).map((_, i) => {
            const deg = (i * 360) / LED_COUNT;
            const isEven = i % 2 === 0;
            return (
              <span
                key={`sm-${i}`}
                style={{
                  transform: `rotate(${deg}deg) translateY(-138px)`,
                }}
                className={`md:hidden absolute w-1.5 h-1.5 rounded-full ${
                  isEven
                    ? 'bg-brand-amber shadow-[0_0_5px_#ffb000]'
                    : 'bg-brand-orange shadow-[0_0_5px_#ff6a00]'
                } ${isSpinning ? 'animate-pulse' : isEven ? 'opacity-85' : 'opacity-35'}`}
              />
            );
          })}

          {/* Inner Wheel Container */}
          <div className="w-full h-full rounded-full overflow-hidden border-2 border-zinc-800 bg-zinc-950 shadow-[inset_0_0_25px_rgba(0,0,0,0.9)] relative flex items-center justify-center">
            <svg
              className="w-full h-full select-none will-change-transform"
              viewBox="0 0 100 100"
              style={{ transform: `rotate(${wheelRotation}deg)` }}
            >
              <defs>
                <linearGradient id="lw-grad-mystery" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" />
                  <stop offset="50%" stopColor="#d97706" />
                  <stop offset="100%" stopColor="#92400e" />
                </linearGradient>
                <linearGradient id="lw-grad-orange" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#ff6a00" />
                  <stop offset="100%" stopColor="#c2410c" />
                </linearGradient>
                <linearGradient id="lw-grad-amber" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#ea580c" />
                  <stop offset="100%" stopColor="#7c2d12" />
                </linearGradient>
                <radialGradient id="lw-inner-shadow" cx="50%" cy="50%" r="50%">
                  <stop offset="72%" stopColor="rgba(0,0,0,0)" />
                  <stop offset="100%" stopColor="rgba(0,0,0,0.45)" />
                </radialGradient>
              </defs>

              {/* 12 Slices */}
              {SEGMENTS.map((seg, i) => {
                const angle = 255 + i * 30;
                const x1 = 50 + 50 * Math.cos((angle * Math.PI) / 180);
                const y1 = 50 + 50 * Math.sin((angle * Math.PI) / 180);
                const x2 = 50 + 50 * Math.cos(((angle + 30) * Math.PI) / 180);
                const y2 = 50 + 50 * Math.sin(((angle + 30) * Math.PI) / 180);

                return (
                  <path
                    key={i}
                    d={`M50,50 L${x1},${y1} A50,50 0 0,1 ${x2},${y2} Z`}
                    fill={seg.fill}
                    stroke="rgba(255, 176, 0, 0.22)"
                    strokeWidth="0.45"
                  />
                );
              })}

              {/* Depth Vignette */}
              <circle cx="50" cy="50" r="50" fill="url(#lw-inner-shadow)" pointerEvents="none" />

              {/* Slice Labels */}
              {SEGMENTS.map((seg, idx) => {
                const rot = idx * 30;
                return (
                  <g key={idx} transform={`rotate(${rot} 50 50)`}>
                    <text
                      x="50"
                      y={seg.isMystery ? '13.5' : '15'}
                      fill={seg.textFill}
                      className={seg.isMystery ? 'text-[3.8px] font-black tracking-wider' : 'text-[4.6px] font-black'}
                      textAnchor="middle"
                    >
                      {seg.label}
                    </text>
                    {seg.subLabel && (
                      <text
                        x="50"
                        y={seg.isMystery ? '18.5' : '20'}
                        fill={seg.isMystery ? '#ffffff' : 'rgba(255,255,255,0.7)'}
                        className={seg.isMystery ? 'text-[4.2px] font-black' : 'text-[3.2px] font-bold'}
                        textAnchor="middle"
                      >
                        {seg.subLabel}
                      </text>
                    )}
                  </g>
                );
              })}

              {/* 12 Metallic Pegs on Rim Boundaries */}
              {Array.from({ length: 12 }).map((_, i) => {
                const pegAngle = ((255 + i * 30) * Math.PI) / 180;
                const px = 50 + 47.2 * Math.cos(pegAngle);
                const py = 50 + 47.2 * Math.sin(pegAngle);
                return (
                  <g key={`peg-${i}`}>
                    <circle cx={px} cy={py} r="1.45" fill="#18181b" />
                    <circle cx={px} cy={py} r="0.95" fill="#ffb000" />
                  </g>
                );
              })}
            </svg>

            {/* Center Interactive Hub Cap */}
            <button
              type="button"
              onClick={canSpin ? onSpin : undefined}
              disabled={!canSpin}
              aria-label="لف العجلة"
              className={`absolute z-20 w-16 h-16 md:w-20 md:h-20 rounded-full border-4 border-zinc-900 flex flex-col items-center justify-center transition-all shadow-[0_0_20px_rgba(0,0,0,0.8)] ${
                canSpin
                  ? 'bg-gradient-to-br from-brand-amber via-brand-orange to-orange-600 text-black cursor-pointer hover:scale-105 active:scale-95 shadow-[0_0_24px_rgba(255,106,0,0.45)]'
                  : 'bg-zinc-800 text-zinc-400 cursor-not-allowed'
              }`}
            >
              <RotateCw className={`w-5 h-5 md:w-6 md:h-6 ${isSpinning ? 'animate-spin' : ''}`} strokeWidth={2.5} />
              <span className="text-[10px] font-black mt-0.5">{isSpinning ? '...' : 'لف'}</span>
            </button>
          </div>
        </div>

        {/* Jackpot Confetti Burst */}
        <AnimatePresence>
          {lastSpinResult && (lastSpinResult.isMystery || lastSpinResult.xp >= 100) && !isSpinning && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-40">
              {JACKPOT_CONFETTI.map((c) => (
                <m.span
                  key={c.id}
                  initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
                  animate={{ x: c.x, y: c.y, scale: [0, 1.3, 0.8], opacity: [1, 1, 0] }}
                  transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                  style={{ width: c.size, height: c.size }}
                  className={`absolute rounded-full ${c.color}`}
                />
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Result Banner */}
      <AnimatePresence mode="wait">
        {lastSpinResult && !isSpinning && (
          <m.div
            key={lastSpinResult.label}
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6 }}
            className={`w-full max-w-xs rounded-2xl px-4 py-3 border text-center flex items-center justify-center gap-2.5 ${
              lastSpinResult.isMystery
                ? 'bg-gradient-to-r from-amber-500/20 via-yellow-500/15 to-brand-orange/20 border-amber-400/50 text-amber-200 shadow-[0_0_25px_rgba(245,158,11,0.25)]'
                : lastSpinResult.tryAgain
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-brand-orange/10 border-brand-orange/30 text-white'
            }`}
          >
            {lastSpinResult.isMystery ? (
              <Gift className="w-5 h-5 text-amber-300 shrink-0" />
            ) : (
              <Sparkles className="w-4 h-4 text-brand-orange shrink-0" />
            )}
            <span className="text-sm font-black">
              {lastSpinResult.tryAgain
                ? 'لفة مجانية! جرّب تاني دلوقتي 🍀'
                : lastSpinResult.isMystery
                  ? `جاكبوت! فتحت الـ Mystery وكسبت +${lastSpinResult.xp} XP!`
                  : `عاش! كسبت +${lastSpinResult.xp} XP`}
            </span>
          </m.div>
        )}
      </AnimatePresence>

      {/* Main CTA Button */}
      <button
        type="button"
        className="w-full max-w-xs bg-gradient-to-r from-brand-orange to-brand-amber text-black font-extrabold text-sm py-3.5 rounded-xl cursor-pointer hover:shadow-orange-intense active:scale-95 transition-all shadow-orange-glow disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={onSpin}
        disabled={!canSpin}
      >
        {isSpinning ? 'العجلة بتلف…' : hasSpunToday ? 'لفّيت النهارده — ارجع بكرة' : 'لف دلوقتي!'}
      </button>
    </div>
  );
};
