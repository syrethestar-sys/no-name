'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import type { VideoVisibility } from '@/types/db';

/** Owner only: switch a video between a public teaser and members-only. */
export function VisibilityToggle({
  videoId,
  visibility,
}: {
  videoId: string;
  visibility: VideoVisibility;
}) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const nextVisibility: VideoVisibility = visibility === 'public' ? 'members' : 'public';

  async function saveVisibility() {
    setIsSaving(true);
    setErrorMessage(null);
    const response = await fetch(`/api/videos/${videoId}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ visibility: nextVisibility }),
    }).catch(() => null);
    setIsSaving(false);
    if (!response?.ok) return setErrorMessage('Could not save. Try again.');
    router.refresh();
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button variant="outline" disabled={isSaving} onClick={saveVisibility}>
        {nextVisibility === 'public' ? 'Make public' : 'Make members-only'}
      </Button>
      {errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}
    </div>
  );
}
