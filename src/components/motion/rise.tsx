'use client';

import { useEffect, useRef, type ComponentPropsWithoutRef } from 'react';
import { springConfigs, stepSpring, type SpringConfig } from '@/lib/motion/spring';
import { subscribe } from '@/lib/motion/ticker';
import { useInView } from '@/lib/motion/use-in-view';

type Props = ComponentPropsWithoutRef<'div'> & {
  /** Ms to wait once it is allowed to play. */
  delayIn?: number;
  config?: SpringConfig;
  /** How far below its place it starts. 0 makes it a plain fade. */
  offset?: number;
  unit?: 'rem' | 'em' | 'px';
  /** Hold back until something else is ready (the loading veil). */
  enabled?: boolean;
  /** Also wait for the element to come on screen. */
  whenInView?: boolean;
  rootMargin?: string;
};

/** Fade and rise into place once, as a spring. Plays once and stays. */
export function Rise({
  delayIn = 0,
  config = springConfigs.reveal,
  offset = 0.75,
  unit = 'rem',
  enabled = true,
  whenInView = false,
  rootMargin = '0px',
  style,
  children,
  ...rest
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, rootMargin });
  const active = enabled && (!whenInView || inView);

  useEffect(() => {
    const element = ref.current;
    if (!element || !active) return;

    const paint = (value: number) => {
      element.style.opacity = String(Math.min(1, Math.max(0, value)));
      element.style.transform = `translateY(${(1 - value) * offset}${unit})`;
    };
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      paint(1);
      return;
    }

    let state = { value: 0, velocity: 0 };
    let startedAt: number | null = null;
    let lastTime = 0;
    const stop = subscribe((time) => {
      startedAt ??= time;
      if (time - startedAt < delayIn) return;
      const step = stepSpring(state, 1, config, lastTime ? time - lastTime : 0, 0.001);
      lastTime = time;
      state = step.state;
      paint(state.value);
      if (step.atRest) stop();
    });
    return stop;
  }, [active, delayIn, config, offset, unit]);

  return (
    <div
      ref={ref}
      {...rest}
      style={{ opacity: 0, transform: `translateY(${offset}${unit})`, ...style }}
    >
      {children}
    </div>
  );
}
