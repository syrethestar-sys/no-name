'use client';

import { useEffect, useRef } from 'react';
import { useReady } from '@/components/portfolio/ready-gate';
import { FIELD_AMPLITUDE, fieldAt } from '@/lib/contour/field';
import { contourSegments } from '@/lib/contour/marching-squares';
import { subscribe } from '@/lib/motion/ticker';
import { useInView } from '@/lib/motion/use-in-view';

/** Size of one grid cell in CSS px: smaller is smoother and slower. */
const CELL = 24;
/** How many px one field unit covers. */
const FIELD_SCALE = 220;
/** Seven lines, evenly spread over most of the field's range. */
const LEVELS = Array.from(
  { length: 7 },
  (_, index) => ((index / 6) * 2 - 1) * FIELD_AMPLITUDE * 0.72,
);
/** About 30 frames a second is plenty for a slow drift. */
const FRAME_MS = 33;

/** Slow, drifting contour lines behind the page, drawn on a canvas from `--pf-contour`. */
export function ContourBackdrop({ className = '' }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ready = useReady();
  const inView = useInView(canvasRef);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let width = 0;
    let height = 0;
    let values = new Float32Array(0);
    let cols = 0;
    let rows = 0;

    const draw = (seconds: number) => {
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          values[row * cols + col] = fieldAt(
            (col * CELL) / FIELD_SCALE,
            (row * CELL) / FIELD_SCALE,
            seconds,
          );
        }
      }
      context.clearRect(0, 0, width, height);
      context.strokeStyle = getComputedStyle(canvas).getPropertyValue('--pf-contour').trim();
      context.lineWidth = 1;
      for (const level of LEVELS) {
        context.beginPath();
        for (const [x1, y1, x2, y2] of contourSegments(values, cols, rows, level)) {
          context.moveTo(x1 * CELL, y1 * CELL);
          context.lineTo(x2 * CELL, y2 * CELL);
        }
        context.stroke();
      }
    };

    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      cols = Math.ceil(width / CELL) + 1;
      rows = Math.ceil(height / CELL) + 1;
      values = new Float32Array(cols * rows);
      draw(performance.now() / 1000);
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    // Reduced motion keeps the one still frame; otherwise it drifts while on screen.
    const stop =
      reducedMotion || !inView
        ? () => {}
        : subscribe(
            (time) => draw(time / 1000),
            () => FRAME_MS,
          );

    return () => {
      stop();
      observer.disconnect();
    };
  }, [inView]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={`transition-opacity duration-1000 ${ready ? 'opacity-100' : 'opacity-0'} ${className}`}
    />
  );
}
