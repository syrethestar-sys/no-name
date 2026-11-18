import Image from 'next/image';

const corner = 'absolute size-3 border-pf-accent';

/** The owner's photo in a frame with four mint corner brackets, like the viewfinder's focus frame. */
export function PortraitCard({ name }: { name: string }) {
  return (
    <figure className="relative max-w-xs p-2 xl:max-w-none">
      <span aria-hidden className={`${corner} top-0 left-0 border-t border-l`} />
      <span aria-hidden className={`${corner} top-0 right-0 border-t border-r`} />
      <span aria-hidden className={`${corner} bottom-0 left-0 border-b border-l`} />
      <span aria-hidden className={`${corner} right-0 bottom-0 border-r border-b`} />
      <Image
        src="/portfolio/portrait.webp"
        alt={name}
        width={1200}
        height={1800}
        sizes="(min-width: 1280px) 18rem, 20rem"
        priority
        className="aspect-[2/3] w-full object-cover"
      />
    </figure>
  );
}
