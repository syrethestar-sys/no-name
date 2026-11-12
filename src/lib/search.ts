import 'server-only';
import { searchDocuments } from '@/lib/pinecone';
import { listReadyVideos, type VideoCardData } from '@/lib/videos';

// multilingual-e5-large scores sit close together (measured 2026-11-12): the right video
// scores ~0.83–0.85, its translation (Mongolian ↔ English) ~0.79–0.82, unrelated ~0.72–0.78.
// So keep what's near the best match. A nonsense query still returns its closest few videos.
const MIN_SCORE = 0.77;
const MAX_GAP_FROM_BEST = 0.05;
const SNIPPET_LENGTH = 180;

export type SearchResult = VideoCardData & {
  /** Matching transcript text. null for locked videos, so their transcripts never leak. */
  snippet: string | null;
};
export type SearchOutcome = { results: SearchResult[]; isFallback: boolean };

function toSnippet(text: string): string {
  return text.length > SNIPPET_LENGTH ? `${text.slice(0, SNIPPET_LENGTH).trimEnd()}…` : text;
}

/** Search by meaning; falls back to a plain title/description match if Pinecone fails. */
export async function searchVideos(query: string, viewerIsMember: boolean): Promise<SearchOutcome> {
  let matches;
  try {
    matches = await searchDocuments(query, 30);
  } catch (error) {
    console.error('semantic search failed, using text match', error);
    const results = await listReadyVideos({ viewerIsMember, textMatch: query, limit: 24 });
    return { results: results.map((video) => ({ ...video, snippet: null })), isFallback: true };
  }

  const bestScore = matches[0]?.score ?? 0;
  const bestByVideo = new Map<string, { score: number; snippet: string | null }>();
  for (const match of matches) {
    if (match.score < MIN_SCORE || match.score < bestScore - MAX_GAP_FROM_BEST) break;
    if (bestByVideo.has(match.videoId)) continue; // matches come best first
    // `#meta` is the title + description, which the card already shows.
    const isTranscript = !match.id.endsWith('#meta');
    bestByVideo.set(match.videoId, {
      score: match.score,
      snippet: isTranscript ? toSnippet(match.text) : null,
    });
  }

  // The DB decides what exists and is ready; documents of deleted videos simply drop out.
  const videos = await listReadyVideos({ viewerIsMember, ids: [...bestByVideo.keys()] });
  const scoreOf = (video: VideoCardData) => bestByVideo.get(video.id)?.score ?? 0;
  const results = videos
    .sort((first, second) => scoreOf(second) - scoreOf(first))
    .map((video) => ({
      ...video,
      snippet: video.isLocked ? null : (bestByVideo.get(video.id)?.snippet ?? null),
    }));
  return { results, isFallback: false };
}

/** Other videos closest in meaning to this one (title, description, start of transcript). */
export async function findRelatedVideos(
  video: Pick<VideoCardData, 'id' | 'title'> & { description: string; transcript: string | null },
  viewerIsMember: boolean,
  count = 4,
): Promise<VideoCardData[]> {
  const transcriptStart = (video.transcript ?? '').split(/\s+/).slice(0, 120).join(' ');
  const queryText = [video.title, video.description, transcriptStart].filter(Boolean).join('\n');
  const matches = await searchDocuments(queryText, 20);

  const relatedIds: string[] = [];
  for (const match of matches) {
    if (match.videoId === video.id || relatedIds.includes(match.videoId)) continue;
    relatedIds.push(match.videoId);
  }
  const videos = await listReadyVideos({ viewerIsMember, ids: relatedIds });
  return videos
    .sort((first, second) => relatedIds.indexOf(first.id) - relatedIds.indexOf(second.id))
    .slice(0, count);
}
