import { after } from 'next/server';
import { z } from 'zod';
import { getDb } from '@/db';
import { videos } from '@/db/schema';
import { getAdminUserId } from '@/lib/auth';
import { hasOneVideoSource, YoutubeLink } from '@/lib/request-schemas';
import { AUDIO_PATH_PATTERN } from '@/lib/supabase';
import { startTranscription } from '@/lib/transcribe';
import { checkYoutubeVideo } from '@/lib/youtube-check';

// Paths must be the ones /api/videos/upload-url handed out: a uuid in our folders.
const uuidPattern = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';
const Body = z
  .object({
    title: z.string().trim().min(1).max(120),
    description: z.string().trim().max(5000).default(''),
    // Either an uploaded file (videoPath) or a YouTube link, never both.
    videoPath: z
      .string()
      .regex(new RegExp(`^videos/${uuidPattern}\\.(mp4|webm|mov)$`))
      .optional(),
    youtubeUrl: YoutubeLink.optional(),
    thumbnailPath: z
      .string()
      .regex(new RegExp(`^thumbnails/${uuidPattern}\\.jpg$`))
      .nullable(),
    /** Set only when the browser managed to extract and upload the audio. */
    audioPath: z.string().regex(AUDIO_PATH_PATTERN).nullable().default(null),
    durationSeconds: z
      .number()
      .int()
      .nonnegative()
      .max(24 * 60 * 60)
      .nullable(),
    visibility: z.enum(['public', 'members']).default('members'),
    /** Where the browser put the video file (ignored for a YouTube link). */
    storageProvider: z.enum(['supabase', 'r2']).default('supabase'),
    topic: z.enum(['trading', 'coding', 'life']).default('life'),
  })
  .refine(hasOneVideoSource);

// The transcript job runs inside this function after the response (see after() below).
export const maxDuration = 300;

/** Owner only: saves a video row after the files are uploaded. */
export async function POST(request: Request) {
  const adminUserId = await getAdminUserId();
  if (!adminUserId) return Response.json({ error: 'Only the owner can upload.' }, { status: 403 });

  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    const isBadLink = parsed.error.issues.some((issue) => issue.path[0] === 'youtubeUrl');
    const message = isBadLink
      ? "That doesn't look like a YouTube link."
      : 'Title is required (max 120 characters).';
    return Response.json({ error: message }, { status: 400 });
  }

  const {
    title,
    description,
    videoPath,
    youtubeUrl: youtubeId,
    thumbnailPath,
    audioPath,
    durationSeconds,
    visibility,
    topic,
    storageProvider,
  } = parsed.data;
  if (youtubeId && (await checkYoutubeVideo(youtubeId)) === 'unavailable') {
    return Response.json(
      {
        error:
          'YouTube cannot show that video. Check that it is Unlisted (not Private) and that "Allow embedding" is on.',
      },
      { status: 422 },
    );
  }

  try {
    const [video] = await getDb()
      .insert(videos)
      .values({
        title,
        description,
        // A YouTube video has no file of ours; its id is all we keep.
        ...(youtubeId
          ? { storageProvider: 'youtube' as const, storagePath: null, youtubeId }
          : { storageProvider, storagePath: videoPath }),
        thumbnailPath,
        audioPath,
        durationSeconds,
        visibility,
        topic,
        status: 'ready', // watchable now; the transcript follows in the background
      })
      .returning({ id: videos.id });
    // Runs after the response is sent (via n8n when configured). The owner's
    // "Transcribe" button retries failures.
    // A YouTube video without audio has nothing to transcribe, so it stays "not done yet".
    if (videoPath !== undefined || audioPath !== null) after(() => startTranscription(video.id));
    return Response.json({ id: video.id }, { status: 201 });
  } catch (error) {
    console.error('save video failed', error);
    return Response.json({ error: 'Could not save the video. Try again.' }, { status: 500 });
  }
}
