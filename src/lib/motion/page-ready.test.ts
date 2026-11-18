import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { whenPageReady } from './page-ready';

const options = { minMs: 700, maxMs: 3000 };

// Resolves a flag when the promise settles, so a test can ask "done yet?" at a point in time.
const track = (promise: Promise<void>) => {
  const state = { done: false };
  void promise.then(() => {
    state.done = true;
  });
  return state;
};

describe('whenPageReady', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('waits for the minimum time even when the fonts are already loaded', async () => {
    const state = track(whenPageReady(Promise.resolve(), options));
    await vi.advanceTimersByTimeAsync(699);
    expect(state.done).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    expect(state.done).toBe(true);
  });

  it('waits for slow fonts, up to the maximum', async () => {
    let loadFonts: () => void = () => {};
    const fonts = new Promise<void>((resolve) => (loadFonts = resolve));
    const state = track(whenPageReady(fonts, options));
    await vi.advanceTimersByTimeAsync(2000);
    expect(state.done).toBe(false);
    loadFonts();
    await vi.advanceTimersByTimeAsync(0);
    expect(state.done).toBe(true);
  });

  it('gives up on fonts that never load', async () => {
    const state = track(whenPageReady(new Promise(() => {}), options));
    await vi.advanceTimersByTimeAsync(2999);
    expect(state.done).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    expect(state.done).toBe(true);
  });

  it('carries on when the fonts fail', async () => {
    const state = track(whenPageReady(Promise.reject(new Error('font failed')), options));
    await vi.advanceTimersByTimeAsync(700);
    expect(state.done).toBe(true);
  });
});
