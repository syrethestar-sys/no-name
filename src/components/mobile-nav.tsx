'use client';

import Link from 'next/link';
import { MenuIcon } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export type NavLink = { href: string; label: string; badge?: number; isAccent?: boolean };

/** Phones only: the header's links in one menu button (the header shows them inline from `sm`). */
export function MobileNav({ links }: { links: NavLink[] }) {
  const badgeTotal = links.reduce((total, link) => total + (link.badge ?? 0), 0);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Open menu"
        className="relative flex size-8 items-center justify-center rounded-md text-muted-foreground outline-none hover:bg-glass-hover hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring sm:hidden"
      >
        <MenuIcon className="size-5" aria-hidden />
        {badgeTotal > 0 && (
          <span className="absolute top-1 right-1 size-2 rounded-full bg-primary" aria-hidden />
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        {links.map((link) => (
          <DropdownMenuItem
            key={link.href}
            render={<Link href={link.href} />}
            className={link.isAccent ? 'text-primary' : undefined}
          >
            {link.label}
            {link.badge ? (
              <span className="ml-auto rounded-full bg-primary px-1.5 text-xs font-medium text-primary-foreground">
                {link.badge}
              </span>
            ) : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
