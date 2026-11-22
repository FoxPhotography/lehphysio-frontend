import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { LazyMotion } from 'framer-motion'
import './index.css'
import App from './App.jsx'

// Low-end phones: keep the streak / cosmetic colours but drop most looping effects (see streak.css .fx-lite)
try {
  const nav = navigator as any;
  if ((nav.hardwareConcurrency && nav.hardwareConcurrency <= 4) || (nav.deviceMemory && nav.deviceMemory <= 3) || nav.connection?.saveData) {
    document.documentElement.classList.add('fx-lite');
  }
} catch { /* ignore */ }

// Animation features are fetched after first paint; `m.*` components render instantly without them.
const loadMotionFeatures = () => import('./motionFeatures').then((mod) => mod.default)

// Service worker (precache + offline + push). A new version waits until the user taps "update".
if ('serviceWorker' in navigator) {
  import('virtual:pwa-register').then(({ registerSW }) => {
    const updateSW = registerSW({
      immediate: true,
      onNeedRefresh() {
        const runUpdate = () => updateSW(true);
        (window as any).__pwaUpdateSW = runUpdate;
        window.dispatchEvent(new CustomEvent('pwa:need-refresh', { detail: runUpdate }));
      },
      onRegisteredSW(_url, reg) {
        if (!reg) return;
        setInterval(() => {
          reg.update().catch(() => {});
        }, 30 * 60 * 1000);
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') {
            reg.update().catch(() => {});
          }
        });
      },
    });
  });
}

window.addEventListener('vite:preloadError', (e) => {
  if (sessionStorage.getItem('lp:chunk-reload')) return;
  sessionStorage.setItem('lp:chunk-reload', '1');
  e.preventDefault();
  window.location.reload();
});

setTimeout(() => {
  sessionStorage.removeItem('lp:chunk-reload');
}, 10000);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LazyMotion features={loadMotionFeatures} strict>
      <App />
    </LazyMotion>
  </StrictMode>,
)

// iOS Safari ignores user-scalable=no → block pinch-zoom gestures manually
if (typeof document !== 'undefined') {
  const block = (e: Event) => e.preventDefault();
  document.addEventListener('gesturestart', block, { passive: false } as AddEventListenerOptions);
  document.addEventListener('gesturechange', block, { passive: false } as AddEventListenerOptions);
  document.addEventListener('touchmove', (e: TouchEvent) => {
    if (e.touches.length > 1) e.preventDefault();
  }, { passive: false });
}
