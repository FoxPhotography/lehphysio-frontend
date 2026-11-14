/**
 * Frames are PNG rings with a transparent hole, but every design leaves a
 * different amount of padding/ornaments around that hole. We measure the hole
 * once per frame image and scale the frame so the hole matches the avatar —
 * the ring then always wraps the photo from outside instead of sitting on it.
 */
export interface FrameFit { scale: number; ox: number; oy: number }

export const DEFAULT_FIT: FrameFit = { scale: 1.15, ox: 0, oy: 0 };
const KEY = 'frame_fit_v4';
const cache = new Map<string, FrameFit>();
const pending = new Map<string, Promise<FrameFit>>();

try {
  const saved = JSON.parse(localStorage.getItem(KEY) || '{}');
  for (const k of Object.keys(saved)) cache.set(k, saved[k]);
} catch { /* ignore */ }

const persist = () => {
  try { localStorage.setItem(KEY, JSON.stringify(Object.fromEntries(cache))); } catch { /* ignore */ }
};

export const getCachedFit = (url: string): FrameFit | null => cache.get(url) || null;

function analyse(img: HTMLImageElement): FrameFit {
  const S = 120;
  const canvas = document.createElement('canvas');
  canvas.width = S; canvas.height = S;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return DEFAULT_FIT;
  ctx.drawImage(img, 0, 0, S, S);
  const data = ctx.getImageData(0, 0, S, S).data;
  const solid = (x: number, y: number) => {
    const xi = Math.round(x), yi = Math.round(y);
    if (xi < 0 || yi < 0 || xi >= S || yi >= S) return true;
    return data[(yi * S + xi) * 4 + 3] > 60;
  };
  // Distance from (cx,cy) to the first opaque pixel along an angle
  const ray = (cx: number, cy: number, a: number) => {
    const dx = Math.cos(a), dy = Math.sin(a);
    for (let r = 0; r < S; r += 0.5) if (solid(cx + dx * r, cy + dy * r)) return r;
    return S;
  };
  let cx = S / 2, cy = S / 2;
  if (solid(cx, cy)) return { scale: 1.12, ox: 0, oy: 0 }; // no hole in the middle → keep the classic size
  // Find the hole's real centre (some frames are drawn off-centre, e.g. ears on top)
  for (let i = 0; i < 3; i++) {
    const l = ray(cx, cy, Math.PI), r = ray(cx, cy, 0), u = ray(cx, cy, -Math.PI / 2), d = ray(cx, cy, Math.PI / 2);
    cx += (r - l) / 2; cy += (d - u) / 2;
  }
  const dists: number[] = [];
  for (let i = 0; i < 24; i++) dists.push(ray(cx, cy, (i / 24) * Math.PI * 2));
  dists.sort((a, b) => a - b);
  // 40th percentile: frame snugly wraps the circular rim of the photo without leaving an empty void
  const radius = dists[Math.floor(dists.length * 0.4)];
  const ratio = (radius * 2) / S; // hole diameter as a fraction of the frame width
  if (!(ratio > 0.2)) return DEFAULT_FIT;
  const scale = Math.min(1.5, Math.max(1.06, 0.98 / ratio));
  return { scale, ox: (cx - S / 2) / S, oy: (cy - S / 2) / S };
}

export function measureFrame(url: string): Promise<FrameFit> {
  const hit = cache.get(url);
  if (hit) return Promise.resolve(hit);
  const running = pending.get(url);
  if (running) return running;
  const p = new Promise<FrameFit>((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.decoding = 'async';
    img.onload = () => {
      let fit = DEFAULT_FIT;
      let ok = true;
      try { fit = analyse(img); } catch { ok = false; }
      if (ok) { cache.set(url, fit); persist(); }
      resolve(fit);
    };
    img.onerror = () => resolve(DEFAULT_FIT);
    img.src = url;
  }).finally(() => pending.delete(url));
  pending.set(url, p);
  return p;
}
