'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { readVideoDetails, uploadToSignedUrl } from '@/lib/video-file';

const MAX_BYTES = 50_000_000; // same as the bucket limit
const ACCEPTED_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];

type UploadUrls = {
  videoPath: string;
  videoUploadUrl: string;
  thumbnailPath: string;
  thumbnailUploadUrl: string;
};

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error ?? 'Something went wrong. Try again.');
  return data as T;
}

export function UploadForm() {
  const router = useRouter();
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [progress, setProgress] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const isUploading = progress !== null;

  function chooseFile(file: File | undefined) {
    setErrorMessage(null);
    if (!file) return setVideoFile(null);
    if (!ACCEPTED_TYPES.includes(file.type))
      return setErrorMessage('Use an mp4, webm or mov file.');
    if (file.size > MAX_BYTES) return setErrorMessage('This file is over 50 MB.');
    setVideoFile(file);
    if (!title) setTitle(file.name.replace(/\.[^.]+$/, ''));
  }

  async function submitUpload(event: React.FormEvent) {
    event.preventDefault();
    if (!videoFile || isUploading) return;
    setErrorMessage(null);
    setProgress(0);

    try {
      const details = await readVideoDetails(videoFile);
      const urls = await postJson<UploadUrls>('/api/videos/upload-url', {
        contentType: videoFile.type,
        sizeBytes: videoFile.size,
      });
      await uploadToSignedUrl(urls.videoUploadUrl, videoFile, videoFile.type, setProgress);
      if (details.thumbnail) {
        await uploadToSignedUrl(urls.thumbnailUploadUrl, details.thumbnail, 'image/jpeg');
      }
      const saved = await postJson<{ id: string }>('/api/videos', {
        title,
        description,
        videoPath: urls.videoPath,
        thumbnailPath: details.thumbnail ? urls.thumbnailPath : null,
        durationSeconds: details.durationSeconds,
      });
      router.push(`/videos/${saved.id}`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Upload failed. Try again.');
      setProgress(null);
    }
  }

  return (
    <form onSubmit={submitUpload} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Label htmlFor="video-file">Video (mp4, webm or mov, up to 50 MB)</Label>
        <Input
          id="video-file"
          type="file"
          accept={ACCEPTED_TYPES.join(',')}
          disabled={isUploading}
          onChange={(event) => chooseFile(event.target.files?.[0])}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="video-title">Title</Label>
        <Input
          id="video-title"
          value={title}
          maxLength={120}
          required
          disabled={isUploading}
          onChange={(event) => setTitle(event.target.value)}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="video-description">Description</Label>
        <Textarea
          id="video-description"
          value={description}
          maxLength={5000}
          rows={4}
          disabled={isUploading}
          onChange={(event) => setDescription(event.target.value)}
        />
      </div>

      {isUploading && (
        <div className="h-2 overflow-hidden rounded-full bg-secondary" aria-label="Upload progress">
          <div
            className="h-full bg-primary transition-[width]"
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        </div>
      )}
      {errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}

      <Button type="submit" size="lg" disabled={!videoFile || !title.trim() || isUploading}>
        {isUploading ? `Uploading… ${Math.round(progress * 100)}%` : 'Upload video'}
      </Button>
    </form>
  );
}
