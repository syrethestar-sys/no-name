import Lenis from 'lenis';
import { subscribe } from './ticker';

let current: Lenis | null = null;

/**
 * Smooth (eased) wheel scrolling, driven from the shared ticker. Skipped under reduced motion, so
 * the platform scrolls as normal. Returns the function that turns it off again.
 */
export function startSmoothScroll(): () => void {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return () => {};

  const lenis = new Lenis({ smoothWheel: true });
  current = lenis;
  // Subscribed first, so everything else on the page reads this frame's scroll position.
  const stop = subscribe((time) => lenis.raf(time));

  return () => {
    stop();
    lenis.destroy();
    if (current === lenis) current = null;
  };
}

/** For a menu or dialog that locks the page behind it. No-ops when smooth scroll is off. */
export const pauseSmoothScroll = () => current?.stop();
export const resumeSmoothScroll = () => current?.start();
