import { randomUUID } from 'node:crypto';
import { getAdminUserId } from '@/lib/auth';
import { newAudioPath, videoStorage } from '@/lib/supabase';
import { isVideoId } from '@/lib/videos';

type RouteContext = { params: Promise<{ id: string }> };

/**
 * Owner only: a signed upload URL for a video's speech-only audio, so an older video can get
 * one from the owner's browser. The transcribe route then saves the path.
 */
export async function POST(_request: Request, { params }: RouteContext) {
  const adminUserId = await getAdminUserId();
  if (!adminUserId) {
    return Response.json({ error: 'Only the owner can transcribe.' }, { status: 403 });
  }

  const { id } = await params;
  if (!isVideoId(id)) return Response.json({ error: 'Video not found.' }, { status: 404 });

  const audioPath = newAudioPath(randomUUID());
  const { data, error } = await videoStorage().createSignedUploadUrl(audioPath);
  if (error) {
    console.error('audio upload-url failed', id, error);
    return Response.json({ error: 'Could not start the upload. Try again.' }, { status: 502 });
  }
  return Response.json({ audioPath, audioUploadUrl: data.signedUrl });
}
