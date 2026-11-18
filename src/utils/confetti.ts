import confetti from 'canvas-confetti';

const BRAND_COLORS = ['#FF6A00', '#FFB000', '#10b981', '#a855f7', '#fde047'];

/** Dual angled confetti bursts for game victories. */
export function fireWinConfetti() {
  try {
    confetti({
      particleCount: 55,
      angle: 60,
      spread: 55,
      origin: { x: 0.15, y: 0.65 },
      colors: BRAND_COLORS,
    });
    confetti({
      particleCount: 55,
      angle: 120,
      spread: 55,
      origin: { x: 0.85, y: 0.65 },
      colors: BRAND_COLORS,
    });
  } catch {
    // Ignore canvas/headless errors
  }
}

/** Quick centered burst for combo streaks. */
export function fireStreakBurst() {
  try {
    confetti({
      particleCount: 40,
      spread: 65,
      origin: { y: 0.6 },
      colors: BRAND_COLORS,
    });
  } catch {
    // Ignore canvas/headless errors
  }
}

/** Staggered fireworks for multiplayer podium winner. */
export function firePodiumFireworks() {
  try {
    const delays = [0, 400, 850];
    delays.forEach((delay, idx) => {
      setTimeout(() => {
        confetti({
          particleCount: 65,
          spread: 75,
          startVelocity: 36,
          origin: {
            x: idx === 0 ? 0.5 : idx === 1 ? 0.25 : 0.75,
            y: idx === 0 ? 0.45 : 0.55,
          },
          colors: BRAND_COLORS,
        });
      }, delay);
    });
  } catch {
    // Ignore canvas/headless errors
  }
}
