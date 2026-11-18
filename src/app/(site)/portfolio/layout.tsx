import { SmoothScroll } from '@/components/motion/smooth-scroll';

/** Smooth scrolling for the portfolio only. The site header and viewfinder frame come from (site). */
export default function PortfolioLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <SmoothScroll />
      {children}
    </>
  );
}
