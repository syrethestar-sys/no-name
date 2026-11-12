'use client';

import { useEffect, useState } from 'react';

const pad = (value: number) => String(value).padStart(2, '0');

/** "00 : 04 : 39" */
function formatTimecode(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  return `${pad(hours)} : ${pad(minutes)} : ${pad(totalSeconds % 60)}`;
}

/** Live frames per second, sampled every half second. Null for reduced motion. */
function useFramesPerSecond(): number | null {
  const [framesPerSecond, setFramesPerSecond] = useState<number | null>(null);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let frameCount = 0;
    let windowStart = performance.now();
    let frameRequest = requestAnimationFrame(function countFrame(now) {
      frameCount += 1;
      if (now - windowStart >= 500) {
        setFramesPerSecond(Math.round((frameCount * 1000) / (now - windowStart)));
        frameCount = 0;
        windowStart = now;
      }
      frameRequest = requestAnimationFrame(countFrame);
    });
    return () => cancelAnimationFrame(frameRequest);
  }, []);
  return framesPerSecond;
}

/** Seconds since the page opened, plus today's date. Both null until mounted (no SSR mismatch). */
function useClock(): { seconds: number | null; date: Date | null } {
  const [clock, setClock] = useState<{ seconds: number | null; date: Date | null }>({
    seconds: null,
    date: null,
  });
  useEffect(() => {
    const openedAt = Date.now();
    const tick = () =>
      setClock({ seconds: Math.floor((Date.now() - openedAt) / 1000), date: new Date() });
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, []);
  return clock;
}

const labelClass =
  'absolute bg-background px-2 font-mono text-[0.6875rem] tracking-wider text-foreground/80';

/**
 * Camcorder viewfinder around the whole screen: a thin rounded frame with fps / REC on the top
 * edge and the date / running timecode on the bottom edge. Decoration only.
 */
export function ViewfinderFrame() {
  const framesPerSecond = useFramesPerSecond();
  const { seconds, date } = useClock();

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-1.5 z-40 rounded-[10px] border border-foreground/45 sm:inset-3.5 sm:rounded-[14px]"
    >
      {framesPerSecond !== null && (
        <span className={`${labelClass} top-0 left-5 hidden -translate-y-1/2 sm:block`}>
          {framesPerSecond} fps
        </span>
      )}
      <span className={`${labelClass} top-0 right-5 flex -translate-y-1/2 items-center gap-1.5`}>
        <span className="size-1.5 animate-pulse rounded-full bg-rec motion-reduce:animate-none" />
        REC
      </span>
      {date && (
        <span className={`${labelClass} bottom-0 left-5 hidden translate-y-1/2 sm:block`}>
          [ {pad(date.getDate())} / {pad(date.getMonth() + 1)} / {pad(date.getFullYear() % 100)} ]
        </span>
      )}
      {seconds !== null && (
        <span className={`${labelClass} right-5 bottom-0 translate-y-1/2`}>
          [ {formatTimecode(seconds)} ]
        </span>
      )}
    </div>
  );
}
