import { describe, expect, it } from 'vitest';
import {
  DEFAULT_PRECISION,
  springConfigs,
  stepSpring,
  type SpringConfig,
  type SpringState,
} from './spring';

const FRAME_MS = 16;

/** Runs a spring frame by frame and reports what happened. */
function run(config: SpringConfig, precision = DEFAULT_PRECISION) {
  let state: SpringState = { value: 0, velocity: 0 };
  let peak = 0;
  let frames = 0;
  for (; frames < 1000; frames += 1) {
    const step = stepSpring(state, 1, config, FRAME_MS, precision);
    state = step.state;
    peak = Math.max(peak, state.value);
    if (step.atRest) break;
  }
  return { state, peak, frames };
}

describe('stepSpring', () => {
  it('settles exactly on the target', () => {
    const { state, frames } = run(springConfigs.reveal);
    expect(state).toEqual({ value: 1, velocity: 0 });
    expect(frames).toBeLessThan(1000);
  });

  it('does not overshoot when overdamped', () => {
    expect(run(springConfigs.reveal).peak).toBeLessThanOrEqual(1);
  });

  it('overshoots when underdamped', () => {
    expect(run({ tension: 170, friction: 10 }).peak).toBeGreaterThan(1);
  });

  it('treats a very slow frame as 64 ms', () => {
    const start: SpringState = { value: 0, velocity: 0 };
    const slow = stepSpring(start, 1, springConfigs.item, 5000);
    const capped = stepSpring(start, 1, springConfigs.item, 64);
    expect(slow).toEqual(capped);
  });

  it('is at rest from the start when already on the target', () => {
    const step = stepSpring({ value: 1, velocity: 0 }, 1, springConfigs.item, FRAME_MS);
    expect(step.atRest).toBe(true);
  });

  it('takes at least as long to rest under a tighter precision', () => {
    const loose = run(springConfigs.reveal, 0.01).frames;
    const tight = run(springConfigs.reveal, 0.001).frames;
    expect(tight).toBeGreaterThanOrEqual(loose);
  });
});
