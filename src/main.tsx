import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { LazyMotion } from 'framer-motion'
import './index.css'
import App from './App.jsx'

// Animation features are fetched after first paint; `m.*` components render instantly without them.
const loadMotionFeatures = () => import('./motionFeatures').then((mod) => mod.default)

// Register Service Worker for full PWA installability & offline caching
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.log('SW registration note:', err?.message || err);
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
