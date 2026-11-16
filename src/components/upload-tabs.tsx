'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { UploadForm } from '@/components/upload-form';
import { YoutubeUploadForm } from '@/components/youtube-upload-form';

const MODES = [
  { id: 'file', label: 'Upload a file' },
  { id: 'youtube', label: 'YouTube link' },
] as const;

/**
 * Where the video lives: a file uploaded here, or an Unlisted YouTube video.
 * `maxBytes` is the file size limit of the storage new uploads go to.
 */
export function UploadTabs({ maxBytes }: { maxBytes: number }) {
  const [mode, setMode] = useState<(typeof MODES)[number]['id']>('file');

  return (
    <div className="flex flex-col gap-6">
      <div role="group" aria-label="Where the video lives" className="flex gap-2">
        {MODES.map((option) => (
          <Button
            key={option.id}
            type="button"
            size="sm"
            variant={mode === option.id ? 'default' : 'outline'}
            aria-pressed={mode === option.id}
            onClick={() => setMode(option.id)}
          >
            {option.label}
          </Button>
        ))}
      </div>
      {mode === 'file' ? <UploadForm maxBytes={maxBytes} /> : <YoutubeUploadForm />}
    </div>
  );
}
