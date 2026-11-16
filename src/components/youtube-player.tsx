import { youtubeEmbedUrl } from '@/lib/youtube';

/** YouTube player for an Unlisted video. Only rendered for viewers who may watch it. */
export function YoutubePlayer({ youtubeId, title }: { youtubeId: string; title: string }) {
  return (
    <iframe
      src={youtubeEmbedUrl(youtubeId)}
      title={title}
      loading="lazy"
      allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen"
      allowFullScreen
      // YouTube refuses to play embeds that send no referrer.
      referrerPolicy="strict-origin-when-cross-origin"
      className="aspect-video w-full border-0"
    />
  );
}
