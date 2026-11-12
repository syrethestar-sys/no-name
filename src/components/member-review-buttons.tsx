'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

type ReviewStatus = 'approved' | 'rejected';

/** Owner: Approve / Reject a pending request, or Remove an approved member. */
export function MemberReviewButtons({
  userId,
  mode,
}: {
  userId: string;
  mode: 'pending' | 'approved';
}) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function review(status: ReviewStatus) {
    setIsSaving(true);
    setErrorMessage(null);
    const response = await fetch(`/api/members/${encodeURIComponent(userId)}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ status }),
    }).catch(() => null);
    setIsSaving(false);
    if (!response?.ok) return setErrorMessage('Could not save. Try again.');
    router.refresh();
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex gap-2">
        {mode === 'pending' ? (
          <>
            <Button variant="ghost" disabled={isSaving} onClick={() => review('rejected')}>
              Reject
            </Button>
            <Button disabled={isSaving} onClick={() => review('approved')}>
              Approve
            </Button>
          </>
        ) : (
          <Button variant="destructive" disabled={isSaving} onClick={() => review('rejected')}>
            Remove
          </Button>
        )}
      </div>
      {errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}
    </div>
  );
}
