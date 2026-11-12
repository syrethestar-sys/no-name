import type { FeedSort } from '@/lib/videos';
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

export const SORT_LABELS: Record<FeedSort, string> = {
  newest: 'Newest',
  liked: 'Most liked',
  rated: 'Top rated',
};
