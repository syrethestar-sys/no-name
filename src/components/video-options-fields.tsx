'use client';

import { Label } from '@/components/ui/label';
import { TOPIC_LABELS, VISIBILITY_LABELS } from '@/lib/labels';
import type { VideoTopic, VideoVisibility } from '@/types/db';

const selectClass =
  'h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50';

const TOPICS = Object.keys(TOPIC_LABELS) as VideoTopic[];

export function VideoOptionsFields({
  topic,
  visibility,
  disabled,
  onTopicChange,
  onVisibilityChange,
}: {
  topic: VideoTopic;
  visibility: VideoVisibility;
  disabled: boolean;
  onTopicChange: (topic: VideoTopic) => void;
  onVisibilityChange: (visibility: VideoVisibility) => void;
}) {
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <div className="flex flex-col gap-2">
        <Label htmlFor="video-topic">Topic</Label>
        <select
          id="video-topic"
          className={selectClass}
          value={topic}
          disabled={disabled}
          onChange={(event) => onTopicChange(event.target.value as VideoTopic)}
        >
          {TOPICS.map((option) => (
            <option key={option} value={option}>
              {TOPIC_LABELS[option]}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="video-visibility">Who can watch</Label>
        <select
          id="video-visibility"
          className={selectClass}
          value={visibility}
          disabled={disabled}
          onChange={(event) => onVisibilityChange(event.target.value as VideoVisibility)}
        >
          <option value="members">{VISIBILITY_LABELS.members}</option>
          <option value="public">{VISIBILITY_LABELS.public} (teaser for everyone)</option>
        </select>
      </div>
    </div>
  );
}
