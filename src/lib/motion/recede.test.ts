import { describe, expect, it } from 'vitest';
import { RECEDE_SCALE, RECEDE_SHADE, recede } from './recede';

const VIEW = 800;

describe('recede', () => {
  it('does nothing while the next block is a screen or more away', () => {
    expect(recede(VIEW, VIEW, true)).toEqual({ progress: 0, scale: null, shade: 0, hidden: false });
    expect(recede(VIEW * 2, VIEW, true).progress).toBe(0);
  });

  it('is halfway when the next block has risen halfway', () => {
    const half = recede(VIEW / 2, VIEW, true);
    expect(half.progress).toBeCloseTo(0.5);
    expect(half.scale).toBeCloseTo(1 - (1 - RECEDE_SCALE) / 2);
    expect(half.shade).toBeCloseTo(RECEDE_SHADE / 2);
    expect(half.hidden).toBe(false);
  });

  it('ends fully shrunk, dark and hidden once the next block covers the viewport', () => {
    const done = recede(0, VIEW, true);
    expect(done).toEqual({ progress: 1, scale: RECEDE_SCALE, shade: RECEDE_SHADE, hidden: true });
    expect(recede(-200, VIEW, true).progress).toBe(1);
  });

  it('only darkens, never scales, where scaling is off (phones, reduced motion)', () => {
    const half = recede(VIEW / 2, VIEW, false);
    expect(half.scale).toBeNull();
    expect(half.shade).toBeCloseTo(RECEDE_SHADE / 2);
  });
});
