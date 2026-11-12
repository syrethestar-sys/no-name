import 'server-only';
import { and, count, desc, eq } from 'drizzle-orm';
import { getDb } from '@/db';
import { likes, videos } from '@/db/schema';
import { SIGNED_URL_SECONDS, videoStorage } from '@/lib/supabase';
import type { Video, VideoTopic } from '@/types/db';

export const VIDEO_TOPICS = ['trading', 'coding', 'life'] as const satisfies readonly VideoTopic[];
export const isVideoTopic = (value: unknown): value is VideoTopic =>
  VIDEO_TOPICS.includes(value as VideoTopic);

export const FEED_SORTS = ['newest', 'liked'] as const;
export type FeedSort = (typeof FEED_SORTS)[number];
export const isFeedSort = (value: unknown): value is FeedSort =>
  FEED_SORTS.includes(value as FeedSort);

/** Feed URL that keeps the other filter: `/?topic=coding&sort=liked`. Defaults are left out. */
export function feedHref({ topic, sort }: { topic: VideoTopic | null; sort: FeedSort }): string {
  const query = new URLSearchParams();
  if (topic) query.set('topic', topic);
  if (sort !== 'newest') query.set('sort', sort);
  const queryString = query.toString();
  return queryString ? `/?${queryString}` : '/';
}

export type VideoCardData = Pick<
  Video,
  'id' | 'title' | 'durationSeconds' | 'createdAt' | 'visibility' | 'topic'
> & {
  thumbnailUrl: string | null;
  /** Members-only and the viewer isn't a member: show a teaser, never a playback URL. */
  isLocked: boolean;
  likeCount: number;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isVideoId = (value: string) => UUID.test(value);

const isLockedFor = (visibility: Video['visibility'], viewerIsMember: boolean) =>
  visibility === 'members' && !viewerIsMember;

/** Ready videos (optionally one topic), newest or most liked first, with signed thumbnail URLs. */
export async function listReadyVideos(options: {
  viewerIsMember: boolean;
  topic?: VideoTopic;
  sort?: FeedSort;
  limit?: number;
}): Promise<VideoCardData[]> {
  const { viewerIsMember, topic, sort = 'newest', limit = 60 } = options;
  // Counted per query (left join + group by), never stored, so it can't drift.
  const likeCount = count(likes.userId);
  const rows = await getDb()
    .select({
      id: videos.id,
      title: videos.title,
      durationSeconds: videos.durationSeconds,
      createdAt: videos.createdAt,
      visibility: videos.visibility,
      topic: videos.topic,
      thumbnailPath: videos.thumbnailPath,
      likeCount,
    })
    .from(videos)
    .leftJoin(likes, eq(likes.videoId, videos.id))
    .where(and(eq(videos.status, 'ready'), topic ? eq(videos.topic, topic) : undefined))
    .groupBy(videos.id)
    .orderBy(
      ...(sort === 'liked' ? [desc(likeCount), desc(videos.createdAt)] : [desc(videos.createdAt)]),
    )
    .limit(limit);

  // Thumbnails are a teaser, so locked cards get one too (shown blurred).
  const thumbnailPaths = rows.flatMap((row) => (row.thumbnailPath ? [row.thumbnailPath] : []));
  const signedByPath = new Map<string, string>();
  if (thumbnailPaths.length > 0) {
    const { data } = await videoStorage().createSignedUrls(thumbnailPaths, SIGNED_URL_SECONDS);
    for (const item of data ?? []) {
      if (item.path && item.signedUrl) signedByPath.set(item.path, item.signedUrl);
    }
  }

  return rows.map(({ thumbnailPath, ...row }) => ({
    ...row,
    thumbnailUrl: thumbnailPath ? (signedByPath.get(thumbnailPath) ?? null) : null,
    isLocked: isLockedFor(row.visibility, viewerIsMember),
  }));
}

export type VideoForPage = Video & {
  /** null when locked: the page must not render a player. */
  playbackUrl: string | null;
  posterUrl: string | null;
  isLocked: boolean;
};

/** One ready video for its page, or null when it doesn't exist. */
export async function getVideoForPage(
  id: string,
  viewerIsMember: boolean,
): Promise<VideoForPage | null> {
  if (!isVideoId(id)) return null;

  const [video] = await getDb().select().from(videos).where(eq(videos.id, id)).limit(1);
  if (!video || video.status !== 'ready') return null;

  const isLocked = isLockedFor(video.visibility, viewerIsMember);
  const storage = videoStorage();
  const [playback, poster] = await Promise.all([
    isLocked ? null : storage.createSignedUrl(video.storagePath, SIGNED_URL_SECONDS),
    video.thumbnailPath ? storage.createSignedUrl(video.thumbnailPath, SIGNED_URL_SECONDS) : null,
  ]);
  if (playback?.error) throw playback.error;

  return {
    ...video,
    playbackUrl: playback?.data?.signedUrl ?? null,
    posterUrl: poster?.data?.signedUrl ?? null,
    isLocked,
  };
}
