'use client';

import { useEffect, useRef } from 'react';
import { useReady } from '@/components/portfolio/ready-gate';
import { subscribe } from '@/lib/motion/ticker';
import { useInView } from '@/lib/motion/use-in-view';
import { cellAlpha, isLightCell } from '@/lib/seam/seam-cells';

/** Two rows of 12 px squares make the 24 px strip. */
const CELL = 12;
const ROWS = 2;
const HEIGHT = CELL * ROWS;
const DURATION_MS = 1100;

/**
 * A chequered strip between two blocks. It dissolves in cell by cell, sweeping from the left, the
 * first time it is on screen after the loading veil lifts. Mint and white squares are read from
 * `--pf-accent` and `--pf-ink`. Under reduced motion it simply appears.
 */
export function ChequeredSeam({ className = '' }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ready = useReady();
  const inView = useInView(canvasRef, { once: true });
  const active = ready && inView;

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let progress = reducedMotion && active ? 1 : 0;
    let width = 0;
    let cols = 0;

    const draw = () => {
      const style = getComputedStyle(canvas);
      const light = style.getPropertyValue('--pf-accent').trim();
      const dark = style.getPropertyValue('--pf-ink').trim();
      context.clearRect(0, 0, width, HEIGHT);
      for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < cols; col++) {
          const alpha = cellAlpha(col, row, cols, progress);
          if (alpha <= 0) continue;
          context.globalAlpha = alpha;
          context.fillStyle = isLightCell(col, row) ? light : dark;
          context.fillRect(col * CELL, row * CELL, CELL, CELL);
        }
      }
      context.globalAlpha = 1;
    };

    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth;
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(HEIGHT * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      cols = Math.ceil(width / CELL);
      draw();
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    let stop = () => {};
    if (active && !reducedMotion) {
      let startedAt: number | null = null;
      stop = subscribe((time) => {
        startedAt ??= time;
        const done = Math.min(1, (time - startedAt) / DURATION_MS);
        progress = 1 - (1 - done) ** 3;
        draw();
        if (done >= 1) stop();
      });
    }

    return () => {
      stop();
      observer.disconnect();
    };
  }, [active]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={className}
      style={{ height: HEIGHT, width: '100%' }}
    />
  );
}
