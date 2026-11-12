import Link from 'next/link';
import { TOPIC_LABELS } from '@/lib/labels';
import { feedHref, VIDEO_TOPICS, type FeedSort } from '@/lib/videos';
import type { VideoTopic } from '@/types/db';

export const chipClass = 'rounded-full px-3 py-1 text-sm transition-colors';
export const activeChipClass = 'bg-primary/15 text-primary';
export const idleChipClass = 'bg-secondary text-muted-foreground hover:text-foreground';

export function TopicChips({
  activeTopic,
  sort,
}: {
  activeTopic: VideoTopic | null;
  sort: FeedSort;
}) {
  return (
    <nav className="flex flex-wrap gap-2" aria-label="Topic">
      <Link
        href={feedHref({ topic: null, sort })}
        className={`${chipClass} ${activeTopic ? idleChipClass : activeChipClass}`}
      >
        All
      </Link>
      {VIDEO_TOPICS.map((topic) => (
        <Link
          key={topic}
          href={feedHref({ topic, sort })}
          className={`${chipClass} ${activeTopic === topic ? activeChipClass : idleChipClass}`}
        >
          {TOPIC_LABELS[topic]}
        </Link>
      ))}
    </nav>
  );
}
