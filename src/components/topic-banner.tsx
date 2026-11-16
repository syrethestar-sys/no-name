import Image from 'next/image';
import { PageHeading } from '@/components/page-heading';
import { TOPIC_LABELS } from '@/lib/labels';
import type { VideoTopic } from '@/types/db';

// `position` keeps the interesting part of each picture in view when the banner crops it.
const COVERS: Record<VideoTopic, { src: string; position: string; line: string }> = {
  trading: {
    src: '/art/topic-trading.webp',
    position: '50% 55%',
    line: 'Charts, trades and what came out of them.',
  },
  coding: {
    src: '/art/topic-coding.webp',
    position: '50% 50%',
    line: 'Building things, one commit at a time.',
  },
  life: {
    src: '/art/topic-life.webp',
    position: '60% 60%',
    line: 'Work and everyday life, as it happened.',
  },
};

/** The feed's heading when one topic is picked: a cover picture with the title over it. */
export function TopicBanner({ topic, eyebrow }: { topic: VideoTopic; eyebrow: React.ReactNode }) {
  const cover = COVERS[topic];

  return (
    <div className="relative isolate overflow-hidden rounded-xl">
      <Image
        src={cover.src}
        alt=""
        fill
        priority
        sizes="(min-width: 1280px) 1280px, 100vw"
        className="-z-10 object-cover"
        style={{ objectPosition: cover.position }}
      />
      {/* Dark on the text side so the title stays readable over any picture. */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-background via-background/75 to-background/10" />
      <div className="px-6 py-12 sm:px-10 sm:py-16">
        <PageHeading title={TOPIC_LABELS[topic]} eyebrow={eyebrow}>
          {cover.line}
        </PageHeading>
      </div>
    </div>
  );
}
