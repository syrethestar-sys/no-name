import { getViewer } from '@/lib/auth';
import { deleteComment, findCommentOwner } from '@/lib/comments';
import { isUuid } from '@/lib/videos';

type RouteContext = { params: Promise<{ commentId: string }> };

/** The author deletes their own comment; the owner can delete any. Replies go with it. */
export async function DELETE(_request: Request, { params }: RouteContext) {
  const { commentId } = await params;
  if (!isUuid(commentId)) return Response.json({ error: 'That comment is gone.' }, { status: 404 });

  try {
    const viewer = await getViewer();
    if (!viewer.userId) return Response.json({ error: 'Sign in first.' }, { status: 401 });

    const authorId = await findCommentOwner(commentId);
    if (!authorId) return Response.json({ error: 'That comment is gone.' }, { status: 404 });
    if (authorId !== viewer.userId && !viewer.isOwner) {
      return Response.json({ error: 'You can only delete your own comments.' }, { status: 403 });
    }

    await deleteComment(commentId);
    return Response.json({ deleted: true });
  } catch (error) {
    console.error('delete comment failed', error);
    return Response.json({ error: 'Could not delete. Try again.' }, { status: 500 });
  }
}
