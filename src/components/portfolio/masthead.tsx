import Link from 'next/link';
import { MenuSheet } from '@/components/portfolio/menu-sheet';
import { Rise } from '@/components/motion/rise';
import { portfolioContent } from '@/lib/portfolio-content';

const linkClass =
  'text-base leading-[0.9] uppercase transition-colors duration-150 ease-[var(--pf-ease-entrance)] hover:text-pf-accent';

/**
 * The page's own header: logo on the left, the site links centred on the page's middle line, and a
 * way back to the videos on the right. Below 1280 the links move into the menu sheet.
 */
export function Masthead() {
  const { siteName, nav } = portfolioContent;

  return (
    <header className="relative z-30">
      <Rise className="relative flex items-center justify-between" offset={0.75}>
        <Link href="/portfolio" className="font-display text-xl font-bold tracking-wide uppercase">
          {siteName}
          <span className="text-pf-accent">.</span>
        </Link>

        <nav aria-label="Primary" className="absolute left-1/2 hidden -translate-x-1/2 xl:block">
          <ul className="flex gap-16">
            {nav.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className={linkClass}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <Link href="/" className={`hidden font-bold xl:block ${linkClass}`}>
          <span aria-hidden>[ </span>
          Videos
          <span aria-hidden> → ]</span>
        </Link>

        <MenuSheet links={nav} siteName={siteName} />
      </Rise>
    </header>
  );
}
