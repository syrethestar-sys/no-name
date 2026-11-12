import { COMMENT_MAX_LENGTH, postComment } from '@/lib/comments';
import { CommentBody } from '@/lib/request-schemas';
import { checkCanReact } from '@/lib/video-access';
import { isVideoId } from '@/lib/videos';

type RouteContext = { params: Promise<{ id: string }> };

/** Signed-in viewers: comment on a video they can watch, or reply with `parentId`. */
export async function POST(request: Request, { params }: RouteContext) {
  const { id } = await params;
  if (!isVideoId(id)) return Response.json({ error: 'Video not found.' }, { status: 404 });

  const parsed = CommentBody.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json(
      { error: `Write 1 to ${COMMENT_MAX_LENGTH} characters.` },
      { status: 400 },
    );
  }

  try {
    const access = await checkCanReact(id, 'comment');
    if ('errorResponse' in access) return access.errorResponse;

    const result = await postComment({ videoId: id, userId: access.userId, ...parsed.data });
    if (result.ok) return Response.json({ commentId: result.commentId }, { status: 201 });
    if (result.reason === 'too-fast') {
      return Response.json({ error: 'Slow down a little.' }, { status: 429 });
    }
    return Response.json({ error: 'That comment is gone.' }, { status: 404 });
  } catch (error) {
    console.error('comment failed', error);
    return Response.json({ error: 'Could not save. Try again.' }, { status: 500 });
  }
}
