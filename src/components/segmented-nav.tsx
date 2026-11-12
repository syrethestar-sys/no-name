'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { NavLink } from '@/components/mobile-nav';

/** Which link is "here": exact for the feed, by section for the rest (a video counts as Videos). */
function isActiveLink(href: string, pathname: string): boolean {
  if (href === '/') return pathname === '/' || pathname.startsWith('/videos/');
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * The header's centered control, like a camcorder's segment buttons: glass segments, the current
 * page filled pale mint. Hidden on phones (the menu button takes over there).
 */
export function SegmentedNav({ links }: { links: NavLink[] }) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Main"
      className="hidden items-center gap-0.5 rounded-md border border-foreground/20 bg-foreground/[0.06] p-0.5 backdrop-blur-md sm:flex"
    >
      {links.map((link) => {
        const isActive = isActiveLink(link.href, pathname);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={isActive ? 'page' : undefined}
            className={`flex h-8 items-center gap-1.5 rounded-[5px] px-4 text-sm font-medium transition-colors ${
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-foreground/80 hover:bg-foreground/10 hover:text-foreground'
            }`}
          >
            {link.label}
            {link.badge ? (
              <span
                className={`rounded-full px-1.5 font-mono text-[0.6875rem] ${
                  isActive ? 'bg-primary-foreground/15' : 'bg-primary text-primary-foreground'
                }`}
              >
                {link.badge}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
