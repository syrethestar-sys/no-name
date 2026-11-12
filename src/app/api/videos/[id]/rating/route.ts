import { clearRating, setRating } from '@/lib/ratings';
import { RatingBody } from '@/lib/request-schemas';
import { checkCanReact } from '@/lib/video-access';
import { isVideoId } from '@/lib/videos';

type RouteContext = { params: Promise<{ id: string }> };

/** Signed-in viewers: rate (or re-rate) a video they can watch, 1–5 stars. */
export async function PUT(request: Request, { params }: RouteContext) {
  const { id } = await params;
  if (!isVideoId(id)) return Response.json({ error: 'Video not found.' }, { status: 404 });

  const parsed = RatingBody.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: 'Pick 1 to 5 stars.' }, { status: 400 });

  try {
    const access = await checkCanReact(id, 'rate');
    if ('errorResponse' in access) return access.errorResponse;
    return Response.json(await setRating(id, access.userId, parsed.data.stars));
  } catch (error) {
    console.error('rating failed', error);
    return Response.json({ error: 'Could not save. Try again.' }, { status: 500 });
  }
}

/** Removes the viewer's own rating. */
export async function DELETE(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  if (!isVideoId(id)) return Response.json({ error: 'Video not found.' }, { status: 404 });

  try {
    const access = await checkCanReact(id, 'rate');
    if ('errorResponse' in access) return access.errorResponse;
    return Response.json(await clearRating(id, access.userId));
  } catch (error) {
    console.error('clear rating failed', error);
    return Response.json({ error: 'Could not save. Try again.' }, { status: 500 });
  }
}
