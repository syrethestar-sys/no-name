import { AuthenticateWithRedirectCallback } from '@clerk/nextjs';

export const metadata = { title: 'Signing in · Experience Community' };

/** Google sends people back here. Clerk finishes the sign-in (it renders nothing visible). */
export default function SsoCallbackPage() {
  return (
    <main className="mx-auto max-w-sm px-4 py-16 text-center text-sm text-muted-foreground">
      Signing you in…
      <AuthenticateWithRedirectCallback continueSignUpUrl="/sign-in?continue=1" />
    </main>
  );
}
