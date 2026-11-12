import { eq } from 'drizzle-orm';
import { getDb } from '@/db';
import { videos } from '@/db/schema';
import { getAdminUserId } from '@/lib/auth';
import { videoStorage } from '@/lib/supabase';
import { isVideoId } from '@/lib/videos';

type RouteContext = { params: Promise<{ id: string }> };

/** Owner only: deletes the row (likes/ratings/comments cascade), then the files. */
export async function DELETE(_request: Request, { params }: RouteContext) {
  const adminUserId = await getAdminUserId();
  if (!adminUserId) return Response.json({ error: 'Only the owner can delete.' }, { status: 403 });

  const { id } = await params;
  if (!isVideoId(id)) return Response.json({ error: 'Video not found.' }, { status: 404 });

  try {
    const [deleted] = await getDb()
      .delete(videos)
      .where(eq(videos.id, id))
      .returning({ storagePath: videos.storagePath, thumbnailPath: videos.thumbnailPath });
    if (!deleted) return Response.json({ error: 'Video not found.' }, { status: 404 });

    const paths = [deleted.storagePath, deleted.thumbnailPath].filter(
      (path): path is string => path !== null,
    );
    // The row is already gone, so a failed file delete only leaves an orphan file. Log it, don't fail.
    const { error } = await videoStorage().remove(paths);
    if (error) console.error('storage cleanup failed', paths, error);

    return new Response(null, { status: 204 });
  } catch (error) {
    console.error('delete video failed', error);
    return Response.json({ error: 'Could not delete the video. Try again.' }, { status: 500 });
  }
}
