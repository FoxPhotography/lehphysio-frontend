import React, { useEffect, useRef, useState } from 'react';

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  className?: string;
}

export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
  value,
  duration = 700,
  className = '',
}) => {
  const safeTarget = Number.isFinite(value) ? value : 0;
  const prevRef = useRef(safeTarget);
  const [display, setDisplay] = useState(safeTarget);

  useEffect(() => {
    const reduced =
      typeof window !== 'undefined' &&
      (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ||
        document.documentElement.classList.contains('fx-lite'));

    const startVal = prevRef.current;
    if (reduced || startVal === safeTarget || duration <= 0) {
      prevRef.current = safeTarget;
      setDisplay(safeTarget);
      return;
    }

    let raf = 0;
    const startTime = performance.now();

    const tick = (now: number) => {
      const progress = Math.min(1, (now - startTime) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startVal + (safeTarget - startVal) * eased);
      setDisplay(current);
      if (progress < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        prevRef.current = safeTarget;
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [safeTarget, duration]);

  return (
    <span className={`tabular-nums ${className}`} dir="ltr">
      {display.toLocaleString('en-US')}
    </span>
  );
};
