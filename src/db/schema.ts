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

export const videos = pgTable('videos', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  description: text('description').notNull().default(''),
  storagePath: text('storage_path').notNull(),
  thumbnailPath: text('thumbnail_path'),
  durationSeconds: integer('duration_seconds'),
  language: videoLanguage('language'), // set by whisper in Phase 7
  transcript: text('transcript'),
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
