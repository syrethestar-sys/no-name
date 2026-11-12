import 'server-only';
import { and, avg, count, eq, sql } from 'drizzle-orm';
import { getDb } from '@/db';
import { ratings } from '@/db/schema';

export type RatingSummary = { average: number | null; ratingCount: number };
export type RatingState = RatingSummary & { myStars: number | null };

/** Average + count for one video. Computed, never stored, so it can't drift. */
async function summarize(videoId: string): Promise<RatingSummary> {
  const [row] = await getDb()
    .select({ average: avg(ratings.stars).mapWith(Number), ratingCount: count() })
    .from(ratings)
    .where(eq(ratings.videoId, videoId));
  const ratingCount = row?.ratingCount ?? 0;
  return { average: ratingCount > 0 ? (row?.average ?? null) : null, ratingCount };
}

async function findMyStars(videoId: string, userId: string): Promise<number | null> {
  const [row] = await getDb()
    .select({ stars: ratings.stars })
    .from(ratings)
    .where(and(eq(ratings.videoId, videoId), eq(ratings.userId, userId)))
    .limit(1);
  return row?.stars ?? null;
}

export async function getRatingState(videoId: string, userId: string | null): Promise<RatingState> {
  const [summary, myStars] = await Promise.all([
    summarize(videoId),
    userId ? findMyStars(videoId, userId) : Promise.resolve(null),
  ]);
  return { ...summary, myStars };
}

/** Rate or re-rate: one row per user per video (composite primary key). */
export async function setRating(
  videoId: string,
  userId: string,
  stars: number,
): Promise<RatingState> {
  await getDb()
    .insert(ratings)
    .values({ videoId, userId, stars })
    .onConflictDoUpdate({
      target: [ratings.videoId, ratings.userId],
      set: { stars, updatedAt: sql`now()` },
    });
  return { ...(await summarize(videoId)), myStars: stars };
}

export async function clearRating(videoId: string, userId: string): Promise<RatingState> {
  await getDb()
    .delete(ratings)
    .where(and(eq(ratings.videoId, videoId), eq(ratings.userId, userId)));
  return { ...(await summarize(videoId)), myStars: null };
}
