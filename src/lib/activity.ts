import 'server-only';
import { and, desc, eq } from 'drizzle-orm';
import { getDb } from '@/db';
import { comments, likes, ratings, videos } from '@/db/schema';
import { isLockedFor } from '@/lib/videos';
import type { Video } from '@/types/db';

const LIST_SIZE = 30;

/** A video a person reacted to. `title` is null when they can no longer watch it. */
export type ActivityVideo = { id: string; title: string | null; isLocked: boolean };

export type MyActivity = {
  liked: { video: ActivityVideo; at: Date }[];
  rated: { video: ActivityVideo; stars: number; at: Date }[];
  commented: { video: ActivityVideo; id: string; text: string; at: Date }[];
};

type VideoRow = { videoId: string; title: string; visibility: Video['visibility'] };

function toActivityVideo(row: VideoRow, viewerIsMember: boolean): ActivityVideo {
  const isLocked = isLockedFor(row.visibility, viewerIsMember);
  return { id: row.videoId, title: isLocked ? null : row.title, isLocked };
}

/** What `userId` liked, rated and commented on: newest first, only videos that are ready. */
export async function getMyActivity(userId: string, viewerIsMember: boolean): Promise<MyActivity> {
  const db = getDb();
  const [likedRows, ratedRows, commentRows] = await Promise.all([
    db
      .select({
        videoId: videos.id,
        title: videos.title,
        visibility: videos.visibility,
        at: likes.createdAt,
      })
      .from(likes)
      .innerJoin(videos, eq(videos.id, likes.videoId))
      .where(and(eq(likes.userId, userId), eq(videos.status, 'ready')))
      .orderBy(desc(likes.createdAt))
      .limit(LIST_SIZE),
    db
      .select({
        videoId: videos.id,
        title: videos.title,
        visibility: videos.visibility,
        stars: ratings.stars,
        at: ratings.updatedAt,
      })
      .from(ratings)
      .innerJoin(videos, eq(videos.id, ratings.videoId))
      .where(and(eq(ratings.userId, userId), eq(videos.status, 'ready')))
      .orderBy(desc(ratings.updatedAt))
      .limit(LIST_SIZE),
    db
      .select({
        id: comments.id,
        videoId: videos.id,
        title: videos.title,
        visibility: videos.visibility,
        text: comments.text,
        at: comments.createdAt,
      })
      .from(comments)
      .innerJoin(videos, eq(videos.id, comments.videoId))
      .where(and(eq(comments.userId, userId), eq(videos.status, 'ready')))
      .orderBy(desc(comments.createdAt))
      .limit(LIST_SIZE),
  ]);

  return {
    liked: likedRows.map((row) => ({ video: toActivityVideo(row, viewerIsMember), at: row.at })),
    rated: ratedRows.map((row) => ({
      video: toActivityVideo(row, viewerIsMember),
      stars: row.stars,
      at: row.at,
    })),
    // A comment on a video the person can no longer watch is hidden too: its text could quote it.
    commented: commentRows.map((row) => {
      const video = toActivityVideo(row, viewerIsMember);
      return { video, id: row.id, text: video.isLocked ? '' : row.text, at: row.at };
    }),
  };
}
