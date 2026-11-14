import React from 'react';
import { m } from 'framer-motion';

export interface FireGoalBackgroundProps {
  children?: React.ReactNode;
  className?: string;
  loopDelay?: number;
  compact?: boolean;
  /** When true, wraps in full card container (gradient, border, rounded-2xl). When false, renders as inset-0 background overlay. */
  standalone?: boolean;
}

export const FireGoalBackground: React.FC<FireGoalBackgroundProps> = ({
  children,
  className = '',
  loopDelay = 2.5,
  compact = false,
  standalone = true,
}) => {
  // مدة الدورة الكاملة للانيميشن
  const duration = 2.2;

  const content = (
    <>
      {/* خطوط أرضية الملعب الخفيفة في الخلفية */}
      <div className="absolute inset-0 opacity-15 pointer-events-none overflow-hidden">
        <div
          className={`absolute right-0 top-1/2 -translate-y-1/2 ${
            compact ? 'w-24 h-36' : 'w-40 h-56'
          } border-2 border-emerald-400 rounded-l-lg`}
        />
        <div
          className={`absolute right-0 top-1/2 -translate-y-1/2 ${
            compact ? 'w-10 h-20' : 'w-16 h-32'
          } border-2 border-emerald-400 rounded-l-md`}
        />
      </div>

      {/* ================= المرمى والشبكة ================= */}
      <div
        className={`absolute ${
          compact ? 'right-2 w-16 h-24' : 'right-5 w-24 h-36'
        } top-1/2 -translate-y-1/2 pointer-events-none`}
      >
        {/* القوائم والعارضة */}
        <div className="absolute inset-0 border-4 border-l-0 border-white/90 rounded-r-md shadow-[0_0_15px_rgba(255,255,255,0.4)] z-10" />

        {/* شبكة المرمى (SVG تتقطع عند الاصطدام) */}
        <svg
          viewBox="0 0 100 140"
          className="w-full h-full overflow-visible opacity-80"
        >
          {/* الجزء العلوي من الشبكة */}
          <m.g
            animate={{
              y: [0, 0, -8, -4],
              rotate: [0, 0, -6, -3],
              opacity: [1, 1, 0.7, 0.8],
            }}
            transition={{
              duration: duration,
              times: [0, 0.53, 0.65, 1],
              repeat: Infinity,
              repeatDelay: loopDelay,
            }}
          >
            <path
              d="M5 10 H95 M5 25 H95 M5 40 H95 M20 5 V48 M40 5 V48 M60 5 V48 M80 5 V48"
              stroke="rgba(255,255,255,0.45)"
              strokeWidth="1.5"
              strokeDasharray="3 2"
            />
          </m.g>

          {/* منتصف الشبكة (الجزء اللي الكرة بتقطعه وتطيره) */}
          <m.g
            animate={{
              x: [0, 0, 45, 70],
              y: [0, 0, -15, 25],
              scale: [1, 1, 1.3, 0.4],
              opacity: [1, 1, 0.9, 0],
              rotate: [0, 0, 25, 65],
            }}
            transition={{
              duration: duration,
              times: [0, 0.52, 0.7, 0.95],
              repeat: Infinity,
              repeatDelay: loopDelay,
            }}
          >
            <path
              d="M10 55 H90 M10 70 H90 M10 85 H90 M25 50 V90 M50 50 V90 M75 50 V90"
              stroke="#fb923c"
              strokeWidth="2"
              strokeDasharray="4 3"
            />
          </m.g>

          {/* الجزء السفلي من الشبكة */}
          <m.g
            animate={{
              y: [0, 0, 10, 5],
              rotate: [0, 0, 6, 3],
              opacity: [1, 1, 0.7, 0.8],
            }}
            transition={{
              duration: duration,
              times: [0, 0.53, 0.65, 1],
              repeat: Infinity,
              repeatDelay: loopDelay,
            }}
          >
            <path
              d="M5 100 H95 M5 115 H95 M5 130 H95 M20 92 V135 M40 92 V135 M60 92 V135 M80 92 V135"
              stroke="rgba(255,255,255,0.45)"
              strokeWidth="1.5"
              strokeDasharray="3 2"
            />
          </m.g>
        </svg>

        {/* وميض الانفجار الناري لحظة قطع الشبكة */}
        <m.div
          animate={{
            scale: [0, 0, compact ? 1.6 : 2.2, 0],
            opacity: [0, 0, 0.95, 0],
          }}
          transition={{
            duration: duration,
            times: [0, 0.51, 0.58, 0.8],
            repeat: Infinity,
            repeatDelay: loopDelay,
          }}
          style={{
            background: 'radial-gradient(circle, rgba(254, 240, 138, 0.95) 0%, rgba(249, 115, 22, 0.85) 45%, transparent 70%)',
          }}
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ${
            compact ? 'w-14 h-14' : 'w-20 h-20'
          } rounded-full blur-md pointer-events-none`}
        />
      </div>

      {/* ================= الكرة النارية ================= */}
      <m.div
        animate={{
          // حركة الكرة من اليسار لليمين وتخترق المرمى وتكمل بره الكارت
          left: ['-10%', '35%', '78%', '115%'],
          top: ['72%', '42%', '48%', '52%'],
          scale: compact ? [0.7, 0.95, 0.85, 0.65] : [0.9, 1.15, 1.05, 0.85],
          rotate: [0, 360, 900, 1440],
          opacity: [0, 1, 1, 0],
        }}
        transition={{
          duration: duration,
          times: [0, 0.25, 0.53, 0.85],
          ease: 'easeIn',
          repeat: Infinity,
          repeatDelay: loopDelay,
        }}
        className="absolute -translate-y-1/2 pointer-events-none z-20 flex items-center"
      >
        {/* ذيل النار خلف الكرة */}
        <div className="relative flex items-center">
          <div
            className={`${
              compact ? 'w-16 h-5 -mr-4' : 'w-28 h-8 -mr-6'
            } rounded-l-full bg-gradient-to-r from-transparent via-red-600/80 to-orange-400 blur-sm animate-pulse`}
          />
          <div
            className={`${
              compact ? 'w-10 h-3 -mr-3' : 'w-16 h-5 -mr-5'
            } rounded-l-full bg-gradient-to-r from-orange-500 via-amber-300 to-white blur-[2px]`}
          />

          {/* جسم الكرة المشتعلة */}
          <div
            className={`relative ${
              compact ? 'w-6 h-6' : 'w-9 h-9'
            } rounded-full bg-white shadow-[0_0_25px_#f97316,0_0_45px_#ef4444] flex items-center justify-center border-2 border-amber-300`}
          >
            <span className={`${compact ? 'text-sm' : 'text-xl'} leading-none select-none`}>
              ⚽
            </span>
          </div>
        </div>
      </m.div>

      {/* ================= شرار النار المتطاير عند الجول ================= */}
      {[...Array(6)].map((_, i) => (
        <m.div
          key={i}
          animate={{
            x: [0, 0, (i % 2 === 0 ? 1 : -1) * (compact ? 18 + i * 8 : 30 + i * 12)],
            y: [0, 0, (i < 3 ? -1 : 1) * (compact ? 12 + i * 6 : 20 + i * 10)],
            opacity: [0, 0, 1, 0],
            scale: [0, 0, 1.2, 0],
          }}
          transition={{
            duration: duration,
            times: [0, 0.52, 0.65, 0.9],
            repeat: Infinity,
            repeatDelay: loopDelay,
          }}
          className={`absolute ${
            compact ? 'right-8 w-1.5 h-1.5' : 'right-14 w-2 h-2'
          } top-1/2 rounded-full bg-amber-400 shadow-[0_0_8px_#f97316] pointer-events-none`}
        />
      ))}
    </>
  );

  if (!standalone) {
    return (
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit] z-0 ${className}`}
      >
        <m.div
          // هزة خفيفة للكارت بالكامل لحظة اختراق الكرة للشبكة
          animate={{
            x: [0, 0, -5, 5, -3, 3, 0],
            y: [0, 0, 3, -3, 2, -2, 0],
          }}
          transition={{
            duration: duration,
            times: [0, 0.52, 0.55, 0.58, 0.61, 0.64, 0.7],
            repeat: Infinity,
            repeatDelay: loopDelay,
          }}
          className="absolute inset-0"
        >
          {content}
        </m.div>
        {children && <div className="relative z-30">{children}</div>}
      </div>
    );
  }

  return (
    <m.div
      // هزة خفيفة للكارت بالكامل لحظة اختراق الكرة للشبكة
      animate={{
        x: [0, 0, -6, 6, -4, 4, 0],
        y: [0, 0, 4, -4, 2, -2, 0],
      }}
      transition={{
        duration: duration,
        times: [0, 0.52, 0.55, 0.58, 0.61, 0.64, 0.7],
        repeat: Infinity,
        repeatDelay: loopDelay,
      }}
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-900 border border-emerald-500/30 shadow-2xl ${className}`}
    >
      {content}
      {children && <div className="relative z-30 p-6">{children}</div>}
    </m.div>
  );
};

export default FireGoalBackground;
