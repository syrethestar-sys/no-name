'use client';

import { Children, useEffect, useRef, type ReactNode } from 'react';
import { recede } from '@/lib/motion/recede';

/**
 * Blocks that pin at the top of the viewport while the next one comes up over them; the covered
 * block shrinks and darkens rather than scrolling away. All but the last block are pinned, and the
 * last one is an ordinary block above them, so the page returns to normal flow under the stack.
 *
 * The scale is applied to an inner wrapper, never to the sticky element itself: a transformed
 * ancestor would take `position: sticky` out of the viewport's frame of reference.
 */
export function StickyStack({ children }: { children: ReactNode }) {
  const blocks = Children.toArray(children);
  const layerRefs = useRef<Array<HTMLDivElement | null>>([]);

  useEffect(() => {
    const phone = window.matchMedia('(max-width: 639px)');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0;

    const apply = () => {
      frame = 0;
      const layers = layerRefs.current;
      const viewport = window.innerHeight || 1;
      const scales = !phone.matches && !reduced.matches;

      for (let index = 0; index < layers.length - 1; index += 1) {
        const layer = layers[index];
        const next = layers[index + 1];
        const inner = layer?.querySelector<HTMLElement>('[data-inner]');
        const shade = layer?.querySelector<HTMLElement>('[data-shade]');
        if (!layer || !next || !inner || !shade) continue;

        const state = recede(next.getBoundingClientRect().top, viewport, scales);
        // No transform at rest: even scale(1) makes the layer the containing block for a
        // position: fixed child (the loading veil), which would then centre in the block.
        inner.style.transform = state.scale === null ? '' : `scale(${state.scale})`;
        inner.style.willChange = state.scale === null ? '' : 'transform';
        shade.style.opacity = String(state.shade);
        // Fully covered: stop painting it (the WebGL scene behind it in particular).
        inner.style.visibility = state.hidden ? 'hidden' : 'visible';
      }
    };

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(apply);
    };

    apply();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [blocks.length]);

  return (
    <div className="relative bg-pf-black">
      {blocks.map((block, index) => {
        const isLast = index === blocks.length - 1;
        return (
          <div
            key={index}
            ref={(element) => {
              layerRefs.current[index] = element;
            }}
            className={isLast ? 'relative z-20' : `sticky top-0 ${index === 0 ? 'z-0' : 'z-10'}`}
          >
            {isLast ? (
              block
            ) : (
              <>
                <div data-inner className="origin-center">
                  {block}
                </div>
                <div
                  data-shade
                  aria-hidden
                  className="pointer-events-none absolute inset-0 bg-pf-black opacity-0"
                />
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
