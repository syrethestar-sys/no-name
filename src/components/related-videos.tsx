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
    <section aria-labelledby="related-heading" className="mt-10 border-t pt-6">
      <h2 id="related-heading" className="text-lg font-semibold">
        Related videos
      </h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {related.map((relatedVideo) => (
          <VideoCard key={relatedVideo.id} video={relatedVideo} />
        ))}
      </div>
    </section>
  );
}
