import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { LazyMotion } from 'framer-motion'
import './index.css'
import App from './App.jsx'

// Animation features are fetched after first paint; `m.*` components render instantly without them.
const loadMotionFeatures = () => import('./motionFeatures').then((mod) => mod.default)

// Service worker (precache + offline + push). A new version waits until the user taps "update".
if ('serviceWorker' in navigator) {
  import('virtual:pwa-register').then(({ registerSW }) => {
    const updateSW = registerSW({
      onNeedRefresh() {
        window.dispatchEvent(new CustomEvent('pwa:need-refresh', { detail: () => updateSW(true) }));
      },
    });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LazyMotion features={loadMotionFeatures} strict>
      <App />
    </LazyMotion>
  </StrictMode>,
)
