import Link from 'next/link';
import { unstable_rethrow } from 'next/navigation';
import { FilterMenu, type FilterOption } from '@/components/feed-filter';
import { FeaturedVideo } from '@/components/featured-video';
import { PageHeading } from '@/components/page-heading';
import { TvWallHero } from '@/components/tv-wall-hero';
import { Button } from '@/components/ui/button';
import { VideoCard } from '@/components/video-card';
import { getViewer } from '@/lib/auth';
import { SORT_LABELS, TOPIC_LABELS } from '@/lib/labels';
import {
  countReadyVideosByTopic,
  feedHref,
  FEED_SORTS,
  VIDEO_TOPICS,
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
  let showJoin = false;
  try {
    const viewer = await getViewer();
    isOwner = viewer.isOwner;
    showJoin = !viewer.isMember && viewer.memberStatus !== 'pending';
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

  // The first video (newest, or most liked/rated) is shown big; the rest go in the grid.
  const [featuredVideo, ...gridVideos] = videos;
  const eyebrow = (
    <>
      {topicCounts && `${topicCounts.all} ${topicCounts.all === 1 ? 'video' : 'videos'} · `}
      trading, coding, life
    </>
  );
  // The full-screen TV wall opens the plain home page; filtered views stay compact.
  const isFrontPage = topic === null && sort === 'newest';

  const topicOptions: FilterOption[] = [
    {
      value: 'all',
      label: 'All',
      href: feedHref({ topic: null, sort }),
      count: topicCounts?.all,
      isActive: topic === null,
    },
    ...VIDEO_TOPICS.map((value) => ({
      value,
      label: TOPIC_LABELS[value],
      href: feedHref({ topic: value, sort }),
      count: topicCounts?.[value],
      isActive: topic === value,
    })),
  ];
  const sortOptions: FilterOption[] = FEED_SORTS.map((value) => ({
    value,
    label: SORT_LABELS[value],
    href: feedHref({ topic, sort: value }),
    isActive: sort === value,
  }));

  return (
    <main className="mx-auto max-w-7xl px-4 py-12">
      {isFrontPage ? (
        <TvWallHero
          videos={videos}
          eyebrow={eyebrow}
          watchHref={featuredVideo ? `/videos/${featuredVideo.id}` : '#videos'}
          showJoin={showJoin}
        />
      ) : (
        <PageHeading title="Experiences" eyebrow={eyebrow}>
          Work, life, trading and code — shared with people who grow together.
        </PageHeading>
      )}
      <div
        id="videos"
        className="mt-8 flex scroll-mt-24 flex-wrap items-center justify-between gap-3 border-b pb-3"
      >
        <FilterMenu kind="topic" options={topicOptions} />
        <FilterMenu kind="sort" options={sortOptions} />
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

      {featuredVideo && (
        <div className="mt-6">
          <FeaturedVideo video={featuredVideo} label={SORT_LABELS[sort]} />
        </div>
      )}

      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {gridVideos.map((video) => (
          <VideoCard key={video.id} video={video} />
        ))}
      </div>
    </main>
  );
}
