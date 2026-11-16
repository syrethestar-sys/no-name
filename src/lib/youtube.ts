// Videos can live on YouTube as "Unlisted" (link only). We keep just the 11-character video id.

const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;
const YOUTUBE_HOSTS = new Set([
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'music.youtube.com',
  'youtube-nocookie.com',
  'www.youtube-nocookie.com',
]);
// `/shorts/<id>`, `/embed/<id>`, `/live/<id>` and `/v/<id>` carry the id in the path.
const PATH_PREFIXES_WITH_ID = new Set(['shorts', 'embed', 'live', 'v']);

/** The video id from a pasted YouTube link (or a bare id), or null when it isn't one. */
export function parseYoutubeId(input: string): string | null {
  const text = input.trim();
  if (YOUTUBE_ID.test(text)) return text;

  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(text) ? text : `https://${text}`);
  } catch {
    return null;
  }

  let candidate: string | undefined;
  if (url.hostname === 'youtu.be') {
    candidate = url.pathname.split('/')[1];
  } else if (YOUTUBE_HOSTS.has(url.hostname)) {
    const [first, second] = url.pathname.split('/').filter(Boolean);
    if (first === 'watch') candidate = url.searchParams.get('v') ?? undefined;
    else if (first && PATH_PREFIXES_WITH_ID.has(first)) candidate = second;
  }
  return candidate && YOUTUBE_ID.test(candidate) ? candidate : null;
}

/** Privacy-friendly embed (no cookies until play); `rel=0` limits suggestions to the same channel. */
export function youtubeEmbedUrl(youtubeId: string): string {
  return `https://www.youtube-nocookie.com/embed/${youtubeId}?rel=0&playsinline=1`;
}
