/** Grey pulsing placeholder; give it a size and shape with `className`. */
export function Skeleton({ className = '' }: { className?: string }) {
  return <div aria-hidden className={`animate-pulse rounded-md bg-glass-hover ${className}`} />;
}
