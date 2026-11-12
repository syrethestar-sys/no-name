import { PageHeadingSkeleton } from '@/components/page-heading-skeleton';
import { Skeleton } from '@/components/skeleton';
import { VideoGridSkeleton } from '@/components/video-grid-skeleton';

export default function SearchLoading() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-12">
      <PageHeadingSkeleton />
      <Skeleton className="mt-8 h-[52px] max-w-2xl rounded-xl" />
      <div className="mt-8">
        <VideoGridSkeleton count={4} />
      </div>
    </main>
  );
}
