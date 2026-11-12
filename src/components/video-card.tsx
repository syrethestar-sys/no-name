import Link from 'next/link';
import { ArrowUpRightIcon, HeartIcon, StarIcon } from 'lucide-react';
import { VideoThumbnail } from '@/components/video-thumbnail';
import { formatDate, formatRating } from '@/lib/format';
import { TOPIC_LABELS } from '@/lib/labels';
import type { VideoCardData } from '@/lib/videos';

/** Borderless glass card: inset thumbnail, then title row and a quiet meta line (getlayers-style). */
export function VideoCard({ video }: { video: VideoCardData }) {
  const isPublic = video.visibility === 'public';

  return (
    <Link
      href={`/videos/${video.id}`}
      data-glow
      className="group glow-edge flex flex-col rounded-xl bg-glass p-1.5 transition duration-200 hover:-translate-y-0.5 hover:bg-glass-hover hover:shadow-[0_8px_32px_-12px_color-mix(in_oklab,var(--primary)_40%,transparent)] focus-visible:outline-2"
    >
      <VideoThumbnail
        video={video}
        sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
      />
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
