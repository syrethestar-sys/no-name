'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { VideoOptionsFields } from '@/components/video-options-fields';
import { makeSpeechAudio } from '@/lib/speech-audio';
import { postJson, uploadSpeechAudio } from '@/lib/upload-client';
import { readVideoDetails, uploadToSignedUrl } from '@/lib/video-file';
import { parseYoutubeId } from '@/lib/youtube';
import type { VideoTopic, VideoVisibility } from '@/types/db';

const ACCEPTED_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];

type YoutubeUploadUrls = {
  thumbnailPath: string;
  thumbnailUploadUrl: string;
  audioPath: string;
  audioUploadUrl: string;
};

const NO_AUDIO_MESSAGE =
  "This browser couldn't read the sound, so this video would have no transcript and no search. " +
  'Press Save again to continue without one.';

/** For a video that is already on YouTube: paste its link, pick the same file for sound and a thumbnail. */
export function YoutubeUploadForm() {
  const router = useRouter();
  const [link, setLink] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [topic, setTopic] = useState<VideoTopic>('life');
  const [visibility, setVisibility] = useState<VideoVisibility>('members');
  const [isSaving, setIsSaving] = useState(false);
  const [canSkipTranscript, setCanSkipTranscript] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const hasLink = link.trim() !== '';
  const isLinkValid = parseYoutubeId(link) !== null;

  function chooseFile(file: File | undefined) {
    setErrorMessage(null);
    setCanSkipTranscript(false);
    if (!file) return setVideoFile(null);
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return setErrorMessage('Use an mp4, webm or mov file.');
    }
    setVideoFile(file);
    if (!title) setTitle(file.name.replace(/\.[^.]+$/, ''));
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!videoFile || !isLinkValid || isSaving) return;
    setErrorMessage(null);
    setIsSaving(true);

    try {
      // The file stays on this computer: only its sound, length and one frame are used.
      const [details, speechAudio] = await Promise.all([
        readVideoDetails(videoFile),
        makeSpeechAudio(videoFile),
      ]);
      if (!speechAudio && !canSkipTranscript) {
        setCanSkipTranscript(true);
        setErrorMessage(NO_AUDIO_MESSAGE);
        setIsSaving(false);
        return;
      }

      const urls = await postJson<YoutubeUploadUrls>('/api/videos/youtube-upload-url', {});
      if (details.thumbnail) {
        await uploadToSignedUrl(urls.thumbnailUploadUrl, details.thumbnail, 'image/jpeg');
      }
      const audioPath = await uploadSpeechAudio(speechAudio, urls.audioUploadUrl, urls.audioPath);
      const saved = await postJson<{ id: string }>('/api/videos', {
        title,
        description,
        youtubeUrl: link,
        thumbnailPath: details.thumbnail ? urls.thumbnailPath : null,
        audioPath,
        durationSeconds: details.durationSeconds,
        topic,
        visibility,
      });
      router.push(`/videos/${saved.id}`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Could not save. Try again.');
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={save} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Label htmlFor="youtube-link">YouTube link</Label>
        <Input
          id="youtube-link"
          value={link}
          placeholder="https://youtu.be/…"
          inputMode="url"
          autoComplete="off"
          required
          disabled={isSaving}
          aria-invalid={hasLink && !isLinkValid}
          onChange={(event) => setLink(event.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          In YouTube Studio set visibility to <strong>Unlisted</strong> and keep &ldquo;Allow
          embedding&rdquo; on.
        </p>
        {hasLink && !isLinkValid && (
          <p className="text-sm text-destructive">That doesn&apos;t look like a YouTube link.</p>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="youtube-file">The same video file (mp4, webm or mov)</Label>
        <Input
          id="youtube-file"
          type="file"
          accept={ACCEPTED_TYPES.join(',')}
          disabled={isSaving}
          onChange={(event) => chooseFile(event.target.files?.[0])}
        />
        <p className="text-xs text-muted-foreground">
          It is not uploaded. Your browser reads its sound for the transcript, its length, and one
          frame for the thumbnail.
        </p>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="youtube-title">Title</Label>
        <Input
          id="youtube-title"
          value={title}
          maxLength={120}
          required
          disabled={isSaving}
          onChange={(event) => setTitle(event.target.value)}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="youtube-description">Description</Label>
        <Textarea
          id="youtube-description"
          value={description}
          maxLength={5000}
          rows={4}
          disabled={isSaving}
          onChange={(event) => setDescription(event.target.value)}
        />
      </div>

      <VideoOptionsFields
        topic={topic}
        visibility={visibility}
        disabled={isSaving}
        onTopicChange={setTopic}
        onVisibilityChange={setVisibility}
      />

      {errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}

      <Button
        type="submit"
        size="lg"
        disabled={!videoFile || !isLinkValid || !title.trim() || isSaving}
      >
        {isSaving ? 'Reading the file and saving…' : 'Save video'}
      </Button>
    </form>
  );
}
