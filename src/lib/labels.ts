import type { VideoTopic, VideoVisibility } from '@/types/db';

export const TOPIC_LABELS: Record<VideoTopic, string> = {
  trading: 'Trading',
  coding: 'Coding',
  life: 'Work & life',
};

export const VISIBILITY_LABELS: Record<VideoVisibility, string> = {
  public: 'Public',
  members: 'Members only',
};
