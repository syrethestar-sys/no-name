import { describe, expect, it } from 'vitest';
import { edgePosition, interpolate, triggerProgress } from './scroll-progress';

const VIEW = 800;

describe('edgePosition', () => {
  const rect = { top: 300, height: 200 };

  it('measures each element point against each viewport line', () => {
    expect(edgePosition(rect, VIEW, 'top top')).toBe(300);
    expect(edgePosition(rect, VIEW, 'center top')).toBe(400);
    expect(edgePosition(rect, VIEW, 'bottom top')).toBe(500);
    expect(edgePosition(rect, VIEW, 'top center')).toBe(-100);
    expect(edgePosition(rect, VIEW, 'top bottom')).toBe(-500);
    expect(edgePosition(rect, VIEW, 'bottom bottom')).toBe(-300);
  });
});

describe('triggerProgress', () => {
  const progressAt = (top: number) =>
    triggerProgress({ top, height: 400 }, VIEW, 'top bottom', 'top top');

  it('is 0 while the element is below the fold and 1 once its top reaches the ceiling', () => {
    expect(progressAt(VIEW)).toBe(0);
    expect(progressAt(VIEW + 300)).toBe(0);
    expect(progressAt(0)).toBe(1);
    expect(progressAt(-300)).toBe(1);
  });

  it('is linear in between', () => {
    expect(progressAt(VIEW / 2)).toBeCloseTo(0.5);
    expect(progressAt(VIEW * 0.75)).toBeCloseTo(0.25);
  });

  it('runs across the whole crossing for top bottom to bottom top', () => {
    const at = (top: number) =>
      triggerProgress({ top, height: 400 }, VIEW, 'top bottom', 'bottom top');
    expect(at(VIEW)).toBe(0);
    expect(at(-400)).toBe(1);
    expect(at(200)).toBeCloseTo(0.5);
  });

  it('does not divide by zero when the two edges coincide', () => {
    const rect = { top: 100, height: 400 };
    expect(triggerProgress(rect, VIEW, 'top top', 'top top')).toBe(0);
    expect(triggerProgress({ ...rect, top: -10 }, VIEW, 'top top', 'top top')).toBe(1);
  });
});

describe('interpolate', () => {
  it('blends numbers', () => {
    expect(interpolate(0, 100, 0.25)).toBe(25);
  });

  it('blends a number with a unit', () => {
    expect(interpolate('0em', '1em', 0.5)).toBe('0.5em');
    expect(interpolate('-10%', '0%', 0.5)).toBe('-5%');
  });

  it('blends inside a transform function', () => {
    expect(interpolate('translateY(10px)', 'translateY(0px)', 0.25)).toBe('translateY(7.5px)');
  });

  it('rounds away floating point noise', () => {
    expect(interpolate('0px', '1px', 0.3)).toBe('0.3px');
  });

  it('holds the start value when the two shapes differ, and jumps at 1', () => {
    expect(interpolate('10px', '2em', 0.5)).toBe('10px');
    expect(interpolate('10px', '2em', 1)).toBe('2em');
    expect(interpolate('scale(1)', 'rotate(1deg)', 0.5)).toBe('scale(1)');
  });
});
