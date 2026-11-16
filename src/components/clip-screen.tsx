'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * A silent looping clip on a TV screen. `start` (0–1) is where in the clip it begins, so several
 * screens playing the same file are out of step. With reduced motion no video is mounted and the
 * screen shows the soft glow instead.
 */
export function ClipScreen({ src, start }: { src: string; start: number }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMotionAllowed, setIsMotionAllowed] = useState(false);

  useEffect(() => {
    setIsMotionAllowed(!window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  function jumpToStart() {
    const video = videoRef.current;
    if (!video || !Number.isFinite(video.duration)) return;
    video.currentTime = video.duration * start;
  }

  return (
    <>
      <div className="crt-glow absolute inset-0" />
      {isMotionAllowed && (
        <video
          ref={videoRef}
          src={src}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          aria-hidden
          onLoadedMetadata={jumpToStart}
          className="absolute inset-0 h-full w-full object-cover saturate-[1.1]"
        />
      )}
    </>
  );
}
