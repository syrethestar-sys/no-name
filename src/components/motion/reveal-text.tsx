'use client';

import { useEffect, useRef } from 'react';
import {
  springConfigs,
  stepSpring,
  type SpringConfig,
  type SpringState,
} from '@/lib/motion/spring';
import { splitText } from '@/lib/motion/split-text';
import { subscribe } from '@/lib/motion/ticker';
import { useInView } from '@/lib/motion/use-in-view';

type Props = {
  text: string;
  /** Animate whole words or single letters. */
  by?: 'words' | 'letters';
  /** Ms between one unit starting and the next. */
  stagger?: number;
  /** Ms before the first unit starts. */
  delayIn?: number;
  config?: SpringConfig;
  /**
   * `once` plays in the first time it is on screen and stays. `always` plays in on screen and back
   * out when it leaves.
   */
  mode?: 'once' | 'always';
  /** Hold back until something else is ready (the loading veil). */
  enabled?: boolean;
  rootMargin?: string;
  /** How far below its place a unit starts, in em. */
  offset?: number;
  /** Space between words, in em. */
  columnGap?: number;
  className?: string;
};

/** Opacity and position are springs; this is how close to the end counts as arrived. */
const PRECISION = 0.001;

const paint = (unit: HTMLElement, value: number, offset: number) => {
  unit.style.opacity = String(Math.min(1, Math.max(0, value)));
  unit.style.transform = `translateY(${(1 - value) * offset}em)`;
};

/**
 * Text that assembles word by word or letter by letter. Every unit is its own spring, all driven
 * from one subscription to the shared ticker and written straight to the DOM (no React render per
 * frame). A visually hidden copy of the plain text is what assistive technology reads. No overflow
 * clip: the display fonts' tight line height would shave descenders.
 */
export function RevealText({
  text,
  by = 'words',
  stagger = by === 'words' ? 110 : 26,
  delayIn = 0,
  config = springConfigs.reveal,
  mode = 'once',
  enabled = true,
  rootMargin = '0px',
  offset = by === 'words' ? 0.35 : 0.3,
  columnGap = 0.3,
  className = '',
}: Props) {
  const rootRef = useRef<HTMLSpanElement>(null);
  const springs = useRef<SpringState[]>([]);
  const inView = useInView(rootRef, { once: mode === 'once', rootMargin });
  const active = enabled && inView;

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (!active && mode === 'once') return; // not played yet: stay hidden

    const units = Array.from(root.querySelectorAll<HTMLElement>('[data-unit]'));
    const target = active ? 1 : 0;
    if (springs.current.length !== units.length) {
      springs.current = units.map(() => ({ value: 0, velocity: 0 }));
    }

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      units.forEach((unit, index) => {
        springs.current[index] = { value: target, velocity: 0 };
        paint(unit, target, offset);
      });
      return;
    }

    let startedAt: number | null = null;
    let lastTime = 0;
    const stop = subscribe((time) => {
      startedAt ??= time;
      const elapsed = time - startedAt;
      const frameMs = lastTime ? time - lastTime : 0;
      lastTime = time;

      let moving = false;
      units.forEach((unit, index) => {
        // Going out is not staggered: the whole line leaves together.
        const delay = active ? delayIn + index * stagger : 0;
        if (elapsed < delay) {
          moving = true;
          return;
        }
        const step = stepSpring(springs.current[index], target, config, frameMs, PRECISION);
        springs.current[index] = step.state;
        paint(unit, step.state.value, offset);
        if (!step.atRest) moving = true;
      });
      if (!moving) stop();
    });
    return stop;
  }, [active, mode, delayIn, stagger, config, offset]);

  const hidden = { opacity: 0, transform: `translateY(${offset}em)` };

  return (
    <span
      ref={rootRef}
      className={`flex flex-wrap ${className}`}
      style={{ columnGap: `${columnGap}em` }}
    >
      <span className="sr-only">{text}</span>
      {splitText(text).map(({ word, letters }, wordIndex) =>
        by === 'words' ? (
          <span key={wordIndex} data-unit aria-hidden className="inline-block" style={hidden}>
            {word}
          </span>
        ) : (
          <span key={wordIndex} aria-hidden className="inline-flex whitespace-nowrap">
            {letters.map((letter, letterIndex) => (
              <span key={letterIndex} data-unit className="inline-block" style={hidden}>
                {letter}
              </span>
            ))}
          </span>
        ),
      )}
    </span>
  );
}
