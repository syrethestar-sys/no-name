import Link from 'next/link';
import { feedHref, FEED_SORTS, type FeedSort } from '@/lib/videos';
import type { VideoTopic } from '@/types/db';

const SORT_LABELS: Record<FeedSort, string> = {
  newest: 'Newest',
  liked: 'Most liked',
  rated: 'Top rated',
};

const chipClass =
  'flex h-7 items-center rounded-[10px] px-2.5 text-xs shadow-[inset_0_1px_0_var(--glass-edge)] transition-colors';
const activeChipClass = 'bg-primary/15 text-primary';
const idleChipClass = 'bg-glass text-muted-foreground hover:bg-glass-hover hover:text-foreground';

export function SortChips({
  activeSort,
  topic,
}: {
  activeSort: FeedSort;
  topic: VideoTopic | null;
}) {
  return (
    <nav className="flex flex-wrap items-center gap-1.5" aria-label="Sort">
      {FEED_SORTS.map((sort) => (
        <Link
          key={sort}
          href={feedHref({ topic, sort })}
          aria-current={activeSort === sort ? 'page' : undefined}
          className={`${chipClass} ${activeSort === sort ? activeChipClass : idleChipClass}`}
        >
          {SORT_LABELS[sort]}
        </Link>
      ))}
    </nav>
  );
}
