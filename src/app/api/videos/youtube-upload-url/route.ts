import { randomUUID } from 'node:crypto';
import { getAdminUserId } from '@/lib/auth';
import { newAudioPath, videoStorage } from '@/lib/supabase';

/**
 * Owner only: signed upload URLs for the thumbnail and speech audio of a YouTube video.
 * The video itself stays on YouTube, so there is no video URL here.
 */
export async function POST() {
  const adminUserId = await getAdminUserId();
  if (!adminUserId) return Response.json({ error: 'Only the owner can upload.' }, { status: 403 });

  const fileId = randomUUID();
  const thumbnailPath = `thumbnails/${fileId}.jpg`;
  const audioPath = newAudioPath(fileId);

  try {
    const [thumbnail, audio] = await Promise.all([
      videoStorage().createSignedUploadUrl(thumbnailPath),
      videoStorage().createSignedUploadUrl(audioPath),
    ]);
    if (thumbnail.error || audio.error) throw thumbnail.error ?? audio.error;

    return Response.json({
      thumbnailPath,
      thumbnailUploadUrl: thumbnail.data.signedUrl,
      audioPath,
      audioUploadUrl: audio.data.signedUrl,
    });
  } catch (error) {
    console.error('youtube upload-url failed', error);
    return Response.json({ error: 'Could not start the upload. Try again.' }, { status: 502 });
  }
}
