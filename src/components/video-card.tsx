import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRightIcon, HeartIcon, LockIcon, StarIcon } from 'lucide-react';
import { formatDate, formatDuration, formatRating } from '@/lib/format';
import { TOPIC_LABELS } from '@/lib/labels';
import type { VideoCardData } from '@/lib/videos';

/** Borderless glass card: inset thumbnail, then title row and a quiet meta line (getlayers-style). */
export function VideoCard({ video }: { video: VideoCardData }) {
  const duration = formatDuration(video.durationSeconds);
  const isPublic = video.visibility === 'public';

  return (
    <Link
      href={`/videos/${video.id}`}
      data-glow
      className="group glow-edge flex flex-col rounded-xl bg-glass p-1.5 transition duration-200 hover:-translate-y-0.5 hover:bg-glass-hover hover:shadow-[0_8px_32px_-12px_color-mix(in_oklab,var(--primary)_40%,transparent)] focus-visible:outline-2"
    >
      <div className="relative aspect-video overflow-hidden rounded-lg bg-thumb">
        {video.thumbnailUrl ? (
          <Image
            src={video.thumbnailUrl}
            alt=""
            fill
            unoptimized
            sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
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
      <div className="flex flex-1 flex-col gap-1 px-1.5 pt-2.5 pb-1.5">
        <div className="flex items-start gap-1.5">
          <ArrowUpRightIcon
            className="mt-0.5 size-3.5 shrink-0 text-muted-foreground transition-colors group-hover:text-primary"
            aria-hidden
          />
          <h2 className="line-clamp-2 flex-1 text-sm font-medium leading-snug">{video.title}</h2>
          <span
            className={`shrink-0 rounded-md px-1.5 py-0.5 text-[0.6875rem] leading-none ${
              isPublic ? 'bg-primary/15 text-primary' : 'bg-secondary text-muted-foreground'
            }`}
          >
            {isPublic ? 'Public' : 'Members'}
          </span>
        </div>
        <div className="mt-auto flex items-center justify-between gap-2 pl-5 text-xs text-muted-foreground">
          <p className="truncate">
            {TOPIC_LABELS[video.topic]} · {formatDate(video.createdAt)}
          </p>
          <span className="flex shrink-0 items-center gap-2.5 font-mono">
            {video.ratingAverage !== null && (
              <span className="flex items-center gap-1">
                <StarIcon className="size-3 fill-primary text-primary" aria-hidden />
                <span className="sr-only">Average rating:</span>
                {formatRating(video.ratingAverage)}
              </span>
            )}
            <span className="flex items-center gap-1">
              <HeartIcon className="size-3" aria-hidden />
              <span className="sr-only">Likes:</span>
              {video.likeCount}
            </span>
          </span>
        </div>
      </div>
    </Link>
  );
}
