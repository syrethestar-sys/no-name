import { describe, expect, it } from 'vitest';
import { cellAlpha, cellNoise, isLightCell } from './seam-cells';

const COLS = 120;
const ROWS = 2;

const alphas = (progress: number) =>
  Array.from({ length: COLS * ROWS }, (_, index) =>
    cellAlpha(index % COLS, Math.floor(index / COLS), COLS, progress),
  );

const share = (values: number[]) => values.filter((value) => value > 0).length / values.length;

describe('cellNoise', () => {
  it('is stable and stays in [0, 1)', () => {
    for (let col = 0; col < 50; col++) {
      const value = cellNoise(col, col % 3);
      expect(value).toBe(cellNoise(col, col % 3));
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });
});

describe('cellAlpha', () => {
  it('shows nothing at the start and every cell fully at the end', () => {
    expect(alphas(0).every((alpha) => alpha === 0)).toBe(true);
    expect(alphas(1).every((alpha) => alpha === 1)).toBe(true);
  });

  it('only ever fades a cell in, never back out, as progress grows', () => {
    let previous = alphas(0);
    for (let step = 1; step <= 20; step++) {
      const next = alphas(step / 20);
      next.forEach((alpha, index) => expect(alpha).toBeGreaterThanOrEqual(previous[index]));
      previous = next;
    }
  });

  it('is partly dissolved in the middle, and sweeps from the left', () => {
    const middle = share(alphas(0.5));
    expect(middle).toBeGreaterThan(0.3);
    expect(middle).toBeLessThan(0.95);

    const early = alphas(0.3);
    const left = share(early.filter((_, index) => index % COLS < COLS / 3));
    const right = share(early.filter((_, index) => index % COLS >= (COLS * 2) / 3));
    expect(left).toBeGreaterThan(right);
  });
});

describe('isLightCell', () => {
  it('alternates in both directions', () => {
    expect(isLightCell(0, 0)).toBe(true);
    expect(isLightCell(1, 0)).toBe(false);
    expect(isLightCell(0, 1)).toBe(false);
    expect(isLightCell(1, 1)).toBe(true);
  });
});
