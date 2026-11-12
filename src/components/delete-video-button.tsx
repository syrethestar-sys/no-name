'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

/** Two-step delete (click, then confirm) instead of a browser confirm() dialog. */
export function DeleteVideoButton({ videoId }: { videoId: string }) {
  const router = useRouter();
  const [isConfirming, setIsConfirming] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function deleteVideo() {
    setIsDeleting(true);
    setErrorMessage(null);
    const response = await fetch(`/api/videos/${videoId}`, { method: 'DELETE' }).catch(() => null);
    if (!response?.ok) {
      setErrorMessage('Could not delete. Try again.');
      setIsDeleting(false);
      return;
    }
    router.push('/');
    router.refresh();
  }

  if (!isConfirming) {
    return (
      <Button variant="destructive" onClick={() => setIsConfirming(true)}>
        Delete
      </Button>
    );
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex gap-2">
        <Button variant="ghost" disabled={isDeleting} onClick={() => setIsConfirming(false)}>
          Cancel
        </Button>
        <Button variant="destructive" disabled={isDeleting} onClick={deleteVideo}>
          {isDeleting ? 'Deleting…' : 'Delete forever'}
        </Button>
      </div>
      {errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}
    </div>
  );
}
