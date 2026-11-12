'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { makeSpeechAudio } from '@/lib/speech-audio';
import { uploadToSignedUrl } from '@/lib/video-file';
import type { Video } from '@/types/db';

const STATUS_LABELS: Record<Video['transcriptStatus'], string> = {
  pending: 'Transcript: not done yet',
  done: 'Transcript: done',
  failed: 'Transcript: failed',
};

/**
 * For a video uploaded before speech audio existed: make it here from the playback URL and
 * upload it. Returns its storage path, or null to let the server use the video itself.
 */
async function prepareSpeechAudio(videoId: string, videoUrl: string): Promise<string | null> {
  const audio = await makeSpeechAudio(videoUrl);
  if (!audio) return null;
  const response = await fetch(`/api/videos/${videoId}/audio-upload-url`, { method: 'POST' });
  if (!response.ok) return null;
  const { audioPath, audioUploadUrl }: { audioPath: string; audioUploadUrl: string } =
    await response.json();
  await uploadToSignedUrl(audioUploadUrl, audio, 'audio/webm');
  return audioPath;
}

/** Owner only: shows the transcript status and runs (or re-runs) transcription. */
export function TranscribeButton({
  videoId,
  transcriptStatus,
  videoUrl,
  hasAudio,
}: {
  videoId: string;
  transcriptStatus: Video['transcriptStatus'];
  /** Signed playback URL, used to make speech audio when the video has none yet. */
  videoUrl: string | null;
  hasAudio: boolean;
}) {
  const router = useRouter();
  const [stage, setStage] = useState<'idle' | 'audio' | 'transcribing'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const isRunning = stage !== 'idle';

  async function transcribe() {
    setErrorMessage(null);
    let audioPath: string | null = null;
    if (!hasAudio && videoUrl) {
      setStage('audio');
      audioPath = await prepareSpeechAudio(videoId, videoUrl).catch(() => null);
    }
    setStage('transcribing');
    const response = await fetch(`/api/videos/${videoId}/transcribe`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(audioPath ? { audioPath } : {}),
    }).catch(() => null);
    setStage('idle');
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
          {stage === 'audio'
            ? 'Preparing audio…'
            : stage === 'transcribing'
              ? 'Transcribing…'
              : transcriptStatus === 'pending'
                ? 'Transcribe'
                : 'Redo'}
        </Button>
      </div>
      {errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}
    </div>
  );
}
