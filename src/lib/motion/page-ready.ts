type Options = { minMs: number; maxMs: number };

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Resolves once the fonts have loaded and at least `minMs` have passed (so a loading veil never just
 * flashes), but never later than `maxMs` (a slow or failed font must not hold the page back).
 */
export function whenPageReady(fonts: Promise<unknown>, { minMs, maxMs }: Options): Promise<void> {
  const loaded = Promise.all([fonts.catch(() => undefined), wait(minMs)]).then(() => undefined);
  return Promise.race([loaded, wait(maxMs)]);
}
