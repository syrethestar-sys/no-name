import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import { AuthDialogProvider } from '@/components/auth/auth-dialog-provider';
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
        {/* Clerk runs underneath; every sign-in screen is our own (see components/auth). */}
        <ClerkProvider signInUrl="/sign-in" signUpUrl="/sign-in">
          <AuthDialogProvider>
            <SiteHeader />
            {children}
          </AuthDialogProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
