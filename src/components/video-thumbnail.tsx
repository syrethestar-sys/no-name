import Image from 'next/image';
import { LockIcon } from 'lucide-react';
import { formatDuration } from '@/lib/format';
import type { VideoCardData } from '@/lib/videos';

/**
 * 16:9 thumbnail with the length in the corner; members-only ones are blurred behind a lock.
 * Zooms slightly when its parent `group` is hovered.
 */
export function VideoThumbnail({
  video,
  sizes,
}: {
  video: Pick<VideoCardData, 'thumbnailUrl' | 'isLocked' | 'durationSeconds'>;
  /** The `sizes` hint for the image, matching how wide the thumbnail is shown. */
  sizes: string;
}) {
  const duration = formatDuration(video.durationSeconds);

  return (
    <div className="relative aspect-video overflow-hidden rounded-lg bg-thumb">
      {video.thumbnailUrl ? (
        <Image
          src={video.thumbnailUrl}
          alt=""
          fill
          unoptimized
          sizes={sizes}
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
      {/* Old-TV scanlines come on when the card is pointed at. */}
      <div className="scanlines absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      {duration && (
        <span className="absolute right-2 bottom-2 rounded-md bg-black/75 px-1.5 py-0.5 font-mono text-xs">
          {duration}
        </span>
      )}
    </div>
  );
}
