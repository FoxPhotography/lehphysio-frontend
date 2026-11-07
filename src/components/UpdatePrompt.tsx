import React, { useEffect, useState } from 'react';
import { RefreshCw, X } from 'lucide-react';

/** Shows a small bar when a new version of the app has been downloaded in the background. */
export const UpdatePrompt: React.FC = () => {
  const [apply, setApply] = useState<null | (() => void)>(null);

  useEffect(() => {
    const onNeedRefresh = (e: Event) => setApply(() => (e as CustomEvent<() => void>).detail);
    window.addEventListener('pwa:need-refresh', onNeedRefresh);
    return () => window.removeEventListener('pwa:need-refresh', onNeedRefresh);
  }, []);

  if (!apply) return null;

  return (
    <div className="fixed top-[calc(4rem+env(safe-area-inset-top,0px)+0.75rem)] xl:top-6 inset-x-0 z-[160] flex justify-center px-4 pointer-events-none">
      <div role="alert" className="pointer-events-auto flex items-center gap-3 w-full max-w-sm bg-zinc-900 border border-brand-orange/30 rounded-2xl px-4 py-3 shadow-2xl">
        <RefreshCw className="w-4 h-4 text-brand-orange shrink-0" />
        <span className="text-sm font-bold text-zinc-100 flex-1">نسخة جديدة من التطبيق جاهزة</span>
        <button onClick={apply} className="text-sm font-black text-black bg-brand-orange rounded-xl px-3 py-1.5 active:scale-95 transition-transform">
          حدّث
        </button>
        <button onClick={() => setApply(null)} aria-label="إغلاق" className="text-zinc-500 hover:text-zinc-300 p-1">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
