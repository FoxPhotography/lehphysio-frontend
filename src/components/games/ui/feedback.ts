export function haptic(kind: 'tap' | 'success' | 'error'): void {
  try {
    if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    if (kind === 'tap') navigator.vibrate(10);
    else if (kind === 'success') navigator.vibrate([12, 40, 18]);
    else navigator.vibrate([30, 50, 30]);
  } catch {
    // Haptics optional on unsupported browsers
  }
}
