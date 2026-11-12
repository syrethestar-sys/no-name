import Image from 'next/image';
import Link from 'next/link';
import { HeartIcon, LockIcon, StarIcon } from 'lucide-react';
import { formatDate, formatDuration, formatRating } from '@/lib/format';
import { TOPIC_LABELS } from '@/lib/labels';
import type { VideoCardData } from '@/lib/videos';

export function VideoCard({ video }: { video: VideoCardData }) {
  const duration = formatDuration(video.durationSeconds);

  return (
    <Link
      href={`/videos/${video.id}`}
      className="group overflow-hidden rounded-xl border bg-card transition-colors hover:border-primary/50"
    >
      <div className="relative aspect-video overflow-hidden bg-secondary">
        {video.thumbnailUrl ? (
          <Image
            src={video.thumbnailUrl}
            alt=""
            fill
            unoptimized
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className={`object-cover transition-transform duration-300 group-hover:scale-[1.03] ${
              video.isLocked ? 'scale-110 blur-md brightness-50' : ''
            }`}
          />
        ) : (
          <div className="flex h-full items-center justify-center font-mono text-xs text-muted-foreground">
            no thumbnail
          </div>
        )}
        {video.isLocked && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-sm">
            <LockIcon className="size-5 text-primary" aria-hidden />
            <span>Members only</span>
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
        <div className="mt-1 flex items-center justify-between gap-2 text-xs text-muted-foreground">
          <p>
            {TOPIC_LABELS[video.topic]} · {formatDate(video.createdAt)}
            {video.visibility === 'public' && <span className="text-primary"> · Public</span>}
          </p>
          <span className="flex shrink-0 items-center gap-3 font-mono">
            {video.ratingAverage !== null && (
              <span className="flex items-center gap-1">
                <StarIcon className="size-3.5 fill-primary text-primary" aria-hidden />
                <span className="sr-only">Average rating:</span>
                {formatRating(video.ratingAverage)}
              </span>
            )}
            <span className="flex items-center gap-1">
              <HeartIcon className="size-3.5" aria-hidden />
              <span className="sr-only">Likes:</span>
              {video.likeCount}
            </span>
          </span>
        </div>
      </div>
    </Link>
  );
}
