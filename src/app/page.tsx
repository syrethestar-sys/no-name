import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { VideoCard } from '@/components/video-card';
import { isAdmin } from '@/lib/auth';
import { listReadyVideos, type VideoCardData } from '@/lib/videos';

export default async function HomePage() {
  let videos: VideoCardData[] = [];
  let loadFailed = false;
  try {
    videos = await listReadyVideos();
  } catch (error) {
    console.error('feed failed', error);
    loadFailed = true;
  }
  const isOwner = await isAdmin();

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Experiences</h1>
          <p className="mt-1 text-muted-foreground">Watch, like, rate and talk about them.</p>
        </div>
        <div className="flex gap-2" aria-label="Sort">
          <span className="rounded-full bg-primary/15 px-3 py-1 text-sm text-primary">Newest</span>
        </div>
      </div>

      {loadFailed && (
        <p className="mt-10 text-destructive">Could not load videos. Refresh to try again.</p>
      )}

      {!loadFailed && videos.length === 0 && (
        <div className="mt-10 rounded-xl border border-dashed p-12 text-center">
          <p className="text-muted-foreground">No videos yet.</p>
          {isOwner && (
            <Button className="mt-4" nativeButton={false} render={<Link href="/upload" />}>
              Upload the first one
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
