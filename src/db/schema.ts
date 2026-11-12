import { sql } from 'drizzle-orm';
import {
  type AnyPgColumn,
  check,
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

// RLS is enabled with no policies on every table. The app talks to Postgres
// directly through Drizzle (server only), so Supabase's public REST API sees nothing.

export const videoStatus = pgEnum('video_status', ['processing', 'ready', 'failed']);
export const videoLanguage = pgEnum('video_language', ['mn', 'en']);
export const videoVisibility = pgEnum('video_visibility', ['public', 'members']);
export const videoTopic = pgEnum('video_topic', ['trading', 'coding', 'life']);
export const transcriptStatus = pgEnum('transcript_status', ['pending', 'done', 'failed']);
/** Where the video file lives: Supabase Storage (≤ 50 MB) or Cloudflare R2 (≤ 2 GB). */
export const storageProvider = pgEnum('storage_provider', ['supabase', 'r2']);
export const memberStatus = pgEnum('member_status', ['pending', 'approved', 'rejected']);
export const memberInterest = pgEnum('member_interest', ['trading', 'coding', 'sharing', 'other']);

export const videos = pgTable('videos', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  description: text('description').notNull().default(''),
  storagePath: text('storage_path').notNull(),
  storageProvider: storageProvider('storage_provider').notNull().default('supabase'),
  thumbnailPath: text('thumbnail_path'),
  /** Speech-only audio (Opus webm) the browser extracts; transcribed instead of the video. */
  audioPath: text('audio_path'),
  durationSeconds: integer('duration_seconds'),
  // Members-only by default: the owner opts a video into being a public teaser.
  visibility: videoVisibility('visibility').notNull().default('members'),
  topic: videoTopic('topic').notNull().default('life'),
  language: videoLanguage('language'), // detected by whisper (Phase 8); null for other languages
  transcript: text('transcript'),
  // Transcribing runs after upload; the video is watchable meanwhile.
  transcriptStatus: transcriptStatus('transcript_status').notNull().default('pending'),
  status: videoStatus('status').notNull().default('processing'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}).enableRLS();

export const likes = pgTable(
  'likes',
  {
    videoId: uuid('video_id')
      .notNull()
      .references(() => videos.id, { onDelete: 'cascade' }),
    userId: text('user_id').notNull(), // Clerk user id
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.videoId, table.userId] })],
).enableRLS();

export const ratings = pgTable(
  'ratings',
  {
    videoId: uuid('video_id')
      .notNull()
      .references(() => videos.id, { onDelete: 'cascade' }),
    userId: text('user_id').notNull(),
    stars: smallint('stars').notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.videoId, table.userId] }),
    check('ratings_stars_1_to_5', sql`${table.stars} between 1 and 5`),
  ],
).enableRLS();

export const comments = pgTable(
  'comments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    videoId: uuid('video_id')
      .notNull()
      .references(() => videos.id, { onDelete: 'cascade' }),
    userId: text('user_id').notNull(),
    // null = top-level. Replies are one level deep: the app always points parentId at a top-level comment.
    parentId: uuid('parent_id').references((): AnyPgColumn => comments.id, {
      onDelete: 'cascade',
    }),
    text: text('text').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('comments_video_created_idx').on(table.videoId, table.createdAt),
    index('comments_parent_idx').on(table.parentId),
    check('comments_text_length', sql`char_length(${table.text}) between 1 and 2000`),
  ],
).enableRLS();

// Join requests and membership. Our DB is the single source of truth;
// the owner (Clerk role "admin") always counts as a member without a row here.
export const members = pgTable(
  'members',
  {
    userId: text('user_id').primaryKey(), // Clerk user id
    status: memberStatus('status').notNull().default('pending'),
    interests: memberInterest('interests')
      .array()
      .notNull()
      .default(sql`'{}'`),
    intro: text('intro').notNull(),
    link: text('link'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  },
  (table) => [
    index('members_status_created_idx').on(table.status, table.createdAt),
    check('members_intro_length', sql`char_length(${table.intro}) between 20 and 1000`),
  ],
).enableRLS();
