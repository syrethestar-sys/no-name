import type { Metadata } from 'next';
import { Inter, JetBrains_Mono, Oswald } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import { AuthDialogProvider } from '@/components/auth/auth-dialog-provider';
import { GlowTracker } from '@/components/glow-tracker';
import { SiteHeader } from '@/components/site-header';
import { ViewfinderFrame } from '@/components/viewfinder-frame';
import './globals.css';

// Cyrillic subsets so Mongolian titles and comments render in the same font.
const inter = Inter({ variable: '--font-inter', subsets: ['latin', 'cyrillic'] });
// Condensed display face for the viewfinder headings; has Cyrillic too.
const oswald = Oswald({ variable: '--font-oswald', subsets: ['latin', 'cyrillic'] });
const jetbrainsMono = JetBrains_Mono({
  variable: '--font-jetbrains-mono',
  subsets: ['latin', 'cyrillic'],
});

export const metadata: Metadata = {
  title: 'Experience Community',
  description: 'Watch, like, rate and talk about experience videos.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable} ${oswald.variable}`}>
      <body className="antialiased">
        {/* Clerk runs underneath; every sign-in screen is our own (see components/auth). */}
        <ClerkProvider signInUrl="/sign-in" signUpUrl="/sign-in">
          <AuthDialogProvider>
            {/* Everything sits inside the viewfinder frame, so pad past its line. */}
            <div className="px-2 pb-6 sm:px-5 sm:pb-8">
              <SiteHeader />
              {children}
            </div>
            <ViewfinderFrame />
            <GlowTracker />
          </AuthDialogProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
