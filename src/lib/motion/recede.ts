/**
 * The sticky stack's recede: a pinned block scales down and darkens as the next block comes up
 * over it. Pure maths; `StickyStack` applies the result to the DOM.
 */
export const RECEDE_SCALE = 0.9;
export const RECEDE_SHADE = 0.55;

export type Recede = {
  /** 0 while the next block is a full screen away, 1 once it has covered the viewport. */
  progress: number;
  /** Null means no transform at all, which keeps `position: fixed` children anchored to the viewport. */
  scale: number | null;
  shade: number;
  /** Fully covered: stop painting it. */
  hidden: boolean;
};

export function recede(nextTop: number, viewportHeight: number, scales: boolean): Recede {
  const progress = Math.min(1, Math.max(0, 1 - nextTop / Math.max(viewportHeight, 1)));
  return {
    progress,
    scale: scales && progress > 0 ? 1 - (1 - RECEDE_SCALE) * progress : null,
    shade: RECEDE_SHADE * progress,
    hidden: progress >= 1,
  };
}
