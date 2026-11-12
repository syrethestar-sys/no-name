import { z } from 'zod';
import { getAdminUserId } from '@/lib/auth';
import { AUDIO_PATH_PATTERN } from '@/lib/supabase';
import { saveAudioPath, transcribeVideo } from '@/lib/transcribe';
import { isVideoId } from '@/lib/videos';

type RouteContext = { params: Promise<{ id: string }> };

/** `audioPath`: the owner's browser just uploaded speech-only audio for this video. */
const Body = z.object({ audioPath: z.string().regex(AUDIO_PATH_PATTERN).optional() });

const OUTCOME_MESSAGES = {
  failed: 'Could not transcribe. Try again later.',
  'too-big': 'Over 25 MB even as audio, too long for free transcription.',
  missing: 'Video not found.',
} as const;

// Long videos take a while: whisper + indexing can run for minutes.
export const maxDuration = 300;

/** Owner only: transcribe now (first time, or retry after a failure). Waits for the result. */
export async function POST(request: Request, { params }: RouteContext) {
  const adminUserId = await getAdminUserId();
  if (!adminUserId) {
    return Response.json({ error: 'Only the owner can transcribe.' }, { status: 403 });
  }

  const { id } = await params;
  if (!isVideoId(id)) return Response.json({ error: 'Video not found.' }, { status: 404 });

  // An empty body is fine (plain retry); a bad one is not.
  const parsed = Body.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return Response.json({ error: 'Bad audio file.' }, { status: 400 });
  if (parsed.data.audioPath) {
    const saved = await saveAudioPath(id, parsed.data.audioPath);
    if (saved === 'missing') return Response.json({ error: 'Video not found.' }, { status: 404 });
  }

  const outcome = await transcribeVideo(id);
  if (outcome === 'done') return Response.json({ transcriptStatus: 'done' });
  const status = outcome === 'missing' ? 404 : outcome === 'too-big' ? 413 : 502;
  return Response.json({ error: OUTCOME_MESSAGES[outcome] }, { status });
}
