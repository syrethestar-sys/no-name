/**
 * A damped spring, solved the way react-spring solves it: 1 ms substeps, mass 1, `tension` and
 * `friction` in react-spring's own units. Everything on the portfolio page that moves is one of
 * these driven toward a target.
 */
export type SpringConfig = { tension: number; friction: number };
export type SpringState = { value: number; velocity: number };

/** Named configs, so a number is never retyped at the call site. */
export const springConfigs = {
  reveal: { tension: 90, friction: 26 },
  item: { tension: 170, friction: 24 },
  sheet: { tension: 190, friction: 26 },
  figure: { tension: 200, friction: 24 },
  type: { tension: 210, friction: 24 },
  year: { tension: 190, friction: 24 },
  yearSettle: { tension: 32, friction: 26 },
  copy: { tension: 110, friction: 26 },
  words: { tension: 150, friction: 24 },
  name: { tension: 190, friction: 24 },
  veil: { tension: 70, friction: 24 },
  clear: { tension: 140, friction: 26 },
  label: { tension: 110, friction: 26 },
  progressWaiting: { tension: 10, friction: 30 },
  progressReady: { tension: 170, friction: 26 },
  trigger: { tension: 140, friction: 30 },
} as const satisfies Record<string, SpringConfig>;

const SUBSTEP_MS = 1;
/** A slow frame (a background tab coming back) is treated as this long, never longer. */
const MAX_FRAME_MS = 64;
const MASS = 1;
const REST_VELOCITY = 0.01;

/** Distance from the target under which a spring may rest. Use 0.001 for 0–1 ranges like opacity. */
export const DEFAULT_PRECISION = 0.01;

export type SpringStep = { state: SpringState; atRest: boolean };

/** Advances a spring by `elapsedMs`. At rest the value snaps to the target exactly. */
export function stepSpring(
  state: SpringState,
  target: number,
  config: SpringConfig,
  elapsedMs: number,
  precision: number = DEFAULT_PRECISION,
): SpringStep {
  let { value, velocity } = state;
  let remaining = Math.min(Math.max(elapsedMs, 0), MAX_FRAME_MS);

  while (remaining > 0) {
    const dt = Math.min(SUBSTEP_MS, remaining);
    const springForce = -config.tension * 0.000001 * (value - target);
    const dampingForce = -config.friction * 0.001 * velocity;
    velocity += ((springForce + dampingForce) / MASS) * dt;
    value += velocity * dt;
    remaining -= dt;
  }

  const atRest = Math.abs(velocity) < REST_VELOCITY && Math.abs(target - value) < precision;
  if (atRest) return { state: { value: target, velocity: 0 }, atRest: true };
  return { state: { value, velocity }, atRest: false };
}
