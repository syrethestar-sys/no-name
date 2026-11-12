import { getAdminUserId } from '@/lib/auth';
import { transcribeVideo } from '@/lib/transcribe';
import { isVideoId } from '@/lib/videos';

type RouteContext = { params: Promise<{ id: string }> };

const OUTCOME_MESSAGES = {
  failed: 'Could not transcribe. Try again later.',
  'too-big': 'This file is over 25 MB, too big for free transcription.',
  missing: 'Video not found.',
} as const;

// Long videos take a while: whisper + indexing can run for minutes.
export const maxDuration = 300;

/** Owner only: transcribe now (first time, or retry after a failure). Waits for the result. */
export async function POST(_request: Request, { params }: RouteContext) {
  const adminUserId = await getAdminUserId();
  if (!adminUserId) {
    return Response.json({ error: 'Only the owner can transcribe.' }, { status: 403 });
  }

  const { id } = await params;
  if (!isVideoId(id)) return Response.json({ error: 'Video not found.' }, { status: 404 });

  const outcome = await transcribeVideo(id);
  if (outcome === 'done') return Response.json({ transcriptStatus: 'done' });
  const status = outcome === 'missing' ? 404 : outcome === 'too-big' ? 413 : 502;
  return Response.json({ error: OUTCOME_MESSAGES[outcome] }, { status });
}
