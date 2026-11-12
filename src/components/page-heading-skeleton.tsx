import { Skeleton } from '@/components/skeleton';

/** Placeholder in the shape of `PageHeading` (eyebrow, big title, subline). */
export function PageHeadingSkeleton() {
  return (
    <div role="status" aria-label="Loading">
      <Skeleton className="h-3 w-40" />
      <Skeleton className="mt-3 h-11 w-64" />
      <Skeleton className="mt-3 h-4 w-full max-w-md" />
    </div>
  );
}
