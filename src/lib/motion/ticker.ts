/**
 * One shared animation loop. Everything that moves on the portfolio page (smooth scroll, springs,
 * scroll readers, canvases, the WebGL scene) subscribes here instead of running its own
 * requestAnimationFrame, so they all see the same frame and the loop stops when nobody is left.
 */
type Subscriber = {
  callback: (time: number) => void;
  /** Minimum ms between calls. 0 runs every frame. */
  getFramerate: () => number;
  last: number;
};

const subscribers = new Set<Subscriber>();
let frameRequest: number | null = null;

function tick(time: number) {
  frameRequest = requestAnimationFrame(tick);
  // A snapshot, so a subscriber that unsubscribes (or adds another) mid-frame cannot upset the walk.
  for (const subscriber of [...subscribers]) {
    if (!subscribers.has(subscriber)) continue;
    if (time - subscriber.last > subscriber.getFramerate()) {
      subscriber.last = time;
      subscriber.callback(time);
    }
  }
}

/** Starts calling `callback` each frame. Returns the function that stops it. */
export function subscribe(
  callback: (time: number) => void,
  getFramerate: () => number = () => 0,
): () => void {
  const subscriber: Subscriber = { callback, getFramerate, last: 0 };
  subscribers.add(subscriber);
  if (frameRequest === null) frameRequest = requestAnimationFrame(tick);

  return () => {
    subscribers.delete(subscriber);
    if (subscribers.size === 0 && frameRequest !== null) {
      cancelAnimationFrame(frameRequest);
      frameRequest = null;
    }
  };
}
