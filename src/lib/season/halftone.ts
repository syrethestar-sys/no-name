export type Dot = { x: number; y: number; radius: number };

/** Dots smaller than this (px) are dropped; they would only draw noise. */
const MIN_RADIUS = 0.4;

/**
 * Turns a shape into a lattice of dots. `rgba` is the pixel data of an image `width` x `height`
 * px (as `getImageData` gives it) where the shape is drawn opaque. Each `pitch` px cell gets one
 * dot at its centre, sized by how much of the cell the shape covers: full cells get the biggest dot.
 */
export function halftoneDots(
  rgba: Uint8ClampedArray,
  width: number,
  height: number,
  pitch: number,
): Dot[] {
  const dots: Dot[] = [];
  for (let top = 0; top < height; top += pitch) {
    for (let left = 0; left < width; left += pitch) {
      const right = Math.min(left + pitch, width);
      const bottom = Math.min(top + pitch, height);
      let covered = 0;
      for (let y = top; y < bottom; y++) {
        for (let x = left; x < right; x++) covered += rgba[(y * width + x) * 4 + 3];
      }
      const coverage = covered / (255 * pitch * pitch);
      // sqrt: dot area, not radius, follows coverage
      const radius = (pitch / 2) * Math.sqrt(Math.min(1, coverage));
      if (radius >= MIN_RADIUS) dots.push({ x: left + pitch / 2, y: top + pitch / 2, radius });
    }
  }
  return dots;
}
