import React, { useEffect, useRef } from 'react';

interface ShadowVoidProps {
  variant?: 'full' | 'compact';
  className?: string;
  opacity?: number;
}

interface ShadowWisp {
  x: number;
  y: number;
  r: number;
  speedY: number;
  swayAmp: number;
  swayFreq: number;
  phase: number;
  kind: 'smoke' | 'ember' | 'shard';
  alpha: number;
}

export const ShadowVoid: React.FC<ShadowVoidProps> = ({
  variant = 'full',
  className = 'w-full h-full pointer-events-none',
  opacity = 1,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    const isFull = variant === 'full';
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const dpr = Math.min(window.devicePixelRatio || 1, isFull ? 1.25 : 1);

    let width = 0;
    let height = 0;
    let rafId = 0;
    let visible = true;
    const startTime = performance.now();

    const wispCount = isFull ? 24 : 10;
    const wisps: ShadowWisp[] = Array.from({ length: wispCount }, (_, i) => {
      const kind: ShadowWisp['kind'] = i % 5 === 0 ? 'shard' : i % 3 === 0 ? 'ember' : 'smoke';
      return {
        x: ((i * 41 + 17) % 100) / 100,
        y: ((i * 59 + 11) % 100) / 100,
        r:
          kind === 'smoke'
            ? isFull ? 18 + (i % 5) * 9 : 10 + (i % 3) * 5
            : kind === 'shard'
            ? isFull ? 3.2 + (i % 3) * 1.4 : 2.0 + (i % 2)
            : isFull ? 1.8 + (i % 3) * 1.0 : 1.2 + (i % 2) * 0.7,
        speedY:
          kind === 'smoke'
            ? 0.022 + (i % 4) * 0.008
            : 0.048 + (i % 4) * 0.015,
        swayAmp: (isFull ? 0.045 : 0.028) + (i % 3) * 0.012,
        swayFreq: 0.75 + (i % 4) * 0.35,
        phase: i * 1.61,
        kind,
        alpha: kind === 'smoke' ? 0.42 + (i % 3) * 0.12 : 0.55 + (i % 4) * 0.12,
      };
    });

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = Math.max(1, Math.floor(rect.width));
      height = Math.max(1, Math.floor(rect.height));
      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(resize) : null;
    ro?.observe(canvas);

    const io =
      typeof IntersectionObserver !== 'undefined'
        ? new IntersectionObserver(
            (entries) => {
              visible = entries[0]?.isIntersecting ?? true;
            },
            { threshold: 0.01 }
          )
        : null;
    io?.observe(canvas);

    const drawShadowTendril = (
      t: number,
      yRatio: number,
      amp: number,
      freq: number,
      speed: number,
      phase: number,
      darkWidth: number,
      rimColor: string
    ) => {
      const steps = isFull ? 40 : 24;
      const baseY = height * yRatio;

      const trace = () => {
        ctx.beginPath();
        for (let i = 0; i <= steps; i++) {
          const u = i / steps;
          const x = u * width;
          const env = Math.sin(u * Math.PI);
          const w1 = Math.sin(u * Math.PI * freq + t * speed + phase);
          const w2 = Math.cos(u * Math.PI * (freq * 1.8) - t * (speed * 0.65) + phase * 1.3) * 0.45;
          const y = baseY + (w1 + w2) * amp * (0.3 + 0.7 * env);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
      };

      // Deep shadow smoke core
      trace();
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.72)';
      ctx.lineWidth = darkWidth;
      ctx.lineCap = 'round';
      ctx.stroke();

      // Razor silver-eclipse edge
      trace();
      ctx.strokeStyle = rimColor;
      ctx.lineWidth = isFull ? 1.6 : 1.1;
      ctx.lineCap = 'round';
      ctx.stroke();
    };

    const renderFrame = (now: number) => {
      const t = (now - startTime) * 0.001;
      ctx.clearRect(0, 0, width, height);

      // 1. Subtle obsidian shadow tint (keeps underlying CSS background & text crisp)
      if (isFull) {
        const bg = ctx.createLinearGradient(0, 0, width, height);
        bg.addColorStop(0, 'rgba(3, 3, 5, 0.45)');
        bg.addColorStop(0.5, 'rgba(12, 12, 16, 0.3)');
        bg.addColorStop(1, 'rgba(2, 2, 4, 0.5)');
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, width, height);
      }

      // 2. Haunting lunar/eclipse silver mist drifting behind the shadows
      const ex = width * (0.5 + Math.sin(t * 0.32) * 0.22);
      const ey = height * (0.45 + Math.cos(t * 0.27) * 0.14);
      const er = Math.max(width, height) * (isFull ? 0.48 : 0.38);
      const eclipse = ctx.createRadialGradient(ex, ey, er * 0.08, ex, ey, er);
      eclipse.addColorStop(0, 'rgba(0, 0, 0, 0.95)');
      eclipse.addColorStop(0.32, isFull ? 'rgba(228, 228, 231, 0.16)' : 'rgba(228, 228, 231, 0.12)');
      eclipse.addColorStop(0.55, 'rgba(113, 113, 122, 0.08)');
      eclipse.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = eclipse;
      ctx.fillRect(0, 0, width, height);

      // 3. Swirling shadow tendrils
      if (isFull) {
        drawShadowTendril(t, 0.28, height * 0.12, 1.8, 0.85, 0.2, 28, 'rgba(212, 212, 216, 0.26)');
        drawShadowTendril(t, 0.56, height * 0.14, 2.2, -1.05, 2.0, 34, 'rgba(244, 244, 245, 0.34)');
        drawShadowTendril(t, 0.78, height * 0.1, 1.5, 0.72, 4.1, 24, 'rgba(161, 161, 170, 0.22)');
      } else {
        drawShadowTendril(t, 0.44, height * 0.22, 2.0, 1.1, 0.6, 16, 'rgba(228, 228, 231, 0.28)');
        drawShadowTendril(t, 0.68, height * 0.18, 1.7, -0.9, 2.5, 14, 'rgba(161, 161, 170, 0.22)');
      }

      // 4. Rising shadow smoke clouds & silver-white obsidian ash embers
      for (const w of wisps) {
        const yNorm = ((w.y - t * w.speedY) % 1 + 1) % 1;
        const xNorm = w.x + Math.sin(t * w.swayFreq + w.phase) * w.swayAmp;
        const px = xNorm * width;
        const py = yNorm * height;
        const edgeFade = Math.min(1, yNorm * 4, (1 - yNorm) * 4);
        const pulse = 0.7 + 0.3 * Math.sin(t * 2.1 + w.phase);
        const a = w.alpha * edgeFade * pulse;
        if (a <= 0.02) continue;

        ctx.save();
        ctx.globalAlpha = a;

        if (w.kind === 'smoke') {
          const g = ctx.createRadialGradient(px, py, 0, px, py, w.r);
          g.addColorStop(0, 'rgba(0, 0, 0, 0.85)');
          g.addColorStop(0.6, 'rgba(39, 39, 42, 0.32)');
          g.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(px, py, w.r, 0, Math.PI * 2);
          ctx.fill();
        } else if (w.kind === 'shard') {
          // Sharp dark diamond with glowing silver rim
          ctx.translate(px, py);
          ctx.rotate(t * 0.9 + w.phase);
          ctx.beginPath();
          ctx.moveTo(0, -w.r * 1.5);
          ctx.lineTo(w.r * 0.85, 0);
          ctx.lineTo(0, w.r * 1.5);
          ctx.lineTo(-w.r * 0.85, 0);
          ctx.closePath();
          ctx.fillStyle = '#09090b';
          ctx.fill();
          ctx.strokeStyle = 'rgba(244, 244, 245, 0.75)';
          ctx.lineWidth = 1;
          ctx.stroke();
        } else {
          // Glowing silver-smoke ash ember
          const halo = w.r * 3.2;
          const g = ctx.createRadialGradient(px, py, 0, px, py, halo);
          g.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
          g.addColorStop(0.4, 'rgba(161, 161, 170, 0.45)');
          g.addColorStop(1, 'rgba(24, 24, 27, 0)');
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(px, py, halo, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }
    };

    const tick = (now: number) => {
      if (visible && document.visibilityState !== 'hidden') {
        renderFrame(now);
      }
      if (!reducedMotion) {
        rafId = requestAnimationFrame(tick);
      }
    };

    renderFrame(startTime);
    if (!reducedMotion) {
      rafId = requestAnimationFrame(tick);
    }

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      ro?.disconnect();
      io?.disconnect();
    };
  }, [variant]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={className}
      style={{ opacity, display: 'block' }}
    />
  );
};

export default ShadowVoid;
