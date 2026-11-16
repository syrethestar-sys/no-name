import Image from 'next/image';

/**
 * A dim picture of the room of glowing TVs behind a page. Put it first inside a parent that is
 * `relative isolate`; the page's own content sits on top of it. The TVs are at the picture's
 * far edges, so on a narrow screen it is shown whole along the bottom instead of cropped.
 */
export function PageBackdrop() {
  return (
    <>
      <Image
        src="/art/backdrop-02.webp"
        alt=""
        fill
        priority
        sizes="100vw"
        className="-z-10 object-contain object-bottom opacity-80 sm:object-cover sm:object-center sm:opacity-70"
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-background/60 via-transparent to-background" />
    </>
  );
}
