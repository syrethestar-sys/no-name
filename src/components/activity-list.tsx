import Link from 'next/link';
import type { ActivityVideo } from '@/lib/activity';
import { formatTimeAgo } from '@/lib/format';

export type ActivityRow = {
  key: string;
  video: ActivityVideo;
  at: Date;
  /** Shown under the title, e.g. the stars or the comment. Hidden for a locked video. */
  detail?: React.ReactNode;
};

/** One titled list of a person's likes, ratings or comments. Locked videos show no title. */
export function ActivityList({
  title,
  emptyText,
  rows,
}: {
  title: string;
  emptyText: string;
  rows: ActivityRow[];
}) {
  return (
    <section>
      <h2 className="font-mono text-xs text-muted-foreground">
        {title} · {rows.length}
      </h2>
      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">{emptyText}</p>
      ) : (
        <ul className="mt-3 flex flex-col gap-2">
          {rows.map((row) => (
            <li key={row.key} className="rounded-lg bg-glass px-4 py-3">
              {row.video.isLocked ? (
                <p className="text-sm text-muted-foreground">Members-only video</p>
              ) : (
                <Link
                  href={`/videos/${row.video.id}`}
                  className="text-sm font-medium hover:text-primary"
                >
                  {row.video.title}
                </Link>
              )}
              {!row.video.isLocked && row.detail && (
                <div className="mt-1 line-clamp-2 text-sm text-muted-foreground">{row.detail}</div>
              )}
              <p className="mt-1 font-mono text-xs text-muted-foreground/70">
                {formatTimeAgo(row.at)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
