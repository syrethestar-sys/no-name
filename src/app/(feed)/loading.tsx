import { PageHeadingSkeleton } from '@/components/page-heading-skeleton';
import { Skeleton } from '@/components/skeleton';
import { VideoGridSkeleton } from '@/components/video-grid-skeleton';

export default function FeedLoading() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-12">
      <PageHeadingSkeleton />
      <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-b pb-3">
        <Skeleton className="h-8 w-80 max-w-full" />
        <Skeleton className="h-7 w-56" />
      </div>
      <Skeleton className="mt-6 h-72 rounded-xl" />
      <div className="mt-3">
        <VideoGridSkeleton count={4} />
      </div>
    </main>
  );
}
