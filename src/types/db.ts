import type { comments, likes, members, ratings, videos } from '@/db/schema';

export type Video = typeof videos.$inferSelect;
export type NewVideo = typeof videos.$inferInsert;
export type Like = typeof likes.$inferSelect;
export type Rating = typeof ratings.$inferSelect;
export type Comment = typeof comments.$inferSelect;
export type NewComment = typeof comments.$inferInsert;
export type Member = typeof members.$inferSelect;
export type MemberStatus = Member['status'];
export type MemberInterest = Member['interests'][number];
export type VideoVisibility = Video['visibility'];
export type VideoTopic = Video['topic'];
