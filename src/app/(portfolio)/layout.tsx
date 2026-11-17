import { Space_Grotesk } from 'next/font/google';
import { SmoothScroll } from '@/components/motion/smooth-scroll';

// Latin only: the face has no Cyrillic, so Mongolian text falls back to the system font.
const spaceGrotesk = Space_Grotesk({
  variable: '--font-space-grotesk',
  subsets: ['latin', 'latin-ext'],
});

/** The portfolio is a full-bleed light page: no site header, no viewfinder frame. */
export default function PortfolioLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className={`${spaceGrotesk.variable} portfolio-theme min-h-svh`}>
      <SmoothScroll />
      {children}
    </div>
  );
}
