/** A line from (x1, y1) to (x2, y2), in grid units (one cell is 1 x 1). */
export type Segment = readonly [x1: number, y1: number, x2: number, y2: number];

/** Cell edges: 0 top, 1 right, 2 bottom, 3 left. */
type Edge = 0 | 1 | 2 | 3;
type EdgePair = readonly [Edge, Edge];

// For each corner pattern (top-left = 8, top-right = 4, bottom-right = 2, bottom-left = 1, a bit is
// set when the corner is at or above the level) the edge pairs a contour line joins. The two saddle
// patterns (5 and 10) have two readings, picked by the cell's centre value in `edgePairs`.
const PAIRS: readonly (readonly EdgePair[])[] = [
  [],
  [[3, 2]],
  [[2, 1]],
  [[3, 1]],
  [[0, 1]],
  [], // 5: saddle
  [[0, 2]],
  [[0, 3]],
  [[0, 3]],
  [[0, 2]],
  [], // 10: saddle
  [[0, 1]],
  [[3, 1]],
  [[2, 1]],
  [[3, 2]],
  [],
];

function edgePairs(pattern: number, centreIsHigh: boolean): readonly EdgePair[] {
  if (pattern === 5) {
    return centreIsHigh
      ? [
          [0, 3],
          [2, 1],
        ]
      : [
          [3, 2],
          [0, 1],
        ];
  }
  if (pattern === 10) {
    return centreIsHigh
      ? [
          [0, 1],
          [3, 2],
        ]
      : [
          [0, 3],
          [2, 1],
        ];
  }
  return PAIRS[pattern];
}

/**
 * The contour lines of a scalar field at one level, by marching squares. `values` holds the field
 * sampled at the corners of a grid, row by row (`cols` x `rows` samples, so `cols - 1` x `rows - 1`
 * cells). Line ends sit on cell edges, placed by linear interpolation.
 */
export function contourSegments(
  values: ArrayLike<number>,
  cols: number,
  rows: number,
  level: number,
): Segment[] {
  const segments: Segment[] = [];

  for (let row = 0; row < rows - 1; row++) {
    for (let col = 0; col < cols - 1; col++) {
      const topLeft = values[row * cols + col];
      const topRight = values[row * cols + col + 1];
      const bottomRight = values[(row + 1) * cols + col + 1];
      const bottomLeft = values[(row + 1) * cols + col];

      const pattern =
        (topLeft >= level ? 8 : 0) |
        (topRight >= level ? 4 : 0) |
        (bottomRight >= level ? 2 : 0) |
        (bottomLeft >= level ? 1 : 0);
      if (pattern === 0 || pattern === 15) continue;

      const centre = (topLeft + topRight + bottomRight + bottomLeft) / 4;
      const along = (a: number, b: number) => (level - a) / (b - a);
      const pointOn = (edge: Edge): [number, number] => {
        if (edge === 0) return [col + along(topLeft, topRight), row];
        if (edge === 1) return [col + 1, row + along(topRight, bottomRight)];
        if (edge === 2) return [col + along(bottomLeft, bottomRight), row + 1];
        return [col, row + along(topLeft, bottomLeft)];
      };

      for (const [from, to] of edgePairs(pattern, centre >= level)) {
        const [x1, y1] = pointOn(from);
        const [x2, y2] = pointOn(to);
        segments.push([x1, y1, x2, y2]);
      }
    }
  }
  return segments;
}
