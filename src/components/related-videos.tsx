import { VideoCard } from '@/components/video-card';
import { findRelatedVideos } from '@/lib/search';

/** "Related videos" under a video. Renders nothing if search is down or there's nothing related. */
export async function RelatedVideos({
  video,
  viewerIsMember,
}: {
  video: { id: string; title: string; description: string; transcript: string | null };
  viewerIsMember: boolean;
}) {
  const related = await findRelatedVideos(video, viewerIsMember).catch((error: unknown) => {
    console.error('related videos failed', error);
    return [];
  });
  if (related.length === 0) return null;

  return (
    <section
      aria-labelledby="related-heading"
      className="mt-10 border-t pt-6 lg:mt-0 lg:border-t-0 lg:pt-0"
    >
      <h2 id="related-heading" className="font-mono text-xs text-muted-foreground">
        Related videos
      </h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
        {related.map((relatedVideo) => (
          <VideoCard key={relatedVideo.id} video={relatedVideo} />
        ))}
      </div>
    </section>
  );
}
