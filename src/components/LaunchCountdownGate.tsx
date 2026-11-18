import React, { useEffect, useState } from 'react';
import { m } from 'framer-motion';
import { Rocket, Tv, Gamepad2, Trophy, Clock, Shield } from 'lucide-react';

// Official launch: Thursday Nov 19, 2026 at 6:00 PM Cairo time (+02:00)
export const OFFICIAL_LAUNCH_TIMESTAMP = new Date('2026-11-19T18:00:00+02:00').getTime();

interface LaunchCountdownGateProps {
  isAdmin?: boolean;
  children: React.ReactNode;
}

function getTimeParts(diffMs: number) {
  const totalSec = Math.max(0, Math.floor(diffMs / 1000));
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;
  return { days, hours, minutes, seconds };
}

const pad = (n: number) => String(n).padStart(2, '0');

export const LaunchCountdownGate: React.FC<LaunchCountdownGateProps> = ({ isAdmin, children }) => {
  const [now, setNow] = useState(() => Date.now());
  const [adminBypass, setAdminBypass] = useState(false);

  const remaining = OFFICIAL_LAUNCH_TIMESTAMP - now;
  const isLocked = remaining > 0 && !(isAdmin && adminBypass);

  useEffect(() => {
    if (remaining <= 0) return undefined;
    const id = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(id);
  }, [remaining]);

  if (!isLocked) {
    return <>{children}</>;
  }

  const { days, hours, minutes, seconds } = getTimeParts(remaining);

  const boxes = [
    { label: 'ثانية', value: pad(seconds) },
    { label: 'دقيقة', value: pad(minutes) },
    { label: 'ساعة', value: pad(hours) },
    ...(days > 0 ? [{ label: 'يوم', value: pad(days) }] : []),
  ];

  return (
    <div className="min-h-[100dvh] w-full bg-[#050505] text-white flex flex-col items-center justify-center p-5 relative overflow-hidden select-none">
      {/* Ambient background glows */}
      <m.div
        animate={{ scale: [1, 1.15, 1], opacity: [0.35, 0.55, 0.35] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -top-32 left-1/2 -translate-x-1/2 w-[540px] h-[540px] rounded-full bg-gradient-radial from-brand-orange/25 via-brand-amber/10 to-transparent blur-3xl pointer-events-none"
      />
      <div className="absolute -bottom-40 end-0 w-96 h-96 rounded-full bg-brand-amber/10 blur-3xl pointer-events-none" />

      <m.div
        initial={{ opacity: 0, y: 18, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-lg rounded-3xl border border-brand-orange/30 bg-zinc-950/90 backdrop-blur-xl p-6 md:p-9 text-center space-y-6 shadow-[0_0_60px_rgba(255,106,0,0.12)]"
      >
        {/* Top Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-orange/15 border border-brand-orange/35 text-brand-orange text-xs font-black">
          <Rocket className="w-4 h-4" />
          <span>العد التنازلي للافتتاح الرسمي</span>
        </div>

        {/* Title & Subtitle */}
        <div className="space-y-2.5">
          <h1 className="text-2xl md:text-3xl font-black text-white leading-snug">
            المنافسة الحقيقية بتبدأ{' '}
            <span className="bg-gradient-to-r from-brand-orange to-brand-amber bg-clip-text text-transparent">
              قريباً جداً!
            </span>
          </h1>
          <p className="text-xs md:text-sm text-zinc-400 font-semibold leading-relaxed max-w-md mx-auto">
            بنجهز الافتتاح الرسمي يوم <strong className="text-white">الخميس الساعة 6 مساءً</strong> مع نزول أول حلقة جديدة وبداية سباق الـ XP من الصفر!
          </p>
        </div>

        {/* Countdown Digits */}
        <div dir="ltr" className="grid grid-flow-col auto-cols-fr gap-2.5 md:gap-3 pt-1">
          {[...boxes].reverse().map((b) => (
            <div
              key={b.label}
              className="rounded-2xl border border-white/10 bg-zinc-900/80 py-3.5 px-2 flex flex-col items-center justify-center shadow-inner"
            >
              <span className="text-2xl md:text-4xl font-black font-mono tabular-nums bg-gradient-to-b from-white to-zinc-300 bg-clip-text text-transparent">
                {b.value}
              </span>
              <span className="text-[11px] font-bold text-brand-amber mt-1">{b.label}</span>
            </div>
          ))}
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-3 gap-2 pt-2 text-center">
          <div className="rounded-2xl bg-white/[0.03] border border-white/8 p-3 space-y-1">
            <Tv className="w-4 h-4 text-brand-orange mx-auto" />
            <p className="text-[11px] font-black text-zinc-200">أول حلقة + كويز</p>
          </div>
          <div className="rounded-2xl bg-white/[0.03] border border-white/8 p-3 space-y-1">
            <Gamepad2 className="w-4 h-4 text-emerald-400 mx-auto" />
            <p className="text-[11px] font-black text-zinc-200">ألعاب أونلاين</p>
          </div>
          <div className="rounded-2xl bg-white/[0.03] border border-white/8 p-3 space-y-1">
            <Trophy className="w-4 h-4 text-brand-amber mx-auto" />
            <p className="text-[11px] font-black text-zinc-200">سباق الـ XP</p>
          </div>
        </div>

        <div className="flex items-center justify-center gap-1.5 text-2xs font-bold text-zinc-500 pt-1">
          <Clock className="w-3.5 h-3.5 text-brand-orange" />
          <span>التطبيق هيفتح تلقائياً أول ما العداد يخلص</span>
        </div>

        {isAdmin && (
          <button
            type="button"
            onClick={() => setAdminBypass(true)}
            className="inline-flex items-center gap-1.5 text-[11px] font-bold text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer pt-1"
          >
            <Shield className="w-3 h-3" />
            <span>دخول الأدمن للمعاينة</span>
          </button>
        )}
      </m.div>
    </div>
  );
};
