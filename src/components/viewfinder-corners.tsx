const cornerClass = 'pointer-events-none absolute size-6 border-primary/80';

/**
 * Camcorder corner brackets and a mono status label over a picture (the video player).
 * Place inside a `relative` box. Leave `label` out where the picture has its own top bar
 * (the YouTube player shows the title there).
 */
export function ViewfinderCorners({ label }: { label?: string }) {
  return (
    <>
      <span aria-hidden className={`${cornerClass} top-3 left-3 border-t border-l`} />
      <span aria-hidden className={`${cornerClass} top-3 right-3 border-t border-r`} />
      <span aria-hidden className={`${cornerClass} bottom-3 left-3 border-b border-l`} />
      <span aria-hidden className={`${cornerClass} right-3 bottom-3 border-r border-b`} />
      {label && (
        <span
          aria-hidden
          className="pointer-events-none absolute top-4 left-11 flex items-center gap-1.5 font-mono text-[0.6875rem] tracking-wider text-foreground/85"
        >
          <span className="size-1.5 rounded-full bg-rec" />
          {label}
        </span>
      )}
    </>
  );
}
