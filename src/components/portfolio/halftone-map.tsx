'use client';

import { useEffect, useRef } from 'react';
import { useReady } from '@/components/portfolio/ready-gate';
import { portfolioContent } from '@/lib/portfolio-content';
import { halftoneDots } from '@/lib/season/halftone';

/** Distance between dot centres, in px. */
const PITCH = 8;

/**
 * The season block's map: the site name rasterised off screen, then redrawn as a lattice of dots.
 * Dot colour is `--pf-map-dot`. Waits for the loading veil so the display font is ready to measure.
 */
export function HalftoneMap({ className = '' }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ready = useReady();

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!ready || !canvas || !context) return;

    const draw = () => {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (!width || !height) return;
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);

      const shape = document.createElement('canvas');
      shape.width = width;
      shape.height = height;
      const shapeContext = shape.getContext('2d');
      if (!shapeContext) return;
      const style = getComputedStyle(canvas);
      const text = portfolioContent.siteName.toUpperCase();
      // fit the text to 90% of the width, or of the height if it is the tighter side
      shapeContext.font = `700 100px ${style.fontFamily}`;
      const fitted = Math.min(100 * ((width * 0.9) / shapeContext.measureText(text).width), height);
      shapeContext.font = `700 ${fitted}px ${style.fontFamily}`;
      shapeContext.textAlign = 'center';
      shapeContext.textBaseline = 'middle';
      shapeContext.fillText(text, width / 2, height / 2);

      const { data } = shapeContext.getImageData(0, 0, width, height);
      context.fillStyle = style.getPropertyValue('--pf-map-dot').trim();
      for (const { x, y, radius } of halftoneDots(data, width, height, PITCH)) {
        context.beginPath();
        context.arc(x, y, radius, 0, Math.PI * 2);
        context.fill();
      }
    };

    draw();
    const observer = new ResizeObserver(draw);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [ready]);

  return <canvas ref={canvasRef} aria-hidden className={className} />;
}
