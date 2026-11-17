'use client';

import { useEffect } from 'react';
import 'lenis/dist/lenis.css';
import { startSmoothScroll } from '@/lib/motion/smooth-scroll';

/** Turns on smooth scrolling while the page is mounted. Renders nothing. */
export function SmoothScroll() {
  useEffect(() => startSmoothScroll(), []);
  return null;
}
