import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { getAdminUserId } from '@/lib/auth';
import {
  MAX_VIDEO_BYTES,
  newAudioPath,
  VIDEO_TYPES,
  type VideoContentType,
  videoStorage,
} from '@/lib/supabase';

const Body = z.object({
  contentType: z.enum(Object.keys(VIDEO_TYPES) as [VideoContentType, ...VideoContentType[]]),
  sizeBytes: z.number().int().positive().max(MAX_VIDEO_BYTES),
});

/** Owner only: returns signed upload URLs so the browser can PUT files straight to Storage. */
export async function POST(request: Request) {
  const adminUserId = await getAdminUserId();
  if (!adminUserId) return Response.json({ error: 'Only the owner can upload.' }, { status: 403 });

  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: 'Use an mp4, webm or mov file up to 50 MB.' }, { status: 400 });
  }

  const fileId = randomUUID();
  const videoPath = `videos/${fileId}.${VIDEO_TYPES[parsed.data.contentType]}`;
  const thumbnailPath = `thumbnails/${fileId}.jpg`;
  const audioPath = newAudioPath(fileId);

  try {
    const [video, thumbnail, audio] = await Promise.all([
      videoStorage().createSignedUploadUrl(videoPath),
      videoStorage().createSignedUploadUrl(thumbnailPath),
      videoStorage().createSignedUploadUrl(audioPath),
    ]);
    if (video.error || thumbnail.error || audio.error) {
      throw video.error ?? thumbnail.error ?? audio.error;
    }

    return Response.json({
      videoPath,
      videoUploadUrl: video.data.signedUrl,
      thumbnailPath,
      thumbnailUploadUrl: thumbnail.data.signedUrl,
      audioPath,
      audioUploadUrl: audio.data.signedUrl,
    });
  } catch (error) {
    console.error('upload-url failed', error);
    return Response.json({ error: 'Could not start the upload. Try again.' }, { status: 502 });
  }
}
