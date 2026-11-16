'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { VideoOptionsFields } from '@/components/video-options-fields';
import { formatFileSize } from '@/lib/format';
import { makeSpeechAudio } from '@/lib/speech-audio';
import { postJson, uploadSpeechAudio } from '@/lib/upload-client';
import { readVideoDetails, uploadToSignedUrl } from '@/lib/video-file';
import type { VideoTopic, VideoVisibility } from '@/types/db';

const ACCEPTED_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];

type UploadUrls = {
  storageProvider: 'supabase' | 'r2';
  videoPath: string;
  videoUploadUrl: string;
  thumbnailPath: string;
  thumbnailUploadUrl: string;
  audioPath: string;
  audioUploadUrl: string;
};

/** `maxBytes`: 2 GB when videos go to R2, 50 MB on Supabase (the page decides). */
export function UploadForm({ maxBytes }: { maxBytes: number }) {
  const router = useRouter();
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [topic, setTopic] = useState<VideoTopic>('life');
  const [visibility, setVisibility] = useState<VideoVisibility>('members');
  const [progress, setProgress] = useState<number | null>(null);
  const [isPreparingAudio, setIsPreparingAudio] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const isUploading = progress !== null;

  function chooseFile(file: File | undefined) {
    setErrorMessage(null);
    if (!file) return setVideoFile(null);
    if (!ACCEPTED_TYPES.includes(file.type))
      return setErrorMessage('Use an mp4, webm or mov file.');
    if (file.size > maxBytes) {
      return setErrorMessage(`This file is over ${formatFileSize(maxBytes)}.`);
    }
    setVideoFile(file);
    if (!title) setTitle(file.name.replace(/\.[^.]+$/, ''));
  }

  async function submitUpload(event: React.FormEvent) {
    event.preventDefault();
    if (!videoFile || isUploading) return;
    setErrorMessage(null);
    setProgress(0);

    try {
      // Runs alongside the video upload; the transcript is made from this small file.
      const speechAudio = makeSpeechAudio(videoFile);
      const details = await readVideoDetails(videoFile);
      const urls = await postJson<UploadUrls>('/api/videos/upload-url', {
        contentType: videoFile.type,
        sizeBytes: videoFile.size,
      });
      await uploadToSignedUrl(urls.videoUploadUrl, videoFile, videoFile.type, setProgress);
      if (details.thumbnail) {
        await uploadToSignedUrl(urls.thumbnailUploadUrl, details.thumbnail, 'image/jpeg');
      }
      setIsPreparingAudio(true);
      const audioPath = await uploadSpeechAudio(
        await speechAudio,
        urls.audioUploadUrl,
        urls.audioPath,
      );
      const saved = await postJson<{ id: string }>('/api/videos', {
        title,
        description,
        videoPath: urls.videoPath,
        storageProvider: urls.storageProvider,
        thumbnailPath: details.thumbnail ? urls.thumbnailPath : null,
        audioPath,
        durationSeconds: details.durationSeconds,
        topic,
        visibility,
      });
      router.push(`/videos/${saved.id}`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Upload failed. Try again.');
      setProgress(null);
      setIsPreparingAudio(false);
    }
  }

  return (
    <form onSubmit={submitUpload} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Label htmlFor="video-file">
          Video (mp4, webm or mov, up to {formatFileSize(maxBytes)})
        </Label>
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

      <VideoOptionsFields
        topic={topic}
        visibility={visibility}
        disabled={isUploading}
        onTopicChange={setTopic}
        onVisibilityChange={setVisibility}
      />

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
        {isPreparingAudio
          ? 'Preparing audio for the transcript…'
          : isUploading
            ? `Uploading… ${Math.round(progress * 100)}%`
            : 'Upload video'}
      </Button>
    </form>
  );
}
