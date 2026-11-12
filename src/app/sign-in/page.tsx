import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { AuthForm } from '@/components/auth/auth-form';

export const metadata = { title: 'Sign in · Experience Community' };

type SignInPageProps = {
  searchParams: Promise<{ redirect_url?: string; continue?: string }>;
};

/**
 * Keep only the path + query of redirect_url (Clerk may send a full URL), so the page can never
 * send people to another site.
 */
function safeReturnPath(value: string | undefined): string {
  if (!value) return '/';
  try {
    const { pathname, search } = new URL(value, 'http://placeholder.invalid');
    const isSameSitePath = pathname.startsWith('/') && !pathname.startsWith('//');
    return isSameSitePath ? `${pathname}${search}` : '/';
  } catch {
    return '/';
  }
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const { redirect_url: redirectUrl, continue: continueParam } = await searchParams;
  const returnTo = safeReturnPath(redirectUrl);
  const isFinishingSignUp = continueParam === '1';

  const { userId } = await auth();
  if (userId && !isFinishingSignUp) redirect(returnTo);

  return (
    <main className="mx-auto flex max-w-sm flex-col px-4 py-16">
      <div className="glass-panel p-6">
        <AuthForm returnTo={returnTo} resumeSignUp={isFinishingSignUp} />
      </div>
    </main>
  );
}
