import Link from 'next/link';
import { TOPIC_LABELS } from '@/lib/labels';
import { VIDEO_TOPICS } from '@/lib/videos';
import type { VideoTopic } from '@/types/db';

const chipClass = 'rounded-full px-3 py-1 text-sm transition-colors';
const activeClass = 'bg-primary/15 text-primary';
const idleClass = 'bg-secondary text-muted-foreground hover:text-foreground';

export function TopicChips({ activeTopic }: { activeTopic: VideoTopic | null }) {
  return (
    <nav className="flex flex-wrap gap-2" aria-label="Topic">
      <Link href="/" className={`${chipClass} ${activeTopic ? idleClass : activeClass}`}>
        All
      </Link>
      {VIDEO_TOPICS.map((topic) => (
        <Link
          key={topic}
          href={`/?topic=${topic}`}
          className={`${chipClass} ${activeTopic === topic ? activeClass : idleClass}`}
        >
          {TOPIC_LABELS[topic]}
        </Link>
      ))}
    </nav>
  );
}
