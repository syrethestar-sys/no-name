/** A stable pseudo-random number in [0, 1) for a cell, so the dissolve looks the same every time. */
export function cellNoise(col: number, row: number): number {
  let hash = Math.imul(col + 1, 374761393) ^ Math.imul(row + 1, 668265263);
  hash = Math.imul(hash ^ (hash >>> 13), 1274126177);
  return ((hash ^ (hash >>> 16)) >>> 0) / 4294967296;
}

/** How much of the 0..1 progress one cell spends fading in. */
const FADE = 0.2;

/**
 * How visible a cell of the chequered seam is, 0 to 1, while the seam dissolves in as `progress`
 * goes from 0 to 1. Cells appear in a scattered order that sweeps from left to right, each with a
 * short fade. At 0 nothing shows and at 1 every cell is fully there.
 */
export function cellAlpha(col: number, row: number, cols: number, progress: number): number {
  const sweep = col / Math.max(1, cols - 1);
  const threshold = (0.65 * cellNoise(col, row) + 0.35 * sweep) * (1 - FADE);
  return Math.min(1, Math.max(0, (progress - threshold) / FADE));
}

/** Light and dark squares alternate like a chequered flag. */
export const isLightCell = (col: number, row: number) => (col + row) % 2 === 0;
