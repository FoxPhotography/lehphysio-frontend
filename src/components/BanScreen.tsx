import React from 'react';
import { ShieldBan, Clock, LogOut } from 'lucide-react';
import { useCountdown } from '../utils/countdown';

interface BanScreenProps {
  banExpiresAt?: string | null;
  onExpired: () => void;
  onLogout: () => void;
}

export const BanScreen: React.FC<BanScreenProps> = ({ banExpiresAt, onExpired, onLogout }) => {
  const countdown = useCountdown(banExpiresAt, onExpired);
  const isTemporary = Boolean(banExpiresAt);

  return (
    <div className="fixed inset-0 z-[20000] bg-zinc-950/98 backdrop-blur-xl flex items-center justify-center p-4 text-center">
      <div className="w-full max-w-md rounded-3xl border border-red-500/30 bg-gradient-to-b from-red-500/10 via-zinc-950 to-zinc-950 p-6 sm:p-8 shadow-[0_24px_80px_rgba(239,68,68,0.2)] space-y-5">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400">
          <ShieldBan className="w-8 h-8" />
        </div>

        <div className="space-y-1.5">
          <h2 className="text-xl font-black text-white">
            {isTemporary ? 'تم حظر حسابك مؤقتاً 🚫' : 'تم حظر حسابك نهائياً 🚫'}
          </h2>
          <p className="text-xs font-semibold text-zinc-400 leading-relaxed">
            {isTemporary
              ? 'حسابك موقوف حالياً من الإدارة. تقدر ترجع تستخدم التطبيق تلقائياً أول ما الوقت يخلص.'
              : 'تم إيقاف حسابك بشكل دائم من الإدارة لمخالفة القواعد.'}
          </p>
        </div>

        {isTemporary && (
          <div className="rounded-2xl border border-red-500/25 bg-black/50 p-4 space-y-2">
            <div className="flex items-center justify-center gap-1.5 text-2xs font-black text-red-300 uppercase tracking-wider">
              <Clock className="w-3.5 h-3.5" />
              <span>الوقت المتبقي لفك الحظر</span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white font-mono tabular-nums tracking-wider" dir="ltr">
              {countdown.formatted || '00:00:00'}
            </div>
            <p className="text-[11px] font-bold text-zinc-500">
              ينتهي في: {new Date(banExpiresAt!).toLocaleString('ar-EG-u-nu-latn', { dateStyle: 'medium', timeStyle: 'short' })}
            </p>
          </div>
        )}

        <button
          type="button"
          onClick={onLogout}
          className="w-full py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 font-black text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>تسجيل الخروج</span>
        </button>
      </div>
    </div>
  );
};
