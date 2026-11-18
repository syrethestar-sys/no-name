import type { PortfolioLink } from '@/lib/portfolio-content';

/** Outside links of the portfolio page. They open in a new tab. */
export function PortfolioLinks({ links }: { links: PortfolioLink[] }) {
  if (links.length === 0) return null;

  return (
    <ul className="flex flex-wrap gap-3">
      {links.map((link) => (
        <li key={link.href}>
          <a
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block rounded-md border border-pf-ink/30 px-4 py-2 text-sm uppercase transition-colors duration-150 hover:border-pf-accent hover:bg-pf-accent hover:text-pf-ground"
          >
            {link.label} ↗
          </a>
        </li>
      ))}
    </ul>
  );
}
