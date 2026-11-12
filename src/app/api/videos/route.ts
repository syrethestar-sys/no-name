import { z } from 'zod';
import { getDb } from '@/db';
import { videos } from '@/db/schema';
import { getAdminUserId } from '@/lib/auth';

// Paths must be the ones /api/videos/upload-url handed out: a uuid in our folders.
const uuidPattern = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';
const Body = z.object({
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().max(5000).default(''),
  videoPath: z.string().regex(new RegExp(`^videos/${uuidPattern}\\.(mp4|webm|mov)$`)),
  thumbnailPath: z
    .string()
    .regex(new RegExp(`^thumbnails/${uuidPattern}\\.jpg$`))
    .nullable(),
  durationSeconds: z
    .number()
    .int()
    .nonnegative()
    .max(24 * 60 * 60)
    .nullable(),
});

/** Owner only: saves a video row after the files are uploaded. */
export async function POST(request: Request) {
  const adminUserId = await getAdminUserId();
  if (!adminUserId) return Response.json({ error: 'Only the owner can upload.' }, { status: 403 });

  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: 'Title is required (max 120 characters).' }, { status: 400 });
  }

  const { title, description, videoPath, thumbnailPath, durationSeconds } = parsed.data;
  try {
    const [video] = await getDb()
      .insert(videos)
      .values({
        title,
        description,
        storagePath: videoPath,
        thumbnailPath,
        durationSeconds,
        status: 'ready', // Phase 7 adds transcripts separately (transcript IS NULL = not yet).
      })
      .returning({ id: videos.id });
    return Response.json({ id: video.id }, { status: 201 });
  } catch (error) {
    console.error('save video failed', error);
    return Response.json({ error: 'Could not save the video. Try again.' }, { status: 500 });
  }
}
