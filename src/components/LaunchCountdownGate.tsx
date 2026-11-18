import React, { useEffect, useRef, useState } from 'react';
import { m } from 'framer-motion';
import { Rocket, Tv, Gamepad2, Trophy, Clock, Shield, Loader2, CheckCircle, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { authService } from '../services/authService';
import { GoogleIcon } from './AuthComponents';

// Official launch: Thursday Nov 19, 2026 at 6:00 PM Cairo time (+02:00)
export const OFFICIAL_LAUNCH_TIMESTAMP = new Date('2026-11-19T18:00:00+02:00').getTime();

interface LaunchCountdownGateProps {
  isStaff?: boolean;
  onLaunchOpened?: () => void;
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

export const LaunchCountdownGate: React.FC<LaunchCountdownGateProps> = ({
  isStaff,
  onLaunchOpened,
  children,
}) => {
  const { user, setToken, setUser, showToast, currentPage } = useAuth();
  const handleLogoutClick = () => {
    localStorage.removeItem('token');
    setToken('');
    setUser(null);
  };
  const socket = useSocket();
  const [now, setNow] = useState(() => Date.now());
  const [backendOpened, setBackendOpened] = useState(false);
  const [showStaffLogin, setShowStaffLogin] = useState(false);
  const [staffUsername, setStaffUsername] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState('');
  const launchTriggeredRef = useRef(false);

  const path = typeof window !== 'undefined' ? window.location.pathname : '';
  const isGoogleFlowRoute =
    path.startsWith('/auth/callback') ||
    path.startsWith('/auth/social-register') ||
    currentPage === 'social-register';

  const remaining = OFFICIAL_LAUNCH_TIMESTAMP - now;
  const isLocked = remaining > 0 && !backendOpened && !isStaff && !isGoogleFlowRoute;

  useEffect(() => {
    if (remaining <= 0) {
      if (!launchTriggeredRef.current) {
        launchTriggeredRef.current = true;
        // Brief delay so backend launch reset completes before refetching user profile
        const t = setTimeout(() => {
          onLaunchOpened?.();
        }, 1500);
        return () => clearTimeout(t);
      }
      return undefined;
    }
    const id = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(id);
  }, [remaining, onLaunchOpened]);

  useEffect(() => {
    if (!socket) return undefined;
    const onOpened = () => {
      setBackendOpened(true);
      onLaunchOpened?.();
    };
    socket.on('official_launch_opened', onOpened);
    return () => {
      socket.off('official_launch_opened', onOpened);
    };
  }, [socket, onLaunchOpened]);

  const handleStaffLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loggingIn) return;
    setLoginError('');
    setLoggingIn(true);
    try {
      const res = await authService.login({ username: staffUsername.trim(), password: staffPassword });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setLoginError(data?.error || 'بيانات الدخول غير صحيحة.');
        return;
      }
      if (data?.token && data?.user) {
        localStorage.setItem('token', data.token);
        setToken(data.token);
        setUser(data.user);
        if (['moderator', 'admin', 'owner'].includes(data.user.role)) {
          showToast('أهلاً بك في وضع معاينة الإدارة 👋');
        } else {
          setLoginError('الحساب ده مش إداري — استنى معاد الافتتاح الرسمي.');
        }
      }
    } catch {
      setLoginError('مشكلة في الاتصال.');
    } finally {
      setLoggingIn(false);
    }
  };

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

        {/* Google / Gmail Pre-Registration */}
        <div className="pt-1">
          {user ? (
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 flex items-center justify-between gap-3 text-start">
              <div className="flex items-center gap-2.5 min-w-0">
                <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-black text-emerald-300 truncate">
                    حسابك جاهز للافتتاح (<bdi dir="ltr">@{user.username}</bdi>)
                  </p>
                  <p className="text-2xs text-emerald-400/80 font-semibold">
                    أول ما العداد يخلص هتدخل المنافسة علطول!
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleLogoutClick}
                title="تسجيل الخروج"
                className="p-2 rounded-xl bg-white/5 hover:bg-red-500/15 text-zinc-400 hover:text-red-400 transition-colors cursor-pointer shrink-0"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                window.location.href = authService.getGoogleAuthUrl();
              }}
              className="w-full py-3.5 px-4 rounded-2xl bg-white hover:bg-zinc-100 text-black font-black text-xs md:text-sm flex items-center justify-center gap-2.5 shadow-lg active:scale-[0.99] transition-all cursor-pointer"
            >
              <GoogleIcon className="w-5 h-5 shrink-0" />
              <span>سجّل حسابك بـ Google من دلوقتي</span>
            </button>
          )}
        </div>

        {/* Staff / Admin Access */}
        <div className="pt-1">
          {!showStaffLogin ? (
            <button
              type="button"
              onClick={() => setShowStaffLogin(true)}
              className="inline-flex items-center gap-1.5 text-[11px] font-bold text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
            >
              <Shield className="w-3 h-3" />
              <span>دخول الإدارة / الستاف</span>
            </button>
          ) : (
            <form onSubmit={handleStaffLogin} className="mt-2 p-3.5 rounded-2xl bg-zinc-900/70 border border-white/10 space-y-2.5 text-start">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-zinc-300">تسجيل دخول الإدارة</span>
                <button
                  type="button"
                  onClick={() => setShowStaffLogin(false)}
                  className="text-2xs text-zinc-500 hover:text-white cursor-pointer"
                >
                  إغلاق
                </button>
              </div>
              <input
                type="text"
                dir="ltr"
                value={staffUsername}
                onChange={(e) => setStaffUsername(e.target.value)}
                placeholder="اسم المستخدم"
                className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-white/10 text-xs text-white outline-none focus:border-brand-orange/60"
              />
              <input
                type="password"
                dir="ltr"
                value={staffPassword}
                onChange={(e) => setStaffPassword(e.target.value)}
                placeholder="كلمة المرور"
                className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-white/10 text-xs text-white outline-none focus:border-brand-orange/60"
              />
              {loginError && <p className="text-2xs font-bold text-red-400">{loginError}</p>}
              <button
                type="submit"
                disabled={loggingIn}
                className="w-full py-2 rounded-xl bg-brand-orange text-black font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
              >
                {loggingIn && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>دخول</span>
              </button>
            </form>
          )}
        </div>
      </m.div>
    </div>
  );
};
