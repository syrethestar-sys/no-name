'use client';

import { useEffect, useRef } from 'react';

/**
 * Lets the TV wall drift after the cursor, like a camera on a slow head: sets `--mx`/`--my`
 * (-1 … 1, from the middle of the screen) on itself. Off for touch screens and reduced motion.
 */
export function WallParallax({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const wallRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wall = wallRef.current;
    const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!wall || !canHover || reducedMotion) return;

    let frameRequest = 0;
    function follow(event: PointerEvent) {
      cancelAnimationFrame(frameRequest);
      frameRequest = requestAnimationFrame(() => {
        wall?.style.setProperty('--mx', String((event.clientX / window.innerWidth) * 2 - 1));
        wall?.style.setProperty('--my', String((event.clientY / window.innerHeight) * 2 - 1));
      });
    }
    window.addEventListener('pointermove', follow, { passive: true });
    return () => {
      window.removeEventListener('pointermove', follow);
      cancelAnimationFrame(frameRequest);
    };
  }, []);

  return (
    <div ref={wallRef} className={className}>
      {children}
    </div>
  );
}
