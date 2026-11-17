import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { subscribe } from './ticker';

let queue = new Map<number, FrameRequestCallback>();
let nextId = 1;

/** Runs the frames that are waiting, as the browser would at `time`. */
function flush(time: number) {
  const waiting = [...queue.values()];
  queue = new Map();
  for (const callback of waiting) callback(time);
}

const stops: Array<() => void> = [];
const track = (stop: () => void) => {
  stops.push(stop);
  return stop;
};

beforeEach(() => {
  queue = new Map();
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    const id = nextId++;
    queue.set(id, callback);
    return id;
  });
  vi.stubGlobal('cancelAnimationFrame', (id: number) => {
    queue.delete(id);
  });
});

afterEach(() => {
  for (const stop of stops.splice(0)) stop();
  vi.unstubAllGlobals();
});

describe('ticker', () => {
  it('calls a subscriber every frame by default', () => {
    const times: number[] = [];
    track(subscribe((time) => times.push(time)));
    flush(16);
    flush(33);
    flush(50);
    expect(times).toEqual([16, 33, 50]);
  });

  it('holds a subscriber to its own frame interval', () => {
    const times: number[] = [];
    track(
      subscribe(
        (time) => times.push(time),
        () => 30,
      ),
    );
    for (const time of [16, 32, 48, 64, 80]) flush(time);
    expect(times).toEqual([32, 64]);
  });

  it('runs only while someone is subscribed', () => {
    expect(queue.size).toBe(0);
    const stop = subscribe(() => {});
    expect(queue.size).toBe(1);
    stop();
    expect(queue.size).toBe(0);
  });

  it('shares one frame request between subscribers', () => {
    track(subscribe(() => {}));
    track(subscribe(() => {}));
    expect(queue.size).toBe(1);
  });

  it('survives a subscriber stopping another in the middle of a frame', () => {
    const calls: string[] = [];
    let stopSecond = () => {};
    track(
      subscribe(() => {
        calls.push('first');
        stopSecond();
      }),
    );
    stopSecond = track(subscribe(() => calls.push('second')));
    flush(16);
    expect(calls).toEqual(['first']);
  });
});
