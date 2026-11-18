import { ContourBackdrop } from '@/components/portfolio/contour-backdrop';
import { Hero } from '@/components/portfolio/hero';

export const metadata = {
  title: 'Portfolio · Backroom',
  description: 'Who I am and what I make.',
};

// The hero is the first block of the scroll site (NOTES/PLAN.md); the other blocks follow it.
export default function PortfolioPage() {
  return (
    <div className="relative isolate">
      <ContourBackdrop className="pointer-events-none absolute inset-0 -z-10 size-full [mask-image:linear-gradient(to_bottom,black_55%,transparent)]" />
      <Hero />
    </div>
  );
}
