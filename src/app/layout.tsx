import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import { dark } from '@clerk/ui/themes';
import { SiteHeader } from '@/components/site-header';
import './globals.css';

// Cyrillic subsets so Mongolian titles and comments render in the same font.
const inter = Inter({ variable: '--font-inter', subsets: ['latin', 'cyrillic'] });
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
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="antialiased">
        <ClerkProvider appearance={{ theme: dark, variables: { colorPrimary: '#5fd38d' } }}>
          <SiteHeader />
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
