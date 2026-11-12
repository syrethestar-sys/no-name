'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

const actionClass = 'text-xs text-muted-foreground hover:text-foreground disabled:opacity-50';

/** Two-step delete (click, then confirm). Replies are removed with their comment. */
export function CommentDeleteButton({ commentId }: { commentId: string }) {
  const router = useRouter();
  const [isConfirming, setIsConfirming] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function deleteComment() {
    setIsDeleting(true);
    setErrorMessage(null);
    const response = await fetch(`/api/comments/${commentId}`, { method: 'DELETE' }).catch(
      () => null,
    );
    if (!response?.ok) {
      setErrorMessage('Could not delete. Try again.');
      setIsDeleting(false);
      return;
    }
    router.refresh();
  }

  if (!isConfirming) {
    return (
      <button type="button" className={actionClass} onClick={() => setIsConfirming(true)}>
        Delete
      </button>
    );
  }

  return (
    <span className="flex items-center gap-3">
      <button
        type="button"
        className="text-xs text-destructive hover:underline disabled:opacity-50"
        disabled={isDeleting}
        onClick={deleteComment}
      >
        {isDeleting ? 'Deleting…' : 'Delete for good'}
      </button>
      <button
        type="button"
        className={actionClass}
        disabled={isDeleting}
        onClick={() => setIsConfirming(false)}
      >
        Cancel
      </button>
      {errorMessage && <span className="text-xs text-destructive">{errorMessage}</span>}
    </span>
  );
}
