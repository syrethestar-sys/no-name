import Link from 'next/link';
import { HeartIcon, StarIcon } from 'lucide-react';
import { VideoThumbnail } from '@/components/video-thumbnail';
import { Button } from '@/components/ui/button';
import { formatDate, formatRating } from '@/lib/format';
import { TOPIC_LABELS } from '@/lib/labels';
import type { VideoCardData } from '@/lib/videos';

/** The first video of the feed, shown big above the grid. */
export function FeaturedVideo({ video, label }: { video: VideoCardData; label: string }) {
  const href = `/videos/${video.id}`;

  return (
    <article
      data-glow
      className="group glow-edge glass-panel grid gap-5 p-2 md:grid-cols-[3fr_2fr] md:items-center"
    >
      <Link href={href} tabIndex={-1} aria-hidden>
        <VideoThumbnail video={video} sizes="(min-width: 768px) 60vw, 100vw" />
      </Link>
      <div className="flex flex-col gap-3 px-3 pb-4 md:py-4 md:pr-6 md:pl-1">
        <p className="font-mono text-xs text-primary">{label}</p>
        <h2 className="text-2xl font-light tracking-tight sm:text-3xl">
          <Link href={href} className="hover:text-primary">
            {video.title}
          </Link>
        </h2>
        <p className="text-sm text-muted-foreground">
          {TOPIC_LABELS[video.topic]} · {formatDate(video.createdAt)}
          {video.visibility === 'members' && ' · Members only'}
        </p>
        <p className="flex items-center gap-4 font-mono text-sm text-muted-foreground">
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
        </p>
        <Button className="mt-2 w-fit" nativeButton={false} render={<Link href={href} />}>
          {video.isLocked ? 'See what it is about' : 'Watch'}
        </Button>
      </div>
    </article>
  );
}
