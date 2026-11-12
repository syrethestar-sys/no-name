import Image from 'next/image';
import Link from 'next/link';
import { formatDate, formatDuration } from '@/lib/format';
import type { VideoCardData } from '@/lib/videos';

export function VideoCard({ video }: { video: VideoCardData }) {
  const duration = formatDuration(video.durationSeconds);

  return (
    <Link
      href={`/videos/${video.id}`}
      className="group overflow-hidden rounded-xl border bg-card transition-colors hover:border-primary/50"
    >
      <div className="relative aspect-video bg-secondary">
        {video.thumbnailUrl ? (
          <Image
            src={video.thumbnailUrl}
            alt=""
            fill
            unoptimized
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-center justify-center font-mono text-xs text-muted-foreground">
            no thumbnail
          </div>
        )}
        {duration && (
          <span className="absolute right-2 bottom-2 rounded-md bg-black/75 px-1.5 py-0.5 font-mono text-xs">
            {duration}
          </span>
        )}
      </div>
      <div className="p-3">
        <h2 className="line-clamp-2 font-medium leading-snug">{video.title}</h2>
        <p className="mt-1 text-xs text-muted-foreground">{formatDate(video.createdAt)}</p>
      </div>
    </Link>
  );
}
