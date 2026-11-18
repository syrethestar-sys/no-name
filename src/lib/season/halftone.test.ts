import { describe, expect, it } from 'vitest';
import { halftoneDots } from './halftone';

/** An image of `width` x `height` px, opaque inside the box `[x0, x1) x [y0, y1)`. */
function shape(width: number, height: number, x0: number, y0: number, x1: number, y1: number) {
  const rgba = new Uint8ClampedArray(width * height * 4);
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) rgba[(y * width + x) * 4 + 3] = 255;
  return rgba;
}

describe('halftoneDots', () => {
  it('makes no dots for an empty image', () => {
    expect(halftoneDots(new Uint8ClampedArray(16 * 16 * 4), 16, 16, 4)).toEqual([]);
  });

  it('makes one full dot per fully covered cell, at the cell centre', () => {
    const dots = halftoneDots(shape(16, 16, 4, 4, 8, 8), 16, 16, 4);
    expect(dots).toEqual([{ x: 6, y: 6, radius: 2 }]);
  });

  it('sizes a half covered cell between nothing and full', () => {
    const [dot] = halftoneDots(shape(8, 8, 0, 0, 2, 4), 8, 8, 4);
    expect(dot.radius).toBeGreaterThan(0);
    expect(dot.radius).toBeLessThan(2);
  });
});
