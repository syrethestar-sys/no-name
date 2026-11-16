'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useClerk } from '@clerk/nextjs';
import { isReverificationCancelledError } from '@clerk/nextjs/errors';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useConfirmedAction } from '@/lib/use-confirmed-action';

type DeleteResponse = { deleted?: true; error?: string };

/** The danger zone: delete your account and everything you left on the site. */
export function DeleteAccount({ isOwner }: { isOwner: boolean }) {
  const router = useRouter();
  const { signOut } = useClerk();
  const [isOpen, setIsOpen] = useState(false);
  const [typed, setTyped] = useState('');
  const [isBusy, setIsBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // The server asks for a fresh check first; `run` shows our dialog for it and then retries.
  const { run: sendDelete, dialog } = useConfirmedAction(async (): Promise<DeleteResponse> => {
    const response = await fetch('/api/me', {
      method: 'DELETE',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ confirm: 'DELETE' }),
    });
    return response.json();
  });

  async function deleteMyAccount() {
    if (typed !== 'DELETE' || isBusy) return;
    setIsBusy(true);
    setErrorMessage(null);
    try {
      const result = await sendDelete();
      if (!result.deleted) {
        setErrorMessage(result.error ?? 'Could not delete the account. Try again.');
        return;
      }
      await signOut().catch(() => undefined); // the account is gone; this just clears the browser
      router.push('/');
      router.refresh();
    } catch (error) {
      if (!isReverificationCancelledError(error)) {
        setErrorMessage('Could not delete the account. Try again.');
      }
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {dialog}
      <p className="text-sm text-muted-foreground">
        Deletes your account and everything you left here: your likes, ratings, comments (with the
        replies under them) and your membership. This cannot be undone.
      </p>
      {isOwner && (
        <p className="text-sm text-muted-foreground">
          This is the owner account, so it cannot be deleted from here.
        </p>
      )}
      <Button
        variant="destructive"
        className="self-start"
        disabled={isOwner}
        onClick={() => setIsOpen(true)}
      >
        Delete my account
      </Button>

      <Dialog
        open={isOpen}
        onOpenChange={(nextOpen) => {
          if (isBusy) return;
          setIsOpen(nextOpen);
          setTyped('');
          setErrorMessage(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete your account?</DialogTitle>
            <DialogDescription>
              Type <span className="font-mono text-foreground">DELETE</span> to confirm. You will be
              asked for a code sent to your email.
            </DialogDescription>
          </DialogHeader>
          <Input
            aria-label="Type DELETE to confirm"
            value={typed}
            autoComplete="off"
            disabled={isBusy}
            onChange={(event) => setTyped(event.target.value)}
          />
          {errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}
          <Button
            variant="destructive"
            disabled={typed !== 'DELETE' || isBusy}
            onClick={deleteMyAccount}
          >
            {isBusy ? 'Deleting…' : 'Delete everything'}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
