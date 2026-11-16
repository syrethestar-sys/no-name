'use client';

import { useState } from 'react';
import { useReverification } from '@clerk/nextjs';
import { ConfirmIdentityDialog, type IdentityRequest } from '@/components/confirm-identity-dialog';

/**
 * Wraps an action that Clerk may want re-verified (sign out another device, delete the account).
 * Call `run(...)` instead of the action and render `dialog` once. If the person cancels the check,
 * `run` rejects with a reverification-cancelled error (see `isReverificationCancelledError`).
 */
export function useConfirmedAction<Args extends unknown[], Result>(
  action: (...args: Args) => Promise<Result>,
) {
  const [request, setRequest] = useState<IdentityRequest | null>(null);
  const run = useReverification(action, {
    onNeedsReverification: ({ level, complete, cancel }) => setRequest({ level, complete, cancel }),
  });
  const dialog = <ConfirmIdentityDialog request={request} onClose={() => setRequest(null)} />;
  return { run, dialog };
}
