import 'server-only';
import { and, count, eq } from 'drizzle-orm';
import { getDb } from '@/db';
import { likes } from '@/db/schema';

export type LikeState = { liked: boolean; likeCount: number };

async function countLikes(videoId: string): Promise<number> {
  const [row] = await getDb()
    .select({ likeCount: count() })
    .from(likes)
    .where(eq(likes.videoId, videoId));
  return row?.likeCount ?? 0;
}

/** Count for a video, plus whether this viewer (if signed in) has liked it. */
export async function getLikeState(videoId: string, userId: string | null): Promise<LikeState> {
  const [likeCount, [viewerLike]] = await Promise.all([
    countLikes(videoId),
    userId
      ? getDb()
          .select({ userId: likes.userId })
          .from(likes)
          .where(and(eq(likes.videoId, videoId), eq(likes.userId, userId)))
          .limit(1)
      : Promise.resolve([]),
  ]);
  return { liked: viewerLike !== undefined, likeCount };
}

/**
 * Sets the like to the state the client asked for. Idempotent, so a double click or a retry
 * can't flip it twice; the composite primary key keeps it to one like per user per video.
 */
export async function setLike(videoId: string, userId: string, liked: boolean): Promise<LikeState> {
  if (liked) {
    await getDb().insert(likes).values({ videoId, userId }).onConflictDoNothing();
  } else {
    await getDb()
      .delete(likes)
      .where(and(eq(likes.videoId, videoId), eq(likes.userId, userId)));
  }
  return { liked, likeCount: await countLikes(videoId) };
}
