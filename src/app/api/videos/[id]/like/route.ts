import { z } from 'zod';
import { setLike } from '@/lib/likes';
import { checkCanReact } from '@/lib/video-access';
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
    const access = await checkCanReact(id, 'like');
    if ('errorResponse' in access) return access.errorResponse;
    return Response.json(await setLike(id, access.userId, parsed.data.liked));
  } catch (error) {
    console.error('like failed', error);
    return Response.json({ error: 'Could not save. Try again.' }, { status: 500 });
  }
}
