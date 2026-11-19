import React, { useEffect, useRef } from 'react';

interface PlasmaEnergyProps {
  /** 'full' for profile/hero cards, 'compact' for leaderboard rows and chat bubbles. */
  variant?: 'full' | 'compact';
  className?: string;
  opacity?: number;
}

interface Orb {
  x: number;
  y: number;
  r: number;
  speedY: number;
  swayAmp: number;
  swayFreq: number;
  phase: number;
  hue: 'violet' | 'magenta' | 'indigo' | 'core';
  alpha: number;
}

const ORB_COLORS: Record<Orb['hue'], [string, string]> = {
  violet: ['rgba(167, 139, 250, 0.9)', 'rgba(109, 40, 217, 0)'],
  magenta: ['rgba(244, 114, 246, 0.95)', 'rgba(217, 70, 239, 0)'],
  indigo: ['rgba(129, 140, 248, 0.85)', 'rgba(79, 70, 229, 0)'],
  core: ['rgba(255, 245, 255, 0.95)', 'rgba(232, 121, 249, 0)'],
};

export const PlasmaEnergy: React.FC<PlasmaEnergyProps> = ({
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
    let startTime = performance.now();

    const orbCount = isFull ? 18 : 7;
    const hues: Orb['hue'][] = ['magenta', 'violet', 'indigo', 'core'];
    const orbs: Orb[] = Array.from({ length: orbCount }, (_, i) => ({
      x: ((i * 37 + 13) % 100) / 100,
      y: ((i * 53 + 7) % 100) / 100,
      r: isFull ? 2.2 + (i % 5) * 1.4 : 1.4 + (i % 3) * 0.9,
      speedY: (isFull ? 0.032 : 0.045) + (i % 4) * 0.011,
      swayAmp: (isFull ? 0.03 : 0.02) + (i % 3) * 0.01,
      swayFreq: 0.9 + (i % 4) * 0.35,
      phase: i * 1.37,
      hue: hues[i % hues.length],
      alpha: 0.45 + (i % 4) * 0.14,
    }));

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

    const drawRibbon = (
      t: number,
      yRatio: number,
      amp: number,
      freq: number,
      speed: number,
      phase: number,
      outerColor: string,
      coreColor: string,
      outerWidth: number,
      coreWidth: number
    ) => {
      const steps = isFull ? 44 : 26;
      const baseY = height * yRatio;

      const buildPath = () => {
        ctx.beginPath();
        for (let i = 0; i <= steps; i++) {
          const u = i / steps;
          const x = u * width;
          const envelope = Math.sin(u * Math.PI);
          const wave1 = Math.sin(u * Math.PI * freq + t * speed + phase);
          const wave2 = Math.cos(u * Math.PI * (freq * 1.65) - t * (speed * 0.72) + phase * 1.4) * 0.45;
          const y = baseY + (wave1 + wave2) * amp * (0.35 + 0.65 * envelope);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
      };

      // Soft wide aura glow
      buildPath();
      ctx.strokeStyle = outerColor;
      ctx.lineWidth = outerWidth;
      ctx.lineCap = 'round';
      ctx.stroke();

      // Luminous plasma core
      buildPath();
      ctx.strokeStyle = coreColor;
      ctx.lineWidth = coreWidth;
      ctx.lineCap = 'round';
      ctx.stroke();
    };

    const renderFrame = (now: number) => {
      const t = (now - startTime) * 0.001;
      ctx.clearRect(0, 0, width, height);

      ctx.save();
      ctx.globalCompositeOperation = 'lighter';

      // 1. Soft breathing nebula clouds
      const cloud1X = width * (0.28 + Math.sin(t * 0.45) * 0.14);
      const cloud1Y = height * (0.35 + Math.cos(t * 0.35) * 0.12);
      const r1 = Math.max(width, height) * (isFull ? 0.55 : 0.45);
      const g1 = ctx.createRadialGradient(cloud1X, cloud1Y, 0, cloud1X, cloud1Y, r1);
      g1.addColorStop(0, isFull ? 'rgba(124, 58, 237, 0.28)' : 'rgba(124, 58, 237, 0.20)');
      g1.addColorStop(0.55, 'rgba(192, 38, 211, 0.10)');
      g1.addColorStop(1, 'rgba(109, 40, 217, 0)');
      ctx.fillStyle = g1;
      ctx.fillRect(0, 0, width, height);

      const cloud2X = width * (0.74 + Math.cos(t * 0.38) * 0.14);
      const cloud2Y = height * (0.65 + Math.sin(t * 0.42) * 0.12);
      const r2 = Math.max(width, height) * (isFull ? 0.5 : 0.4);
      const g2 = ctx.createRadialGradient(cloud2X, cloud2Y, 0, cloud2X, cloud2Y, r2);
      g2.addColorStop(0, isFull ? 'rgba(232, 121, 249, 0.24)' : 'rgba(232, 121, 249, 0.18)');
      g2.addColorStop(0.55, 'rgba(99, 102, 241, 0.09)');
      g2.addColorStop(1, 'rgba(217, 70, 239, 0)');
      ctx.fillStyle = g2;
      ctx.fillRect(0, 0, width, height);

      // 2. Flowing silk plasma ribbons
      if (isFull) {
        drawRibbon(
          t,
          0.32,
          height * 0.13,
          1.7,
          1.05,
          0.0,
          'rgba(139, 92, 246, 0.18)',
          'rgba(196, 181, 253, 0.42)',
          20,
          2.2
        );
        drawRibbon(
          t,
          0.54,
          height * 0.15,
          2.1,
          -1.25,
          1.8,
          'rgba(217, 70, 239, 0.22)',
          'rgba(250, 232, 255, 0.58)',
          24,
          2.6
        );
        drawRibbon(
          t,
          0.74,
          height * 0.11,
          1.5,
          0.9,
          3.4,
          'rgba(99, 102, 241, 0.16)',
          'rgba(240, 171, 252, 0.38)',
          16,
          1.8
        );
      } else {
        drawRibbon(
          t,
          0.42,
          height * 0.22,
          2.0,
          1.35,
          0.4,
          'rgba(168, 85, 247, 0.18)',
          'rgba(245, 208, 254, 0.42)',
          12,
          1.5
        );
        drawRibbon(
          t,
          0.66,
          height * 0.18,
          1.6,
          -1.05,
          2.3,
          'rgba(217, 70, 239, 0.16)',
          'rgba(196, 181, 253, 0.34)',
          10,
          1.2
        );
      }

      // 3. Soft rising plasma bokeh orbs
      for (const orb of orbs) {
        const yNorm = ((orb.y - t * orb.speedY) % 1 + 1) % 1;
        const xNorm = orb.x + Math.sin(t * orb.swayFreq + orb.phase) * orb.swayAmp;
        const px = xNorm * width;
        const py = yNorm * height;
        const edgeFade = Math.min(1, yNorm * 4.5, (1 - yNorm) * 4.5);
        const twinkle = 0.65 + 0.35 * Math.sin(t * 2.4 + orb.phase);
        const finalAlpha = orb.alpha * edgeFade * twinkle;
        if (finalAlpha <= 0.02) continue;

        const haloR = orb.r * 3.4;
        const [cInner, cOuter] = ORB_COLORS[orb.hue];
        const grad = ctx.createRadialGradient(px, py, 0, px, py, haloR);
        grad.addColorStop(0, cInner);
        grad.addColorStop(1, cOuter);

        ctx.globalAlpha = finalAlpha;
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(px, py, haloR, 0, Math.PI * 2);
        ctx.fill();

        // Crisp glowing pin-core
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = finalAlpha * 0.75;
        ctx.beginPath();
        ctx.arc(px, py, Math.max(0.8, orb.r * 0.42), 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
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

export default PlasmaEnergy;
