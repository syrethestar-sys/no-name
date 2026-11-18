'use client';

import { useState } from 'react';
import { portfolioContent } from '@/lib/portfolio-content';

/**
 * Covers the page (it is in the server HTML, so there is no flash of the hero) until `lifted`, then
 * fades out and removes itself. It sits under the viewfinder frame, so the frame stays visible.
 * Purely visual: the real content behind it is what is read aloud.
 */
export function LoadingVeil({ lifted }: { lifted: boolean }) {
  const [gone, setGone] = useState(false);
  if (gone) return null;

  return (
    <div
      aria-hidden
      onTransitionEnd={() => lifted && setGone(true)}
      className={`fixed inset-0 z-[35] flex flex-col justify-end gap-3 bg-pf-ground p-8 transition-opacity duration-500 ease-[var(--pf-ease-entrance)] sm:p-12 ${
        lifted ? 'pointer-events-none opacity-0' : 'opacity-100'
      }`}
    >
      <div className="flex items-end justify-between font-mono text-xs uppercase text-pf-ink-muted">
        <span>{portfolioContent.siteName}</span>
        <span className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-rec motion-safe:animate-pulse" />
          Loading
        </span>
      </div>
      <div className="h-px origin-left bg-pf-accent motion-safe:animate-[pf-veil-line_700ms_var(--pf-ease-entrance)_forwards]" />
    </div>
  );
}
