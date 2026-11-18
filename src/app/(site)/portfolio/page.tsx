import { Hero } from '@/components/portfolio/hero';

export const metadata = {
  title: 'Portfolio · Backroom',
  description: 'Who I am and what I make.',
};

// The hero is the first block of the scroll site (NOTES/PLAN.md); the other blocks follow it.
export default function PortfolioPage() {
  return <Hero />;
}
