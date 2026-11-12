import Link from 'next/link';
import { unstable_rethrow } from 'next/navigation';
import { SortChips } from '@/components/sort-chips';
import { TopicChips } from '@/components/topic-chips';
import { Button } from '@/components/ui/button';
import { VideoCard } from '@/components/video-card';
import { getViewer } from '@/lib/auth';
import { isFeedSort, isVideoTopic, listReadyVideos, type VideoCardData } from '@/lib/videos';

type HomePageProps = { searchParams: Promise<{ topic?: string; sort?: string }> };

export default async function HomePage({ searchParams }: HomePageProps) {
  const { topic: topicParam, sort: sortParam } = await searchParams;
  const topic = isVideoTopic(topicParam) ? topicParam : null;
  const sort = isFeedSort(sortParam) ? sortParam : 'newest';

  let videos: VideoCardData[] = [];
  let loadFailed = false;
  let isOwner = false;
  try {
    const viewer = await getViewer();
    isOwner = viewer.isOwner;
    videos = await listReadyVideos({
      viewerIsMember: viewer.isMember,
      topic: topic ?? undefined,
      sort,
    });
  } catch (error) {
    unstable_rethrow(error); // let Next's own signals (dynamic rendering, redirects) through
    console.error('feed failed', error);
    loadFailed = true;
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Experiences</h1>
          <p className="mt-1 text-muted-foreground">
            Work, life, trading and code — shared with people who grow together.
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <TopicChips activeTopic={topic} sort={sort} />
          <SortChips activeSort={sort} topic={topic} />
        </div>
      </div>

      {loadFailed && (
        <p className="mt-10 text-destructive">Could not load videos. Refresh to try again.</p>
      )}

      {!loadFailed && videos.length === 0 && (
        <div className="mt-10 rounded-xl border border-dashed p-12 text-center">
          <p className="text-muted-foreground">
            {topic ? 'No videos on this topic yet.' : 'No videos yet.'}
          </p>
          {isOwner && (
            <Button className="mt-4" nativeButton={false} render={<Link href="/upload" />}>
              Upload a video
            </Button>
          )}
        </div>
      )}

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {videos.map((video) => (
          <VideoCard key={video.id} video={video} />
        ))}
      </div>
    </main>
  );
}
