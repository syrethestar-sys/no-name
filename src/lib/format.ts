/** 75 → "1:15", 3725 → "1:02:05". */
export function formatDuration(totalSeconds: number | null): string | null {
  if (totalSeconds === null) return null;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, '0')}:${seconds}`
    : `${minutes}:${seconds}`;
}

const dateFormatter = new Intl.DateTimeFormat('en', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
});

/** "Nov 12, 2026" */
export function formatDate(date: Date): string {
  return dateFormatter.format(date);
}

/** 4.25 → "4.3" (one decimal); null → "–". */
export function formatRating(average: number | null): string {
  return average === null ? '–' : average.toFixed(1);
}

const relativeTimeFormatter = new Intl.RelativeTimeFormat('en', { numeric: 'always' });
const RELATIVE_UNITS = [
  ['year', 31_536_000],
  ['month', 2_592_000],
  ['week', 604_800],
  ['day', 86_400],
  ['hour', 3_600],
  ['minute', 60],
] as const;

/** "just now", "5 minutes ago", "3 days ago". */
export function formatTimeAgo(date: Date, now: Date = new Date()): string {
  const secondsAgo = Math.max(0, (now.getTime() - date.getTime()) / 1000);
  for (const [unit, unitSeconds] of RELATIVE_UNITS) {
    if (secondsAgo >= unitSeconds) {
      return relativeTimeFormatter.format(-Math.floor(secondsAgo / unitSeconds), unit);
    }
  }
  return 'just now';
}

/** 50_000_000 → "50 MB", 2_000_000_000 → "2 GB" (decimal units, like storage limits). */
export function formatFileSize(bytes: number): string {
  return bytes >= 1e9 ? `${+(bytes / 1e9).toFixed(1)} GB` : `${Math.round(bytes / 1e6)} MB`;
}
