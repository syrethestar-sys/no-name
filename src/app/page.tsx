import Link from 'next/link';
import { unstable_rethrow } from 'next/navigation';
import { SortChips } from '@/components/sort-chips';
import { TopicChips } from '@/components/topic-chips';
import { PageHeading } from '@/components/page-heading';
import { Button } from '@/components/ui/button';
import { VideoCard } from '@/components/video-card';
import { getViewer } from '@/lib/auth';
import {
  countReadyVideosByTopic,
  isFeedSort,
  isVideoTopic,
  listReadyVideos,
  type TopicCounts,
  type VideoCardData,
} from '@/lib/videos';

type HomePageProps = { searchParams: Promise<{ topic?: string; sort?: string }> };

export default async function HomePage({ searchParams }: HomePageProps) {
  const { topic: topicParam, sort: sortParam } = await searchParams;
  const topic = isVideoTopic(topicParam) ? topicParam : null;
  const sort = isFeedSort(sortParam) ? sortParam : 'newest';

  let videos: VideoCardData[] = [];
  let topicCounts: TopicCounts | null = null;
  let loadFailed = false;
  let isOwner = false;
  try {
    const viewer = await getViewer();
    isOwner = viewer.isOwner;
    [videos, topicCounts] = await Promise.all([
      listReadyVideos({ viewerIsMember: viewer.isMember, topic: topic ?? undefined, sort }),
      // Counts are extras: the feed still shows if they fail.
      countReadyVideosByTopic().catch((error: unknown) => {
        console.error('topic counts failed', error);
        return null;
      }),
    ]);
  } catch (error) {
    unstable_rethrow(error); // let Next's own signals (dynamic rendering, redirects) through
    console.error('feed failed', error);
    loadFailed = true;
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-12">
      <PageHeading
        title="Experiences"
        eyebrow={
          <>
            {topicCounts && `${topicCounts.all} ${topicCounts.all === 1 ? 'video' : 'videos'} · `}
            trading, coding, life
          </>
        }
      >
        Work, life, trading and code — shared with people who grow together.
      </PageHeading>
      <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-b pb-3">
        <TopicChips activeTopic={topic} sort={sort} counts={topicCounts} />
        <SortChips activeSort={sort} topic={topic} />
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

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {videos.map((video) => (
          <VideoCard key={video.id} video={video} />
        ))}
      </div>
    </main>
  );
}
