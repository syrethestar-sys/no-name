import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { getDb } from '@/db';
import { videos } from '@/db/schema';
import { getViewer } from '@/lib/auth';
import { setLike } from '@/lib/likes';
import { isVideoId } from '@/lib/videos';

type RouteContext = { params: Promise<{ id: string }> };

const LikeBody = z.object({ liked: z.boolean() });

/** Members only: like or un-like a video. Body `{ liked }` is the state the viewer wants. */
export async function POST(request: Request, { params }: RouteContext) {
  const { id } = await params;
  if (!isVideoId(id)) return Response.json({ error: 'Video not found.' }, { status: 404 });

  const parsed = LikeBody.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: 'Nothing to change.' }, { status: 400 });

  try {
    const viewer = await getViewer();
    if (!viewer.userId) return Response.json({ error: 'Sign in to like.' }, { status: 401 });
    if (!viewer.isMember) return Response.json({ error: 'Join to like.' }, { status: 403 });

    const [video] = await getDb()
      .select({ status: videos.status })
      .from(videos)
      .where(eq(videos.id, id))
      .limit(1);
    if (video?.status !== 'ready') {
      return Response.json({ error: 'Video not found.' }, { status: 404 });
    }

    return Response.json(await setLike(id, viewer.userId, parsed.data.liked));
  } catch (error) {
    console.error('like failed', error);
    return Response.json({ error: 'Could not save. Try again.' }, { status: 500 });
  }
}
