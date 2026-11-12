import 'server-only';
import { desc, eq } from 'drizzle-orm';
import { getDb } from '@/db';
import { videos } from '@/db/schema';
import { SIGNED_URL_SECONDS, videoStorage } from '@/lib/supabase';
import type { Video } from '@/types/db';

export type VideoCardData = Pick<Video, 'id' | 'title' | 'durationSeconds' | 'createdAt'> & {
  thumbnailUrl: string | null;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isVideoId = (value: string) => UUID.test(value);

/** Newest ready videos with signed thumbnail URLs (one Storage call for all of them). */
export async function listReadyVideos(limit = 60): Promise<VideoCardData[]> {
  const rows = await getDb()
    .select({
      id: videos.id,
      title: videos.title,
      durationSeconds: videos.durationSeconds,
      createdAt: videos.createdAt,
      thumbnailPath: videos.thumbnailPath,
    })
    .from(videos)
    .where(eq(videos.status, 'ready'))
    .orderBy(desc(videos.createdAt))
    .limit(limit);

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
  }));
}

export type VideoWithPlayback = Video & { playbackUrl: string; posterUrl: string | null };

/** One ready video with signed playback + poster URLs, or null when it doesn't exist. */
export async function getVideoForPlayback(id: string): Promise<VideoWithPlayback | null> {
  if (!isVideoId(id)) return null;

  const [video] = await getDb().select().from(videos).where(eq(videos.id, id)).limit(1);
  if (!video || video.status !== 'ready') return null;

  const storage = videoStorage();
  const [playback, poster] = await Promise.all([
    storage.createSignedUrl(video.storagePath, SIGNED_URL_SECONDS),
    video.thumbnailPath ? storage.createSignedUrl(video.thumbnailPath, SIGNED_URL_SECONDS) : null,
  ]);
  if (playback.error) throw playback.error;

  return {
    ...video,
    playbackUrl: playback.data.signedUrl,
    posterUrl: poster?.data?.signedUrl ?? null,
  };
}
