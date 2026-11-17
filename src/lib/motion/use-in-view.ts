'use client';

import { useEffect, useState, type RefObject } from 'react';

/**
 * True while the element is on screen (inset by `rootMargin`). With `once`, it turns true the first
 * time and stays true, which is what a reveal that should not replay on scroll-back wants.
 */
export function useInView(
  ref: RefObject<Element | null>,
  { once = false, rootMargin = '0px' }: { once?: boolean; rootMargin?: string } = {},
): boolean {
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setInView(true);
            if (once) observer.disconnect();
          } else if (!once) {
            setInView(false);
          }
        }
      },
      { rootMargin },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, once, rootMargin]);

  return inView;
}
