import { timingSafeEqual } from 'node:crypto';
import { z } from 'zod';
import { transcribeVideo } from '@/lib/transcribe';

const JobBody = z.object({ videoId: z.uuid() });

export const maxDuration = 300;

function hasValidSecret(request: Request): boolean {
  const expected = process.env.N8N_WEBHOOK_SECRET;
  const received = request.headers.get('x-webhook-secret');
  if (!expected || !received) return false;
  const expectedBytes = Buffer.from(expected);
  const receivedBytes = Buffer.from(received);
  return (
    expectedBytes.length === receivedBytes.length && timingSafeEqual(expectedBytes, receivedBytes)
  );
}

/**
 * Called by n8n (secret header) to transcribe a video. A non-2xx status tells n8n to retry.
 * Until n8n is set up, the upload route and the owner's button call the same job directly.
 */
export async function POST(request: Request) {
  if (!hasValidSecret(request)) return Response.json({ error: 'Forbidden.' }, { status: 403 });

  const parsed = JobBody.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: 'videoId is required.' }, { status: 400 });

  const outcome = await transcribeVideo(parsed.data.videoId);
  if (outcome === 'failed') return Response.json({ outcome }, { status: 502 });
  // done / too-big / missing: retrying won't change anything.
  return Response.json({ outcome });
}
