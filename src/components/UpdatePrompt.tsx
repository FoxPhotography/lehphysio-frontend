import React, { useEffect, useRef, useState } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { RefreshCw, Loader2 } from 'lucide-react';

const SNOOZE_KEY = 'lp:update-snooze';
const SNOOZE_MS = 30 * 60 * 1000;

/** Shows a native-feeling bar when a new version of the app has been downloaded in the background. */
export const UpdatePrompt: React.FC = () => {
  const updateFnRef = useRef<null | (() => void | Promise<void>)>(null);
  const [hasUpdate, setHasUpdate] = useState(false);
  const [visible, setVisible] = useState(false);
  const [updating, setUpdating] = useState(false);
  const snoozeTimerRef = useRef<number | null>(null);
  const reloadFallbackRef = useRef<number | null>(null);

  const canShowNow = () => {
    if (document.documentElement.dataset.gameActive === '1') return false;
    try {
      const snoozedAt = Number(sessionStorage.getItem(SNOOZE_KEY) || '0');
      if (snoozedAt && Date.now() - snoozedAt < SNOOZE_MS) return false;
    } catch {
      // ignore storage errors
    }
    return true;
  };

  useEffect(() => {
    const registerUpdate = (fn: () => void | Promise<void>) => {
      updateFnRef.current = fn;
      setHasUpdate(true);
      if (canShowNow()) {
        setVisible(true);
      }
    };

    const existing = (window as any).__pwaUpdateSW;
    if (typeof existing === 'function') {
      registerUpdate(existing);
    }

    const onNeedRefresh = (e: Event) => {
      const fn = (e as CustomEvent<() => void | Promise<void>>).detail;
      if (typeof fn !== 'function') return;
      registerUpdate(fn);
    };

    const onGameActiveChange = () => {
      if (updateFnRef.current && canShowNow()) {
        setVisible(true);
      }
    };

    window.addEventListener('pwa:need-refresh', onNeedRefresh);
    window.addEventListener('lp:game-active-change', onGameActiveChange);
    return () => {
      window.removeEventListener('pwa:need-refresh', onNeedRefresh);
      window.removeEventListener('lp:game-active-change', onGameActiveChange);
      if (snoozeTimerRef.current) clearTimeout(snoozeTimerRef.current);
      if (reloadFallbackRef.current) clearTimeout(reloadFallbackRef.current);
    };
  }, []);

  const handleUpdateNow = async () => {
    if (!updateFnRef.current || updating) return;
    setUpdating(true);
    try {
      sessionStorage.removeItem(SNOOZE_KEY);
    } catch {
      // ignore storage errors
    }
    (window as any).__pwaUpdateSW = null;

    let reloaded = false;
    const doReload = () => {
      if (reloaded) return;
      reloaded = true;
      if (reloadFallbackRef.current) {
        clearTimeout(reloadFallbackRef.current);
        reloadFallbackRef.current = null;
      }
      window.location.reload();
    };

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', doReload, { once: true });
      navigator.serviceWorker
        .getRegistration()
        .then((reg) => {
          reg?.waiting?.postMessage({ type: 'SKIP_WAITING' });
        })
        .catch(() => {});
    }
    reloadFallbackRef.current = window.setTimeout(doReload, 2500);

    try {
      await updateFnRef.current();
    } catch {
      doReload();
    }
  };

  const handleLater = () => {
    setVisible(false);
    try {
      sessionStorage.setItem(SNOOZE_KEY, String(Date.now()));
    } catch {
      // ignore storage errors
    }
    if (snoozeTimerRef.current) clearTimeout(snoozeTimerRef.current);
    snoozeTimerRef.current = window.setTimeout(() => {
      if (document.documentElement.dataset.gameActive !== '1') {
        setVisible(true);
      }
    }, SNOOZE_MS);
  };

  return (
    <AnimatePresence>
      {hasUpdate && visible && (
        <div className="fixed inset-x-0 bottom-[calc(76px+env(safe-area-inset-bottom,0px))] xl:bottom-6 z-[160] flex justify-center px-4 pointer-events-none">
          <m.div
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 24, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
            role="alertdialog"
            aria-live="polite"
            aria-label="تحديث التطبيق"
            className="pointer-events-auto w-full max-w-sm rounded-2xl bg-[#111113] border border-brand-orange/35 p-4 shadow-2xl space-y-3 text-start"
          >
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-brand-orange/15 border border-brand-orange/30 flex items-center justify-center shrink-0 text-brand-orange">
                <RefreshCw className={`w-4.5 h-4.5 ${updating ? 'animate-spin' : ''}`} />
              </div>
              <div className="space-y-0.5 min-w-0 flex-1">
                <h4 className="text-sm font-black text-white leading-snug">🚀 تحديث جديد من ليه فيزيو!</h4>
                <p className="text-xs font-semibold text-zinc-400 leading-relaxed">
                  في تجربة جديدة مستنياك!
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleUpdateNow}
                disabled={updating}
                className="flex-1 min-h-[42px] px-3 py-2 rounded-xl bg-gradient-to-r from-brand-orange to-brand-amber text-black font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-transform disabled:opacity-70"
              >
                {updating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{updating ? 'جاري التحديث…' : 'تحديث الآن'}</span>
              </button>
              <button
                type="button"
                onClick={handleLater}
                disabled={updating}
                className="min-h-[42px] px-3.5 py-2 rounded-xl bg-zinc-900 border border-white/10 hover:border-white/20 text-zinc-300 font-bold text-xs cursor-pointer active:scale-95 transition-transform"
              >
                لاحقاً
              </button>
            </div>
          </m.div>
        </div>
      )}
    </AnimatePresence>
  );
};
