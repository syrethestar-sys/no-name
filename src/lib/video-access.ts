import 'server-only';
import { eq } from 'drizzle-orm';
import { getDb } from '@/db';
import { videos } from '@/db/schema';
import { getViewer } from '@/lib/auth';

type ReactAccess = { userId: string } | { errorResponse: Response };

/**
 * Who may like or rate a video: anyone signed in, for a video they can watch
 * (members-only videos need membership).
 */
export async function checkCanReact(
  videoId: string,
  action: 'like' | 'rate',
): Promise<ReactAccess> {
  const viewer = await getViewer();
  if (!viewer.userId) {
    return { errorResponse: Response.json({ error: `Sign in to ${action}.` }, { status: 401 }) };
  }

  const [video] = await getDb()
    .select({ status: videos.status, visibility: videos.visibility })
    .from(videos)
    .where(eq(videos.id, videoId))
    .limit(1);
  if (video?.status !== 'ready') {
    return { errorResponse: Response.json({ error: 'Video not found.' }, { status: 404 }) };
  }
  if (video.visibility === 'members' && !viewer.isMember) {
    return {
      errorResponse: Response.json({ error: 'This video is for members.' }, { status: 403 }),
    };
  }
  return { userId: viewer.userId };
}
