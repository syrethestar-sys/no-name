import 'server-only';

export type YoutubeCheck = 'ok' | 'unavailable' | 'unknown';

// YouTube's public oEmbed answers 200 for a video that exists and may be embedded
// (Unlisted included), and 401/403/404 for one that is private, missing or not embeddable.
const UNAVAILABLE_STATUSES = new Set([401, 403, 404]);

/** Asks YouTube whether this video can be shown. A network failure is "unknown", never a block. */
export async function checkYoutubeVideo(youtubeId: string): Promise<YoutubeCheck> {
  const videoUrl = `https://www.youtube.com/watch?v=${youtubeId}`;
  try {
    const response = await fetch(
      `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(videoUrl)}`,
      { signal: AbortSignal.timeout(5000) },
    );
    if (response.ok) return 'ok';
    return UNAVAILABLE_STATUSES.has(response.status) ? 'unavailable' : 'unknown';
  } catch {
    return 'unknown';
  }
}
