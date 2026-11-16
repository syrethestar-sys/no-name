'use client';

import { useEffect, useRef, useState } from 'react';
import { useSession } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

/** What Clerk hands us when an action needs the person to prove who they are again. */
export type IdentityRequest = {
  level: 'first_factor' | 'second_factor' | 'multi_factor' | undefined;
  complete: () => void;
  cancel: () => void;
};

type Step = 'sending' | 'code' | 'unsupported' | 'failed';

/**
 * Our own "confirm it's you" step (instead of Clerk's popup): we email a 6-digit code to the
 * main address and the action carries on once it is right.
 */
export function ConfirmIdentityDialog({
  request,
  onClose,
}: {
  request: IdentityRequest | null;
  onClose: () => void;
}) {
  function cancel() {
    request?.cancel();
    onClose();
  }

  return (
    <Dialog open={request !== null} onOpenChange={(isOpen) => !isOpen && cancel()}>
      <DialogContent>
        {request && <ConfirmSteps request={request} onDone={onClose} onCancel={cancel} />}
      </DialogContent>
    </Dialog>
  );
}

function ConfirmSteps({
  request,
  onDone,
  onCancel,
}: {
  request: IdentityRequest;
  onDone: () => void;
  onCancel: () => void;
}) {
  const { session } = useSession();
  const startedRef = useRef(false);
  const [step, setStep] = useState<Step>('sending');
  const [sentTo, setSentTo] = useState('');
  const [code, setCode] = useState('');
  const [isBusy, setIsBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!session || startedRef.current) return;
    startedRef.current = true;
    (async () => {
      try {
        const verification = await session.startVerification({
          level: request.level ?? 'first_factor',
        });
        const factor = verification.supportedFirstFactors?.find(
          (item) => item.strategy === 'email_code',
        );
        if (!factor || factor.strategy !== 'email_code') return setStep('unsupported');
        await session.prepareFirstFactorVerification({
          strategy: 'email_code',
          emailAddressId: factor.emailAddressId,
        });
        setSentTo(factor.safeIdentifier);
        setStep('code');
      } catch {
        setStep('failed');
      }
    })();
  }, [session, request.level]);

  async function checkCode(event: React.FormEvent) {
    event.preventDefault();
    if (!session || isBusy || code.length !== 6) return;
    setIsBusy(true);
    setErrorMessage(null);
    try {
      const result = await session.attemptFirstFactorVerification({ strategy: 'email_code', code });
      if (result.status !== 'complete') return setStep('unsupported');
      request.complete();
      onDone();
    } catch {
      setErrorMessage('That code is wrong or expired. Try again.');
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <DialogTitle>Confirm it&apos;s you</DialogTitle>
        <DialogDescription className="mt-1">
          This change needs a quick check before it goes through.
        </DialogDescription>
      </div>

      {step === 'sending' && <p className="text-sm text-muted-foreground">Sending a code…</p>}

      {step === 'code' && (
        <form onSubmit={checkCode} className="flex flex-col gap-3">
          <label htmlFor="confirm-code" className="text-sm">
            Enter the 6-digit code sent to {sentTo}
          </label>
          <Input
            id="confirm-code"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={code}
            disabled={isBusy}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))}
            className="max-w-40 font-mono tracking-widest"
          />
          {errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}
          <Button type="submit" disabled={isBusy || code.length !== 6}>
            {isBusy ? 'Checking…' : 'Confirm'}
          </Button>
        </form>
      )}

      {step === 'unsupported' && (
        <p className="text-sm text-muted-foreground">
          We can&apos;t check this here. Sign out, sign in again, then try once more.
        </p>
      )}
      {step === 'failed' && (
        <p className="text-sm text-destructive">Could not send the code. Try again.</p>
      )}

      <Button type="button" variant="outline" onClick={onCancel}>
        Cancel
      </Button>
    </div>
  );
}
