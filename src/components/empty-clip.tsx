'use client';

import { useEffect, useState } from 'react';

/**
 * A silent clip that plays once over the banner still and holds its last frame. With reduced
 * motion no video is mounted, so the still stays. If the file fails to load, the still shows.
 */
export function EmptyClip({ src, position }: { src: string; position: string }) {
  const [isMotionAllowed, setIsMotionAllowed] = useState(false);

  useEffect(() => {
    setIsMotionAllowed(!window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  if (!isMotionAllowed) return null;

  return (
    <video
      src={src}
      autoPlay
      muted
      playsInline
      preload="auto"
      aria-hidden
      className="absolute inset-0 h-full w-full object-cover"
      style={{ objectPosition: position }}
    />
  );
}
