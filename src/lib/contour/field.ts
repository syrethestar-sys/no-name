/** The biggest value `fieldAt` can return, so contour levels can be spread across its range. */
export const FIELD_AMPLITUDE = 2.5;

/**
 * A smooth, slowly drifting field for the contour lines: three crossing waves, so the lines form
 * soft hills and valleys that move without ever jumping. `x` and `y` are in units of about 200 px,
 * `seconds` is time. Always between `-FIELD_AMPLITUDE` and `FIELD_AMPLITUDE`.
 */
export function fieldAt(x: number, y: number, seconds: number): number {
  return (
    Math.sin(x * 1.3 + seconds * 0.6) +
    Math.sin(y * 1.7 - seconds * 0.45 + Math.sin(x * 0.7) * 1.2) +
    0.5 * Math.sin((x + y) * 2.1 + seconds * 0.3)
  );
}
