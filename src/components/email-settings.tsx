'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { AddEmailForm } from '@/components/add-email-form';
import { Button } from '@/components/ui/button';

/** Your email addresses: add one, make another the main one, remove the ones you don't use. */
export function EmailSettings() {
  const { isLoaded, user } = useUser();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  if (!isLoaded || !user) return <p className="text-sm text-muted-foreground">Loading…</p>;

  async function run(emailId: string, action: () => Promise<unknown>) {
    setBusyId(emailId);
    setErrorMessage(null);
    try {
      await action();
      await user?.reload();
    } catch {
      setErrorMessage('Could not save. Try again.');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <ul className="flex flex-col gap-2">
        {user.emailAddresses.map((address) => {
          const isPrimary = address.id === user.primaryEmailAddressId;
          const isVerified = address.verification.status === 'verified';
          return (
            <li
              key={address.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-glass px-4 py-3"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium break-all">{address.emailAddress}</p>
                <p className="font-mono text-xs text-muted-foreground">
                  {isPrimary ? 'main' : isVerified ? 'verified' : 'not verified'}
                </p>
              </div>
              {!isPrimary && (
                <div className="flex gap-2">
                  {isVerified && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busyId !== null}
                      onClick={() =>
                        run(address.id, () => user.update({ primaryEmailAddressId: address.id }))
                      }
                    >
                      Make main
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busyId !== null}
                    onClick={() => run(address.id, () => address.destroy())}
                  >
                    Remove
                  </Button>
                </div>
              )}
            </li>
          );
        })}
      </ul>
      {errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}
      <AddEmailForm onAdded={() => void user.reload()} />
    </div>
  );
}
