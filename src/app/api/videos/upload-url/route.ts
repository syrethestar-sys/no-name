import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { getAdminUserId } from '@/lib/auth';
import { formatFileSize } from '@/lib/format';
import { r2UploadUrl } from '@/lib/r2';
import { uploadTarget } from '@/lib/stored-video';
import { newAudioPath, VIDEO_TYPES, type VideoContentType, videoStorage } from '@/lib/supabase';

const Body = z.object({
  contentType: z.enum(Object.keys(VIDEO_TYPES) as [VideoContentType, ...VideoContentType[]]),
  sizeBytes: z.number().int().positive(),
});

async function supabaseUploadUrl(path: string): Promise<string> {
  const { data, error } = await videoStorage().createSignedUploadUrl(path);
  if (error) throw error;
  return data.signedUrl;
}

/** Owner only: returns signed upload URLs so the browser can PUT files straight to Storage. */
export async function POST(request: Request) {
  const adminUserId = await getAdminUserId();
  if (!adminUserId) return Response.json({ error: 'Only the owner can upload.' }, { status: 403 });

  const { storageProvider, maxBytes } = uploadTarget();
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success || parsed.data.sizeBytes > maxBytes) {
    return Response.json(
      { error: `Use an mp4, webm or mov file up to ${formatFileSize(maxBytes)}.` },
      { status: 400 },
    );
  }

  const fileId = randomUUID();
  const videoPath = `videos/${fileId}.${VIDEO_TYPES[parsed.data.contentType]}`;
  const thumbnailPath = `thumbnails/${fileId}.jpg`;
  const audioPath = newAudioPath(fileId);

  try {
    const [videoUploadUrl, thumbnail, audio] = await Promise.all([
      storageProvider === 'r2' ? r2UploadUrl(videoPath) : supabaseUploadUrl(videoPath),
      videoStorage().createSignedUploadUrl(thumbnailPath),
      videoStorage().createSignedUploadUrl(audioPath),
    ]);
    if (thumbnail.error || audio.error) throw thumbnail.error ?? audio.error;

    return Response.json({
      videoPath,
      storageProvider,
      videoUploadUrl,
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
