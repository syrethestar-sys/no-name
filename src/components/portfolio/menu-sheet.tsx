'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Rise } from '@/components/motion/rise';
import type { PortfolioLink } from '@/lib/portfolio-content';
import { pauseSmoothScroll, resumeSmoothScroll } from '@/lib/motion/smooth-scroll';
import { springConfigs } from '@/lib/motion/spring';

/** Keeps Tab inside the sheet. */
function trapFocus(event: KeyboardEvent, sheet: Element | null | undefined) {
  const items = sheet?.querySelectorAll<HTMLElement>('a[href], button');
  if (!items || items.length === 0) return;
  const first = items[0];
  const last = items[items.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

/**
 * The burger button and the full-screen sheet it opens, for widths below 1280. The sheet is
 * mounted on <body>, outside the masthead: a transformed ancestor would pin a fixed sheet inside
 * the header instead of the viewport.
 */
export function MenuSheet({ links, siteName }: { links: PortfolioLink[]; siteName: string }) {
  const [open, setOpen] = useState(false);
  const burgerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const burger = burgerRef.current;
    const html = document.documentElement;
    const previousOverflow = html.style.overflow;
    pauseSmoothScroll();
    html.style.overflow = 'hidden';
    closeRef.current?.focus();

    const wide = window.matchMedia('(min-width: 1280px)');
    const onWidth = (event: MediaQueryListEvent) => {
      if (event.matches) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
      if (event.key === 'Tab') trapFocus(event, closeRef.current?.closest('[role="dialog"]'));
    };
    wide.addEventListener('change', onWidth);
    document.addEventListener('keydown', onKey);

    return () => {
      wide.removeEventListener('change', onWidth);
      document.removeEventListener('keydown', onKey);
      html.style.overflow = previousOverflow;
      resumeSmoothScroll();
      burger?.focus();
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <>
      <button
        ref={burgerRef}
        type="button"
        aria-label="Open menu"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="-mr-2 p-2 xl:hidden"
      >
        <span className="block h-px w-6 bg-pf-ink" />
        <span className="mt-[0.3125rem] block h-px w-6 bg-pf-ink" />
      </button>

      {open &&
        createPortal(
          <Rise
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            offset={0}
            config={springConfigs.sheet}
            className="portfolio-theme fixed inset-0 z-50 flex flex-col px-8 py-6"
          >
            <div className="flex items-center justify-between">
              <Link
                href="/portfolio"
                onClick={close}
                className="font-display text-xl font-bold tracking-wide uppercase"
              >
                {siteName}
                <span className="text-pf-accent">.</span>
              </Link>
              <button
                ref={closeRef}
                type="button"
                aria-label="Close menu"
                onClick={close}
                className="relative size-8"
              >
                <span className="absolute top-1/2 left-1/2 block h-px w-6 -translate-x-1/2 rotate-45 bg-pf-ink" />
                <span className="absolute top-1/2 left-1/2 block h-px w-6 -translate-x-1/2 -rotate-45 bg-pf-ink" />
              </button>
            </div>
            <nav aria-label="Menu" className="flex flex-1 flex-col justify-center">
              <ul className="flex flex-col gap-4 sm:gap-6">
                {links.map((link, index) => (
                  <li key={link.href}>
                    <Rise delayIn={120 + index * 55} config={springConfigs.item}>
                      <Link
                        href={link.href}
                        onClick={close}
                        className="font-display text-5xl leading-[0.95] font-bold uppercase transition-colors duration-150 hover:text-pf-accent sm:text-6xl"
                      >
                        {link.label}
                      </Link>
                    </Rise>
                  </li>
                ))}
              </ul>
            </nav>
          </Rise>,
          document.body,
        )}
    </>
  );
}
