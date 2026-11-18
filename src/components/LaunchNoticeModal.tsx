import React, { useState } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { Rocket, Trophy, Loader2 } from 'lucide-react';
import { apiFetch } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const LaunchNoticeModal: React.FC = () => {
  const { user, token, fetchUserProfile } = useAuth();
  const [acking, setAcking] = useState(false);

  const shouldShow = Boolean(user && user.is_beta_user && !user.has_seen_launch_notice);

  const handleAck = async () => {
    if (!token || acking) return;
    setAcking(true);
    try {
      await apiFetch('/api/users/launch-notice/ack', { method: 'POST' }, token);
      await fetchUserProfile();
    } catch {
      // Ignore transient error
    } finally {
      setAcking(false);
    }
  };

  return (
    <AnimatePresence>
      {shouldShow && (
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9998] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
        >
          <m.div
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 16 }}
            className="w-full max-w-md rounded-3xl border border-brand-orange/35 bg-zinc-950 p-6 text-center space-y-4 shadow-[0_0_50px_rgba(255,106,0,0.2)]"
          >
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-orange/20 to-brand-amber/20 border border-brand-orange/40 flex items-center justify-center mx-auto">
              <Rocket className="w-7 h-7 text-brand-orange" />
            </div>

            <div className="space-y-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-2xs font-black bg-brand-orange/15 text-brand-orange border border-brand-orange/30">
                <Trophy className="w-3 h-3" />
                <span>الافتتاح الرسمي</span>
              </span>
              <h3 className="text-lg font-black text-white">انتهت الفترة التجريبية — المنافسة بدأت!</h3>
              <p className="text-xs text-zinc-300 font-semibold leading-relaxed">
                شكراً لمشاركتك في الفترة التجريبية! تم تصفير كل نقاط الـ XP والستريك والبوستات القديمة عشان الكل يبدأ المنافسة الرسمية من الصفر مع نزول أول حلقة.
              </p>
            </div>

            <button
              type="button"
              onClick={handleAck}
              disabled={acking}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-brand-orange to-brand-amber text-black font-black text-sm flex items-center justify-center gap-2 hover:shadow-orange-glow active:scale-[0.99] transition-all cursor-pointer disabled:opacity-60"
            >
              {acking && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>يلا نبدأ المنافسة!</span>
            </button>
          </m.div>
        </m.div>
      )}
    </AnimatePresence>
  );
};
