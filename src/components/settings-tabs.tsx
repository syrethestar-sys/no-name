'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

// More tabs (membership, activity, safety) are added here as their pages arrive.
const TABS = [{ href: '/settings/profile', label: 'Profile' }] as const;

/** The settings sections: a column on wide screens, a scrolling row on phones. */
export function SettingsTabs() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Settings sections"
      className="flex shrink-0 gap-1 overflow-x-auto md:w-44 md:flex-col"
    >
      {TABS.map((tab) => {
        const isActive = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={isActive ? 'page' : undefined}
            className={`rounded-md px-3 py-2 text-sm whitespace-nowrap transition-colors ${
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-glass-hover hover:text-foreground'
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
