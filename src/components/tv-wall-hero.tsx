import Link from 'next/link';
import { CrtTv, type CrtScreen, type CrtSlot } from '@/components/crt-tv';
import { WallParallax } from '@/components/wall-parallax';
import { Button } from '@/components/ui/button';
import type { VideoCardData } from '@/lib/videos';

// Where the TVs stand in each half of the room (percent of the cluster box), front to back.
const LEFT_SLOTS: CrtSlot[] = [
  { x: 4, y: 12, width: 46, blur: 0, tilt: -2 },
  { x: 40, y: 50, width: 36, blur: 0.5, tilt: 1 },
  { x: 2, y: 54, width: 32, blur: 1, tilt: 3 },
  { x: 56, y: 20, width: 22, blur: 1.5, tilt: -1 },
  { x: 22, y: 82, width: 26, blur: 1, tilt: -3 },
  { x: 60, y: 0, width: 18, blur: 2.5, tilt: 2 },
];
const RIGHT_SLOTS: CrtSlot[] = [
  { x: 50, y: 8, width: 46, blur: 0, tilt: 2 },
  { x: 6, y: 46, width: 36, blur: 0.5, tilt: -2 },
  { x: 54, y: 52, width: 40, blur: 0, tilt: 1 },
  { x: 22, y: 4, width: 24, blur: 1.5, tilt: -1 },
  { x: 28, y: 30, width: 20, blur: 2.5, tilt: 2 },
  { x: 30, y: 80, width: 26, blur: 1, tilt: 3 },
];
// What the TVs without a video show.
const FILLERS: CrtScreen[] = [
  { kind: 'static' },
  { kind: 'static' },
  { kind: 'bars' },
  { kind: 'glow' },
  { kind: 'static' },
  { kind: 'static' },
];

/** Newest open videos first on the front TVs; the rest show static, bars or a glow. */
function screensFor(videos: VideoCardData[], count: number): CrtScreen[] {
  const videoScreens: CrtScreen[] = videos
    .filter((video) => !video.isLocked && video.thumbnailUrl)
    .map((video) => ({
      kind: 'video',
      videoId: video.id,
      title: video.title,
      thumbnailUrl: video.thumbnailUrl ?? '',
    }));
  return Array.from({ length: count }, (_, index) =>
    index % 2 === 0 && videoScreens.length > index / 2
      ? videoScreens[index / 2]
      : FILLERS[index % FILLERS.length],
  );
}

/**
 * The feed's opening shot: a dark room with a wall of old TVs on both sides playing the newest
 * videos, a big title in the middle, and the viewfinder's crosshair.
 */
export function TvWallHero({
  videos,
  eyebrow,
  watchHref,
  showJoin,
}: {
  videos: VideoCardData[];
  eyebrow: React.ReactNode;
  watchHref: string;
  showJoin: boolean;
}) {
  const screens = screensFor(videos, LEFT_SLOTS.length + RIGHT_SLOTS.length);
  // Alternate sides so the first videos land on the big front TVs of both halves.
  const leftScreens = screens.filter((_, index) => index % 4 < 2);
  const rightScreens = screens.filter((_, index) => index % 4 >= 2);

  return (
    <section className="relative isolate -mx-4 flex min-h-[34rem] items-center justify-center overflow-hidden rounded-xl bg-[radial-gradient(60%_55%_at_50%_45%,var(--secondary),var(--background)_75%)] sm:h-[calc(100svh-7rem)]">
      <WallParallax className="tv-wall absolute inset-0 [perspective:1100px]">
        <div className="absolute top-[6%] left-[-12%] h-[86%] w-[62%] opacity-60 transition-transform duration-700 ease-out [transform:translate3d(calc(var(--mx,0)*-22px),calc(var(--my,0)*-12px),0)_rotateY(26deg)] sm:left-[-2%] sm:w-[44%] sm:opacity-100">
          {LEFT_SLOTS.map((slot, index) => (
            <CrtTv key={index} slot={slot} screen={leftScreens[index]} />
          ))}
        </div>
        <div className="absolute top-[4%] right-[-12%] h-[88%] w-[62%] opacity-60 transition-transform duration-700 ease-out [transform:translate3d(calc(var(--mx,0)*-30px),calc(var(--my,0)*-14px),0)_rotateY(-26deg)] sm:right-[-2%] sm:w-[44%] sm:opacity-100">
          {RIGHT_SLOTS.map((slot, index) => (
            <CrtTv key={index} slot={slot} screen={rightScreens[index]} />
          ))}
        </div>
      </WallParallax>

      {/* Room light: mint spill from the screens, dark middle for the title, fog on the floor,
          grain over everything. */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(45%_40%_at_78%_70%,color-mix(in_oklab,var(--primary)_14%,transparent),transparent_70%),radial-gradient(40%_35%_at_18%_30%,color-mix(in_oklab,var(--primary)_9%,transparent),transparent_70%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(38%_42%_at_50%_45%,var(--background),transparent_100%)] opacity-80" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-background to-transparent" />
      <div className="film-grain pointer-events-none absolute inset-0 opacity-[0.12] mix-blend-overlay" />

      <div className="relative z-10 flex max-w-2xl flex-col items-center px-6 text-center">
        <p className="font-mono text-xs tracking-wider text-foreground/70">{eyebrow}</p>
        <h1 className="display-title mt-4 text-6xl sm:text-8xl">
          Experiences
          <br />
          on tape
        </h1>
        <span
          aria-hidden
          className="mt-8 font-mono text-3xl leading-none font-light text-foreground/80"
        >
          +
        </span>
        <p className="mt-6 max-w-md text-sm text-foreground/85 sm:text-base">
          Work, life, trading and code — recorded as it happened, shared with people who grow
          together.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button size="lg" nativeButton={false} render={<Link href={watchHref} />}>
            Watch the latest
          </Button>
          {showJoin && (
            <Button size="lg" variant="outline" nativeButton={false} render={<Link href="/join" />}>
              Join the community
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
