import { Button } from '@/components/ui/button';
import type { PortfolioLink } from '@/lib/portfolio-content';

/** Outside links of the portfolio page. They open in a new tab. */
export function PortfolioLinks({ links }: { links: PortfolioLink[] }) {
  if (links.length === 0) return null;

  return (
    <ul className="flex flex-wrap gap-3">
      {links.map((link) => (
        <li key={link.href}>
          <Button
            variant="outline"
            nativeButton={false}
            render={<a href={link.href} target="_blank" rel="noopener noreferrer" />}
          >
            {link.label} ↗
          </Button>
        </li>
      ))}
    </ul>
  );
}
