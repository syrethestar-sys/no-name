import { SmoothScroll } from '@/components/motion/smooth-scroll';
import { ReadyGate } from '@/components/portfolio/ready-gate';

/** Smooth scrolling and the loading veil for the portfolio only; the header and frame come from (site). */
export default function PortfolioLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <SmoothScroll />
      <ReadyGate>{children}</ReadyGate>
    </>
  );
}
