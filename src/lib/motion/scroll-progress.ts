/**
 * Scroll maths for scroll-driven motion: how far through a window an element is, and how to turn
 * that 0–1 number into a value. Pure functions; the hooks that read the DOM come later.
 */

/** "Element point, viewport line": `top bottom` is the element's top meeting the viewport's bottom. */
export type TriggerEdge =
  | 'top top'
  | 'top center'
  | 'top bottom'
  | 'center top'
  | 'center center'
  | 'center bottom'
  | 'bottom top'
  | 'bottom center'
  | 'bottom bottom';

const EDGES: Record<TriggerEdge, { element: number; viewport: number }> = {
  'top top': { element: 0, viewport: 0 },
  'top center': { element: 0, viewport: 0.5 },
  'top bottom': { element: 0, viewport: 1 },
  'center top': { element: 0.5, viewport: 0 },
  'center center': { element: 0.5, viewport: 0.5 },
  'center bottom': { element: 0.5, viewport: 1 },
  'bottom top': { element: 1, viewport: 0 },
  'bottom center': { element: 1, viewport: 0.5 },
  'bottom bottom': { element: 1, viewport: 1 },
};

export type TriggerRect = { top: number; height: number };

/** Where an edge sits relative to the viewport: positive is still ahead of it, 0 is on the line. */
export function edgePosition(rect: TriggerRect, viewportHeight: number, edge: TriggerEdge): number {
  const { element, viewport } = EDGES[edge];
  return rect.top + rect.height * element - viewportHeight * viewport;
}

/** 0 before `start` reaches its line, 1 once `end` has, linear in between. */
export function triggerProgress(
  rect: TriggerRect,
  viewportHeight: number,
  start: TriggerEdge,
  end: TriggerEdge,
): number {
  const scrollStart = edgePosition(rect, viewportHeight, start);
  const scrollEnd = edgePosition(rect, viewportHeight, end);
  const length = Math.abs(scrollStart - scrollEnd);
  if (length === 0) return scrollStart <= 0 ? 1 : 0;
  return Math.min(Math.max(0, 1 - (scrollStart + length) / length), 1);
}

export type Interpolable = number | string;

// A bare number, a number with a unit ("12em"), or one transform function ("translateY(12px)").
const VALUE = /^(?:([a-zA-Z]+)\()?(-?\d*\.?\d+)([a-z%]*)\)?$/;

function parseValue(text: string) {
  const match = VALUE.exec(text.trim());
  if (!match) return null;
  return { fn: match[1] ?? '', amount: Number(match[2]), unit: match[3] };
}

/** Linear blend of two values of the same shape. A mismatch holds `from` until progress is 1. */
export function interpolate(from: Interpolable, to: Interpolable, progress: number): Interpolable {
  if (typeof from === 'number' && typeof to === 'number') return from + (to - from) * progress;

  const start = parseValue(String(from));
  const end = parseValue(String(to));
  if (!start || !end || start.fn !== end.fn || start.unit !== end.unit) {
    return progress >= 1 ? to : from;
  }

  const amount = Number((start.amount + (end.amount - start.amount) * progress).toFixed(4));
  const text = `${amount}${start.unit}`;
  return start.fn ? `${start.fn}(${text})` : text;
}
