import { Skeleton } from '@/components/skeleton';

export default function VideoLoading() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-8" role="status" aria-label="Loading">
      <Skeleton className="aspect-video rounded-xl" />
      <Skeleton className="mt-6 h-8 w-2/3" />
      <div className="mt-3 flex gap-1.5">
        {['w-20', 'w-16', 'w-24', 'w-12'].map((width) => (
          <Skeleton key={width} className={`h-5 ${width}`} />
        ))}
      </div>
      <Skeleton className="mt-5 h-8 w-64" />
      <Skeleton className="mt-6 h-4 w-full" />
      <Skeleton className="mt-2 h-4 w-5/6" />
    </main>
  );
}
