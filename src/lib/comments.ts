import 'server-only';
import { clerkClient } from '@clerk/nextjs/server';
import { and, asc, count, desc, eq, gt, inArray, isNull, sql } from 'drizzle-orm';
import { getDb } from '@/db';
import { comments } from '@/db/schema';

export const COMMENT_MAX_LENGTH = 2000;
export const COMMENTS_PAGE_SIZE = 50;
const COMMENTS_PER_MINUTE = 5;

export type CommentAuthor = { name: string; imageUrl: string | null };
export type CommentView = {
  id: string;
  userId: string;
  text: string;
  createdAt: Date;
  author: CommentAuthor;
};
export type CommentThread = CommentView & { replies: CommentView[] };
export type CommentList = { threads: CommentThread[]; totalCount: number; hasMore: boolean };

const FALLBACK_AUTHOR: CommentAuthor = { name: 'Member', imageUrl: null };

/** Names and avatars live in Clerk, never in our DB. One batch call per page. */
async function findAuthors(userIds: string[]): Promise<Map<string, CommentAuthor>> {
  const authors = new Map<string, CommentAuthor>();
  if (userIds.length === 0) return authors;
  try {
    const client = await clerkClient();
    const { data: users } = await client.users.getUserList({
      userId: userIds,
      limit: userIds.length,
    });
    for (const user of users) {
      authors.set(user.id, {
        name: user.fullName || user.username || FALLBACK_AUTHOR.name,
        imageUrl: user.imageUrl || null,
      });
    }
  } catch (error) {
    // Clerk down: show "Member" instead of failing the page.
    console.error('comment authors lookup failed', error);
  }
  return authors;
}

/** Newest top-level comments (up to `limit`) with their replies oldest first. */
export async function listComments(
  videoId: string,
  limit = COMMENTS_PAGE_SIZE,
): Promise<CommentList> {
  const db = getDb();
  const [topLevel, [total]] = await Promise.all([
    db
      .select()
      .from(comments)
      .where(and(eq(comments.videoId, videoId), isNull(comments.parentId)))
      .orderBy(desc(comments.createdAt))
      .limit(limit + 1),
    db.select({ totalCount: count() }).from(comments).where(eq(comments.videoId, videoId)),
  ]);
  const hasMore = topLevel.length > limit;
  const shown = topLevel.slice(0, limit);

  const replies =
    shown.length > 0
      ? await db
          .select()
          .from(comments)
          .where(
            inArray(
              comments.parentId,
              shown.map((comment) => comment.id),
            ),
          )
          .orderBy(asc(comments.createdAt))
      : [];

  const authors = await findAuthors([...new Set([...shown, ...replies].map((row) => row.userId))]);
  const toView = (row: (typeof shown)[number]): CommentView => ({
    id: row.id,
    userId: row.userId,
    text: row.text,
    createdAt: row.createdAt,
    author: authors.get(row.userId) ?? FALLBACK_AUTHOR,
  });

  return {
    threads: shown.map((comment) => ({
      ...toView(comment),
      replies: replies.filter((reply) => reply.parentId === comment.id).map(toView),
    })),
    totalCount: total?.totalCount ?? 0,
    hasMore,
  };
}

export type PostCommentResult =
  { ok: true; commentId: string } | { ok: false; reason: 'parent-missing' | 'too-fast' };

/** Adds a comment or reply. A reply to a reply attaches to its top-level comment (one level deep). */
export async function postComment(input: {
  videoId: string;
  userId: string;
  text: string;
  parentId?: string;
}): Promise<PostCommentResult> {
  const db = getDb();
  const [[recent], parent] = await Promise.all([
    db
      .select({ recentCount: count() })
      .from(comments)
      .where(
        and(
          eq(comments.userId, input.userId),
          gt(comments.createdAt, sql`now() - interval '1 minute'`),
        ),
      ),
    input.parentId
      ? db
          .select({ id: comments.id, parentId: comments.parentId })
          .from(comments)
          .where(and(eq(comments.id, input.parentId), eq(comments.videoId, input.videoId)))
          .limit(1)
          .then(([row]) => row ?? null)
      : Promise.resolve(null),
  ]);
  if ((recent?.recentCount ?? 0) >= COMMENTS_PER_MINUTE) return { ok: false, reason: 'too-fast' };
  if (input.parentId && !parent) return { ok: false, reason: 'parent-missing' };

  const [created] = await db
    .insert(comments)
    .values({
      videoId: input.videoId,
      userId: input.userId,
      text: input.text,
      parentId: parent ? (parent.parentId ?? parent.id) : null,
    })
    .returning({ id: comments.id });
  if (!created) throw new Error('comment insert returned no row');
  return { ok: true, commentId: created.id };
}

export async function findCommentOwner(commentId: string): Promise<string | null> {
  const [row] = await getDb()
    .select({ userId: comments.userId })
    .from(comments)
    .where(eq(comments.id, commentId))
    .limit(1);
  return row?.userId ?? null;
}

/** Replies go with it (parent_id cascades). */
export async function deleteComment(commentId: string): Promise<void> {
  await getDb().delete(comments).where(eq(comments.id, commentId));
}
