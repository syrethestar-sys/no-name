'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { isClerkAPIResponseError } from '@clerk/nextjs/errors';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type ClerkUser = NonNullable<ReturnType<typeof useUser>['user']>;
type NewEmail = Awaited<ReturnType<ClerkUser['createEmailAddress']>>;

function friendlyMessage(error: unknown, fallback: string): string {
  if (isClerkAPIResponseError(error) && error.errors[0]?.code === 'form_identifier_exists') {
    return 'That email is already used by another account.';
  }
  return fallback;
}

/** Add an email in two steps: type it, then type the 6-digit code we send to it. */
export function AddEmailForm({ onAdded }: { onAdded: () => void }) {
  const { user } = useUser();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [pending, setPending] = useState<NewEmail | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function sendCode(event: React.FormEvent) {
    event.preventDefault();
    if (!user || isBusy || !email.trim()) return;
    setIsBusy(true);
    setErrorMessage(null);
    try {
      const created = await user.createEmailAddress({ email: email.trim() });
      await created.prepareVerification({ strategy: 'email_code' });
      setPending(created);
    } catch (error) {
      setErrorMessage(
        friendlyMessage(error, 'Could not send the code. Check the address and try again.'),
      );
    } finally {
      setIsBusy(false);
    }
  }

  async function checkCode(event: React.FormEvent) {
    event.preventDefault();
    if (!pending || isBusy || code.length !== 6) return;
    setIsBusy(true);
    setErrorMessage(null);
    try {
      const verified = await pending.attemptVerification({ code });
      if (verified.verification.status !== 'verified') {
        setErrorMessage('That code is wrong or expired. Try again.');
        return;
      }
      setPending(null);
      setEmail('');
      setCode('');
      onAdded();
    } catch {
      setErrorMessage('That code is wrong or expired. Try again.');
    } finally {
      setIsBusy(false);
    }
  }

  async function cancel() {
    // The unverified address would otherwise stay on the account.
    await pending?.destroy().catch(() => undefined);
    setPending(null);
    setCode('');
    setErrorMessage(null);
  }

  if (pending) {
    return (
      <form onSubmit={checkCode} className="flex flex-col gap-3">
        <Label htmlFor="new-email-code">Enter the 6-digit code sent to {email}</Label>
        <Input
          id="new-email-code"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          value={code}
          disabled={isBusy}
          onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))}
          className="max-w-40 font-mono tracking-widest"
        />
        {errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}
        <div className="flex gap-2">
          <Button type="submit" disabled={isBusy || code.length !== 6}>
            {isBusy ? 'Checking…' : 'Verify'}
          </Button>
          <Button type="button" variant="outline" disabled={isBusy} onClick={cancel}>
            Cancel
          </Button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={sendCode} className="flex flex-col gap-3">
      <Label htmlFor="new-email">Add another email</Label>
      <div className="flex gap-2">
        <Input
          id="new-email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          disabled={isBusy}
          onChange={(event) => setEmail(event.target.value)}
        />
        <Button type="submit" disabled={isBusy || !email.trim()}>
          {isBusy ? 'Sending…' : 'Send code'}
        </Button>
      </div>
      {errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}
    </form>
  );
}
