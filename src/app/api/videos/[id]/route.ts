import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { getDb } from '@/db';
import { videos } from '@/db/schema';
import { getAdminUserId } from '@/lib/auth';
import { deleteVideoDocuments } from '@/lib/pinecone';
import { videoStorage } from '@/lib/supabase';
import { isVideoId } from '@/lib/videos';

type RouteContext = { params: Promise<{ id: string }> };

const PatchBody = z
  .object({
    visibility: z.enum(['public', 'members']).optional(),
    topic: z.enum(['trading', 'coding', 'life']).optional(),
  })
  .refine((body) => body.visibility || body.topic);

/** Owner only: change who can watch a video, or its topic. */
export async function PATCH(request: Request, { params }: RouteContext) {
  const adminUserId = await getAdminUserId();
  if (!adminUserId) return Response.json({ error: 'Only the owner can edit.' }, { status: 403 });

  const { id } = await params;
  if (!isVideoId(id)) return Response.json({ error: 'Video not found.' }, { status: 404 });

  const parsed = PatchBody.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: 'Nothing to change.' }, { status: 400 });

  try {
    const [updated] = await getDb()
      .update(videos)
      .set(parsed.data)
      .where(eq(videos.id, id))
      .returning({ id: videos.id });
    if (!updated) return Response.json({ error: 'Video not found.' }, { status: 404 });
    return Response.json({ id: updated.id });
  } catch (error) {
    console.error('update video failed', error);
    return Response.json({ error: 'Could not save. Try again.' }, { status: 500 });
  }
}

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
    // Same for search: an orphan document is filtered out later (its video row is gone).
    await deleteVideoDocuments(id).catch((searchError: unknown) =>
      console.error('search cleanup failed', id, searchError),
    );

    return new Response(null, { status: 204 });
  } catch (error) {
    console.error('delete video failed', error);
    return Response.json({ error: 'Could not delete the video. Try again.' }, { status: 500 });
  }
}
