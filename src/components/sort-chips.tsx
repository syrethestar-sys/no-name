import Link from 'next/link';
import { activeChipClass, chipClass, idleChipClass } from '@/components/topic-chips';
import { feedHref, FEED_SORTS, type FeedSort } from '@/lib/videos';
import type { VideoTopic } from '@/types/db';

const SORT_LABELS: Record<FeedSort, string> = { newest: 'Newest', liked: 'Most liked' };

export function SortChips({
  activeSort,
  topic,
}: {
  activeSort: FeedSort;
  topic: VideoTopic | null;
}) {
  return (
    <nav className="flex flex-wrap gap-2" aria-label="Sort">
      {FEED_SORTS.map((sort) => (
        <Link
          key={sort}
          href={feedHref({ topic, sort })}
          className={`${chipClass} ${activeSort === sort ? activeChipClass : idleChipClass}`}
        >
          {SORT_LABELS[sort]}
        </Link>
      ))}
    </nav>
  );
}
