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
