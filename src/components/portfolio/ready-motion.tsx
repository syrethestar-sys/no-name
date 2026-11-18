'use client';

import type { ComponentProps } from 'react';
import { RevealText } from '@/components/motion/reveal-text';
import { Rise } from '@/components/motion/rise';
import { useReady } from '@/components/portfolio/ready-gate';

/** `Rise` that holds back until the loading veil lifts. */
export function ReadyRise(props: ComponentProps<typeof Rise>) {
  const ready = useReady();
  return <Rise {...props} enabled={ready} />;
}

/** `RevealText` that holds back until the loading veil lifts. */
export function ReadyRevealText(props: ComponentProps<typeof RevealText>) {
  const ready = useReady();
  return <RevealText {...props} enabled={ready} />;
}
