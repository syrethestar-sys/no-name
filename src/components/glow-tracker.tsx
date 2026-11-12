'use client';

import { useEffect } from 'react';

/**
 * One listener for the whole page: tells the `[data-glow]` card under the mouse where the
 * pointer is (`--glow-x/--glow-y`), and the `glow-edge` CSS draws the light there.
 * Skipped on touch screens and for people who prefer reduced motion.
 */
export function GlowTracker() {
  useEffect(() => {
    const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!canHover || reducedMotion) return;

    function moveGlow(event: PointerEvent) {
      if (!(event.target instanceof Element)) return;
      const card = event.target.closest<HTMLElement>('[data-glow]');
      if (!card) return;
      const bounds = card.getBoundingClientRect();
      card.style.setProperty('--glow-x', `${event.clientX - bounds.left}px`);
      card.style.setProperty('--glow-y', `${event.clientY - bounds.top}px`);
    }

    document.addEventListener('pointermove', moveGlow, { passive: true });
    return () => document.removeEventListener('pointermove', moveGlow);
  }, []);

  return null;
}
