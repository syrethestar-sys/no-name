import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { DeleteVideoButton } from '@/components/delete-video-button';
import { isAdmin } from '@/lib/auth';
import { formatDate, formatDuration } from '@/lib/format';
import { getVideoForPlayback } from '@/lib/videos';

type VideoPageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: VideoPageProps): Promise<Metadata> {
  const { id } = await params;
  const video = await getVideoForPlayback(id).catch(() => null);
  return { title: video ? `${video.title} · Experience Community` : 'Video not found' };
}

export default async function VideoPage({ params }: VideoPageProps) {
  const { id } = await params;
  const video = await getVideoForPlayback(id);
  if (!video) notFound();

  const isOwner = await isAdmin();
  const duration = formatDuration(video.durationSeconds);

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <div className="overflow-hidden rounded-xl border bg-black">
        <video
          src={video.playbackUrl}
          poster={video.posterUrl ?? undefined}
          controls
          playsInline
          preload="metadata"
          className="aspect-video w-full"
        />
      </div>

      <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{video.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {formatDate(video.createdAt)}
            {duration && ` · ${duration}`}
          </p>
        </div>
        {isOwner && <DeleteVideoButton videoId={video.id} />}
      </div>

      {video.description && (
        <p className="mt-5 whitespace-pre-line leading-relaxed text-foreground/90">
          {video.description}
        </p>
      )}
    </main>
  );
}
