import Image from 'next/image';

// Which part of each picture stays in view when the banner crops it (the TV sits lower in one).
const PICTURES = {
  'no-videos': { src: '/art/empty-no-videos.webp', position: '50% 72%' },
  'no-results': { src: '/art/empty-no-results.webp', position: '50% 58%' },
} as const;

/** A dark banner picture of an old TV with the message under it (feed and search are empty). */
export function EmptyState({
  picture,
  children,
}: {
  picture: keyof typeof PICTURES;
  children: React.ReactNode;
}) {
  const { src, position } = PICTURES[picture];

  return (
    <div className="glass-panel mt-10 overflow-hidden text-center">
      <div className="relative h-56 w-full sm:h-72">
        <Image
          src={src}
          alt=""
          fill
          sizes="(min-width: 1280px) 1200px, 100vw"
          className="object-cover"
          style={{ objectPosition: position }}
        />
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-background/80 to-transparent" />
      </div>
      <div className="px-6 pt-2 pb-10">{children}</div>
    </div>
  );
}
