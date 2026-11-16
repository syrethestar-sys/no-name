import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { AuthForm } from '@/components/auth/auth-form';
import { PageBackdrop } from '@/components/page-backdrop';
import { safeReturnPath } from '@/lib/safe-return-path';

export const metadata = { title: 'Sign in · Experience Community' };

type SignInPageProps = {
  searchParams: Promise<{ redirect_url?: string; continue?: string }>;
};

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const { redirect_url: redirectUrl, continue: continueParam } = await searchParams;
  const returnTo = safeReturnPath(redirectUrl);
  const isFinishingSignUp = continueParam === '1';

  const { userId } = await auth();
  if (userId && !isFinishingSignUp) redirect(returnTo);

  return (
    <main className="relative isolate flex min-h-[calc(100svh-7rem)] items-center justify-center px-4 py-16">
      <PageBackdrop />
      <div className="glass-panel w-full max-w-sm p-6 backdrop-blur-md">
        <AuthForm returnTo={returnTo} resumeSignUp={isFinishingSignUp} />
      </div>
    </main>
  );
}
