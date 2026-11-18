'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { LoadingVeil } from '@/components/portfolio/loading-veil';
import { whenPageReady } from '@/lib/motion/page-ready';

const ReadyContext = createContext(false);

/** True once the loading veil has started to lift: the cue for every entrance animation. */
export const useReady = () => useContext(ReadyContext);

/** Shows the loading veil and tells the page below when it can play its entrance. */
export function ReadyGate({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void whenPageReady(document.fonts.ready, { minMs: 700, maxMs: 3000 }).then(() => {
      if (!cancelled) setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <ReadyContext.Provider value={ready}>
      <LoadingVeil lifted={ready} />
      {children}
    </ReadyContext.Provider>
  );
}
