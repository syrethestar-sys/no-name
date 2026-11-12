'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import type { Video } from '@/types/db';

const STATUS_LABELS: Record<Video['transcriptStatus'], string> = {
  pending: 'Transcript: not done yet',
  done: 'Transcript: done',
  failed: 'Transcript: failed',
};

/** Owner only: shows the transcript status and runs (or re-runs) transcription. */
export function TranscribeButton({
  videoId,
  transcriptStatus,
}: {
  videoId: string;
  transcriptStatus: Video['transcriptStatus'];
}) {
  const router = useRouter();
  const [isRunning, setIsRunning] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function transcribe() {
    setIsRunning(true);
    setErrorMessage(null);
    const response = await fetch(`/api/videos/${videoId}/transcribe`, { method: 'POST' }).catch(
      () => null,
    );
    setIsRunning(false);
    if (!response?.ok) {
      const body: { error?: string } | null = await response?.json().catch(() => null);
      setErrorMessage(body?.error ?? 'Could not transcribe. Try again later.');
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-3">
        <span className="font-mono text-xs text-muted-foreground">
          {STATUS_LABELS[transcriptStatus]}
        </span>
        <Button variant="outline" size="sm" disabled={isRunning} onClick={transcribe}>
          {isRunning ? 'Transcribing…' : transcriptStatus === 'pending' ? 'Transcribe' : 'Redo'}
        </Button>
      </div>
      {errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}
    </div>
  );
}
