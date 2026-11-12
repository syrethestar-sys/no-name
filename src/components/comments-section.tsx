import Link from 'next/link';
import { CommentForm } from '@/components/comment-form';
import { CommentItem, type CommentItemData } from '@/components/comment-item';
import { COMMENTS_PAGE_SIZE, type CommentView, listComments } from '@/lib/comments';
import { formatTimeAgo } from '@/lib/format';

/** Comments under a video the viewer can watch. Locked videos don't render this at all. */
export async function CommentsSection({
  videoId,
  viewer,
  limit,
}: {
  videoId: string;
  viewer: { userId: string | null; isOwner: boolean };
  limit: number;
}) {
  const { threads, totalCount, hasMore } = await listComments(videoId, limit);
  const isSignedIn = viewer.userId !== null;
  const now = new Date();
  const toItem = (comment: CommentView): CommentItemData => ({
    id: comment.id,
    text: comment.text,
    authorName: comment.author.name,
    authorImageUrl: comment.author.imageUrl,
    postedAgo: formatTimeAgo(comment.createdAt, now),
    canDelete: viewer.isOwner || comment.userId === viewer.userId,
  });

  return (
    <section aria-labelledby="comments-heading" className="mt-10 border-t pt-6">
      <h2 id="comments-heading" className="text-lg font-semibold">
        Comments <span className="font-mono text-sm text-muted-foreground">{totalCount}</span>
      </h2>
      <div className="mt-4">
        <CommentForm videoId={videoId} isSignedIn={isSignedIn} />
      </div>

      {threads.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">No comments yet. Be the first.</p>
      ) : (
        <ul className="mt-6 flex flex-col gap-6">
          {threads.map((thread) => (
            <CommentItem
              key={thread.id}
              comment={toItem(thread)}
              videoId={videoId}
              threadId={thread.id}
              isSignedIn={isSignedIn}
            >
              {thread.replies.length > 0 && (
                <ul className="mt-4 flex flex-col gap-4 border-l pl-4">
                  {thread.replies.map((reply) => (
                    <CommentItem
                      key={reply.id}
                      comment={toItem(reply)}
                      videoId={videoId}
                      threadId={thread.id}
                      isSignedIn={isSignedIn}
                    />
                  ))}
                </ul>
              )}
            </CommentItem>
          ))}
        </ul>
      )}

      {hasMore && (
        <Link
          href={`?comments=${limit + COMMENTS_PAGE_SIZE}#comments-heading`}
          scroll={false}
          className="mt-6 inline-block text-sm text-primary hover:underline"
        >
          Show more comments
        </Link>
      )}
    </section>
  );
}
