import 'server-only';
import { and, avg, count, desc, eq, ilike, inArray, or, sql } from 'drizzle-orm';
import { getDb } from '@/db';
import { likes, ratings, videos } from '@/db/schema';
import { videoPlaybackUrl } from '@/lib/stored-video';
import { SIGNED_URL_SECONDS, videoStorage } from '@/lib/supabase';
import type { Video, VideoTopic } from '@/types/db';

export const VIDEO_TOPICS = ['trading', 'coding', 'life'] as const satisfies readonly VideoTopic[];
export const isVideoTopic = (value: unknown): value is VideoTopic =>
  VIDEO_TOPICS.includes(value as VideoTopic);

export const FEED_SORTS = ['newest', 'liked', 'rated'] as const;
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
  /** null when nobody has rated yet. */
  ratingAverage: number | null;
  ratingCount: number;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = (value: string) => UUID.test(value);
export const isVideoId = isUuid;

/** `ilike` pattern for "contains this text", with `%`, `_` and `\` matched literally. */
export function containsPattern(text: string): string {
  return `%${text.replace(/[\\%_]/g, (character) => `\\${character}`)}%`;
}

function matchesText(text: string) {
  const pattern = containsPattern(text);
  return or(ilike(videos.title, pattern), ilike(videos.description, pattern));
}

/** Members-only video and the viewer isn't a member (the owner always counts as a member). */
export const isLockedFor = (visibility: Video['visibility'], viewerIsMember: boolean) =>
  visibility === 'members' && !viewerIsMember;

/** Ready videos (optionally one topic), sorted, with like/rating totals and signed thumbnail URLs. */
export async function listReadyVideos(options: {
  viewerIsMember: boolean;
  topic?: VideoTopic;
  sort?: FeedSort;
  limit?: number;
  /** Only these videos (search results). The caller re-orders them. */
  ids?: string[];
  /** Plain title/description match: search's fallback when Pinecone is down. */
  textMatch?: string;
}): Promise<VideoCardData[]> {
  const { viewerIsMember, topic, sort = 'newest', limit = 60, ids, textMatch } = options;
  if (ids?.length === 0) return [];
  const db = getDb();
  // Totals are computed per query, never stored. Each table is totalled in its own subquery:
  // joining likes and ratings directly would multiply rows and inflate both counts.
  const likeTotals = db
    .select({ videoId: likes.videoId, likeCount: count().as('like_count') })
    .from(likes)
    .groupBy(likes.videoId)
    .as('like_totals');
  const ratingTotals = db
    .select({
      videoId: ratings.videoId,
      ratingCount: count().as('rating_count'),
      ratingAverage: avg(ratings.stars).as('rating_average'),
    })
    .from(ratings)
    .groupBy(ratings.videoId)
    .as('rating_totals');

  const likeCount = sql<number>`coalesce(${likeTotals.likeCount}, 0)`.mapWith(Number);
  const ratingCount = sql<number>`coalesce(${ratingTotals.ratingCount}, 0)`.mapWith(Number);
  const ratingAverage = sql<number | null>`${ratingTotals.ratingAverage}`.mapWith(Number);
  const sortOrder = {
    newest: [desc(videos.createdAt)],
    liked: [desc(likeCount), desc(videos.createdAt)],
    // Unrated videos go last; ties break on how many people rated, then newest.
    rated: [
      sql`${ratingTotals.ratingAverage} desc nulls last`,
      desc(ratingCount),
      desc(videos.createdAt),
    ],
  }[sort];

  const rows = await db
    .select({
      id: videos.id,
      title: videos.title,
      durationSeconds: videos.durationSeconds,
      createdAt: videos.createdAt,
      visibility: videos.visibility,
      topic: videos.topic,
      thumbnailPath: videos.thumbnailPath,
      likeCount,
      ratingCount,
      ratingAverage,
    })
    .from(videos)
    .leftJoin(likeTotals, eq(likeTotals.videoId, videos.id))
    .leftJoin(ratingTotals, eq(ratingTotals.videoId, videos.id))
    .where(
      and(
        eq(videos.status, 'ready'),
        topic ? eq(videos.topic, topic) : undefined,
        ids ? inArray(videos.id, ids) : undefined,
        textMatch ? matchesText(textMatch) : undefined,
      ),
    )
    .orderBy(...sortOrder)
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
    // mapWith(Number) turns SQL null into 0, so re-check against the count.
    ratingAverage: row.ratingCount > 0 ? row.ratingAverage : null,
    thumbnailUrl: thumbnailPath ? (signedByPath.get(thumbnailPath) ?? null) : null,
    isLocked: isLockedFor(row.visibility, viewerIsMember),
  }));
}

export type TopicCounts = Record<VideoTopic | 'all', number>;

/** Ready videos per topic for the feed tabs. Locked videos count: they show as teasers. */
export async function countReadyVideosByTopic(): Promise<TopicCounts> {
  const rows = await getDb()
    .select({ topic: videos.topic, videoCount: count() })
    .from(videos)
    .where(eq(videos.status, 'ready'))
    .groupBy(videos.topic);

  const counts: TopicCounts = { all: 0, trading: 0, coding: 0, life: 0 };
  for (const row of rows) {
    counts[row.topic] = row.videoCount;
    counts.all += row.videoCount;
  }
  return counts;
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
  const [playbackUrl, poster] = await Promise.all([
    isLocked ? null : videoPlaybackUrl(video, SIGNED_URL_SECONDS),
    video.thumbnailPath
      ? videoStorage().createSignedUrl(video.thumbnailPath, SIGNED_URL_SECONDS)
      : null,
  ]);

  return {
    ...video,
    playbackUrl,
    posterUrl: poster?.data?.signedUrl ?? null,
    isLocked,
  };
}
