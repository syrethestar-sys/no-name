import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { getDb } from '@/db';
import { videos } from '@/db/schema';
import { getViewer } from '@/lib/auth';
import { setLike } from '@/lib/likes';
import { isVideoId } from '@/lib/videos';

type RouteContext = { params: Promise<{ id: string }> };

const LikeBody = z.object({ liked: z.boolean() });

/** Signed-in viewers: like or un-like a video they can watch. Body `{ liked }` is the state the viewer wants. */
export async function POST(request: Request, { params }: RouteContext) {
  const { id } = await params;
  if (!isVideoId(id)) return Response.json({ error: 'Video not found.' }, { status: 404 });

  const parsed = LikeBody.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: 'Nothing to change.' }, { status: 400 });

  try {
    const viewer = await getViewer();
    if (!viewer.userId) return Response.json({ error: 'Sign in to like.' }, { status: 401 });

    const [video] = await getDb()
      .select({ status: videos.status, visibility: videos.visibility })
      .from(videos)
      .where(eq(videos.id, id))
      .limit(1);
    if (video?.status !== 'ready') {
      return Response.json({ error: 'Video not found.' }, { status: 404 });
    }
    // Anyone signed in can like what they can watch; members-only videos need membership.
    if (video.visibility === 'members' && !viewer.isMember) {
      return Response.json({ error: 'This video is for members.' }, { status: 403 });
    }

    return Response.json(await setLike(id, viewer.userId, parsed.data.liked));
  } catch (error) {
    console.error('like failed', error);
    return Response.json({ error: 'Could not save. Try again.' }, { status: 500 });
  }
}
