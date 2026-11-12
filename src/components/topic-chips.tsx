import Link from 'next/link';
import { TOPIC_LABELS } from '@/lib/labels';
import { feedHref, VIDEO_TOPICS, type FeedSort, type TopicCounts } from '@/lib/videos';
import type { VideoTopic } from '@/types/db';

const tabClass = 'flex h-8 items-center gap-1.5 rounded-md px-3.5 text-sm transition-colors';
const activeTabClass = 'bg-glass-hover text-foreground';
const idleTabClass = 'text-muted-foreground hover:text-foreground';

function TopicTab({
  href,
  label,
  count,
  isActive,
}: {
  href: string;
  label: string;
  count: number | undefined;
  isActive: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={isActive ? 'page' : undefined}
      className={`${tabClass} ${isActive ? activeTabClass : idleTabClass}`}
    >
      {label}
      {count !== undefined && (
        <span className="font-mono text-xs text-muted-foreground">{count}</span>
      )}
    </Link>
  );
}

/** Topic tabs with video counts (counts are left out if they failed to load). */
export function TopicChips({
  activeTopic,
  sort,
  counts,
}: {
  activeTopic: VideoTopic | null;
  sort: FeedSort;
  counts: TopicCounts | null;
}) {
  return (
    <nav className="flex flex-wrap gap-1" aria-label="Topic">
      <TopicTab
        href={feedHref({ topic: null, sort })}
        label="All"
        count={counts?.all}
        isActive={activeTopic === null}
      />
      {VIDEO_TOPICS.map((topic) => (
        <TopicTab
          key={topic}
          href={feedHref({ topic, sort })}
          label={TOPIC_LABELS[topic]}
          count={counts?.[topic]}
          isActive={activeTopic === topic}
        />
      ))}
    </nav>
  );
}
