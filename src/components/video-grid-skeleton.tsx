import { Skeleton } from '@/components/skeleton';

/** Placeholder cards in the feed's grid shape, while videos load. */
export function VideoGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="rounded-xl bg-glass p-1.5">
          <Skeleton className="aspect-video rounded-lg" />
          <Skeleton className="mt-3 ml-1.5 h-4 w-3/4" />
          <Skeleton className="mt-2 mb-1.5 ml-1.5 h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}
