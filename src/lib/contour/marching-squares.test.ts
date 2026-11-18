import { describe, expect, it } from 'vitest';
import { FIELD_AMPLITUDE, fieldAt } from './field';
import { contourSegments, type Segment } from './marching-squares';

/** A 2 x 2 sample grid is one cell: top-left, top-right, bottom-left, bottom-right. */
const cell = (tl: number, tr: number, bl: number, br: number) => [tl, tr, bl, br];

const key = (x: number, y: number) => `${x.toFixed(6)},${y.toFixed(6)}`;

describe('contourSegments', () => {
  it('draws nothing where the whole field is on one side of the level', () => {
    expect(contourSegments(cell(0, 0, 0, 0), 2, 2, 0.5)).toEqual([]);
    expect(contourSegments(cell(1, 1, 1, 1), 2, 2, 0.5)).toEqual([]);
  });

  it('cuts one corner off with a line between the two edges next to it', () => {
    const [segment] = contourSegments(cell(1, 0, 0, 0), 2, 2, 0.5);
    // Top edge at x = 0.5 and left edge at y = 0.5.
    expect(segment).toEqual([0.5, 0, 0, 0.5]);
  });

  it('places line ends by linear interpolation', () => {
    const [segment] = contourSegments(cell(1, 0, 0, 0), 2, 2, 0.25);
    expect(segment[0]).toBeCloseTo(0.75); // 1 -> 0 along the top edge crosses 0.25 at 75 %
    expect(segment[3]).toBeCloseTo(0.75);
  });

  it('splits a saddle into two lines, the other way when the centre is low', () => {
    // High at top-right and bottom-left. The centre value is the average of the corners.
    const centreHigh = contourSegments(cell(0.4, 2, 2, 0.4), 2, 2, 0.5);
    const centreLow = contourSegments(cell(0.2, 0.6, 0.6, 0.2), 2, 2, 0.5);
    expect(centreHigh).toHaveLength(2);
    expect(centreLow).toHaveLength(2);
    expect(centreHigh).not.toEqual(centreLow);
  });

  it('closes a loop around a peak: every line end meets another', () => {
    const size = 9;
    const values = Array.from({ length: size * size }, (_, index) => {
      const x = (index % size) - 4;
      const y = Math.floor(index / size) - 4;
      return 10 - (x * x + y * y);
    });
    const segments: Segment[] = contourSegments(values, size, size, 4);
    expect(segments.length).toBeGreaterThan(8);

    const ends = new Map<string, number>();
    for (const [x1, y1, x2, y2] of segments) {
      for (const point of [key(x1, y1), key(x2, y2)]) {
        ends.set(point, (ends.get(point) ?? 0) + 1);
      }
    }
    expect([...ends.values()].every((count) => count === 2)).toBe(true);
  });
});

describe('fieldAt', () => {
  it('stays within its amplitude and changes smoothly over time', () => {
    for (let step = 0; step < 200; step++) {
      const x = step * 0.37;
      const y = step * 0.23;
      expect(Math.abs(fieldAt(x, y, step * 0.5))).toBeLessThanOrEqual(FIELD_AMPLITUDE);
    }
    expect(Math.abs(fieldAt(1, 2, 10.01) - fieldAt(1, 2, 10))).toBeLessThan(0.01);
  });
});
