import Image from 'next/image';
import Link from 'next/link';
import { ClipScreen } from '@/components/clip-screen';
import { CrtBox, type CrtBoxSize } from '@/components/crt-box';

export type CrtScreen =
  | { kind: 'video'; videoId: string; title: string; thumbnailUrl: string }
  | { kind: 'clip'; src: string; start: number }
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
  /** How far the TV is turned left/right and tipped forward, in degrees. */
  yaw: number;
  pitch: number;
  /** Woodgrain cabinet instead of plastic. */
  wood?: boolean;
  /** Rabbit ears on top. */
  antenna?: boolean;
};

const SCREEN_LOOK: Record<'static' | 'bars' | 'glow', string> = {
  static: 'crt-static',
  bars: 'crt-bars',
  glow: 'crt-glow',
};

// The parts of the set, in percent of its width (the front is 100 wide and 75 high).
const CABINET: CrtBoxSize = { w: 100, h: 75, d: 52 };
// Two stepped blocks behind the cabinet make the tapered back of the picture tube.
const TUBE_NEAR: CrtBoxSize = { w: 74, h: 58, d: 22, z: -37 };
const TUBE_FAR: CrtBoxSize = { w: 50, h: 40, d: 26, z: -61 };
const ANTENNA_BASE: CrtBoxSize = { w: 18, h: 4.5, d: 13, y: -39.75 };

/** One old TV on the feed's wall, built in CSS-3D. Screens with a video are links to it. */
export function CrtTv({ slot, screen }: { slot: CrtSlot; screen: CrtScreen }) {
  let picture: React.ReactNode;
  if (screen.kind === 'video') {
    picture = (
      <Image
        src={screen.thumbnailUrl}
        alt=""
        fill
        unoptimized
        sizes="20vw"
        className="object-cover saturate-[1.2]"
      />
    );
  } else if (screen.kind === 'clip') {
    picture = <ClipScreen src={screen.src} start={screen.start} />;
  } else {
    picture = <div className={`absolute inset-0 ${SCREEN_LOOK[screen.kind]}`} />;
  }

  const tv = (
    <div className="crt-stage">
      <div
        className="crt-body"
        data-style={slot.wood ? 'wood' : 'plastic'}
        style={{ '--yaw': `${slot.yaw}deg`, '--pitch': `${slot.pitch}deg` } as React.CSSProperties}
      >
        <CrtBox size={TUBE_FAR} className="crt-hood" />
        <CrtBox size={TUBE_NEAR} className="crt-hood" />
        <CrtBox size={CABINET} className="crt-cabinet">
          <div className="crt-well" />
          <div className="crt-screen">
            {picture}
            <div className="scanlines absolute inset-0" />
            <div className="crt-sheen absolute inset-0" />
          </div>
          <div className="crt-controls">
            <div
              className="crt-knob"
              style={{ top: '4cqw', '--turn': '35deg' } as React.CSSProperties}
            />
            <div
              className="crt-knob"
              style={{ top: '17cqw', '--turn': '-50deg' } as React.CSSProperties}
            />
            <div className="crt-grille" />
            <div className="crt-led" />
          </div>
          <div className="crt-plate" />
        </CrtBox>
        {slot.antenna && (
          <>
            <CrtBox size={ANTENNA_BASE} className="crt-hood" />
            <div className="crt-rods">
              <div className="crt-rod" />
              <div className="crt-rod" />
            </div>
          </>
        )}
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
