import Image from 'next/image';
import Link from 'next/link';

export type CrtScreen =
  | { kind: 'video'; videoId: string; title: string; thumbnailUrl: string }
  | { kind: 'static' | 'bars' | 'glow' };

export type CrtSlot = {
  /** Position and width inside the wall cluster, in percent. */
  x: number;
  y: number;
  width: number;
  /** Depth of field: far TVs are softer. */
  blur: number;
  /** Small tilt so the stack looks piled up, in degrees. */
  tilt: number;
};

const SCREEN_LOOK: Record<Exclude<CrtScreen['kind'], 'video'>, string> = {
  static: 'crt-static',
  bars: 'crt-bars',
  glow: 'crt-glow',
};

/** One old TV on the feed's wall. Screens with a video are links to it. */
export function CrtTv({ slot, screen }: { slot: CrtSlot; screen: CrtScreen }) {
  const picture =
    screen.kind === 'video' ? (
      <Image
        src={screen.thumbnailUrl}
        alt=""
        fill
        unoptimized
        sizes="20vw"
        className="object-cover saturate-[1.2]"
      />
    ) : (
      <div className={`absolute inset-0 ${SCREEN_LOOK[screen.kind]}`} />
    );

  const tv = (
    <div className="crt-case h-full w-full">
      <div className="crt-screen h-full w-full">
        {picture}
        <div className="scanlines absolute inset-0" />
        <div className="crt-glass absolute inset-0" />
      </div>
    </div>
  );

  const placement = {
    left: `${slot.x}%`,
    top: `${slot.y}%`,
    width: `${slot.width}%`,
    '--blur': `${slot.blur}px`,
    transform: `rotate(${slot.tilt}deg)`,
  } as React.CSSProperties;
  const className =
    'crt-tv absolute aspect-[4/3] transition-[filter,scale] duration-500 [filter:blur(var(--blur))_brightness(0.85)] hover:z-10 hover:scale-105 hover:[filter:none]';

  if (screen.kind !== 'video') {
    return (
      <div aria-hidden className={className} style={placement}>
        {tv}
      </div>
    );
  }
  return (
    <Link
      href={`/videos/${screen.videoId}`}
      aria-label={`Watch ${screen.title}`}
      className={className}
      style={placement}
    >
      {tv}
    </Link>
  );
}
