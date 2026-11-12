'use client';

import { useState } from 'react';
import { CommentDeleteButton } from '@/components/comment-delete-button';
import { CommentForm } from '@/components/comment-form';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export type CommentItemData = {
  id: string;
  text: string;
  authorName: string;
  authorImageUrl: string | null;
  postedAgo: string;
  canDelete: boolean;
};

/** One comment or reply. Replying always targets the top-level comment (`threadId`). */
export function CommentItem({
  comment,
  videoId,
  threadId,
  isSignedIn,
  children,
}: {
  comment: CommentItemData;
  videoId: string;
  threadId: string;
  isSignedIn: boolean;
  /** Replies, rendered under the text. */
  children?: React.ReactNode;
}) {
  const [isReplying, setIsReplying] = useState(false);

  return (
    <li className="flex gap-3">
      <Avatar>
        {comment.authorImageUrl && <AvatarImage src={comment.authorImageUrl} alt="" />}
        <AvatarFallback>{comment.authorName.charAt(0).toUpperCase()}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="text-sm">
          <span className="font-medium">{comment.authorName}</span>
          <span className="ml-2 font-mono text-xs text-muted-foreground">{comment.postedAgo}</span>
        </p>
        <p className="mt-1 whitespace-pre-line break-words text-sm leading-relaxed text-foreground/90">
          {comment.text}
        </p>
        <div className="mt-1.5 flex items-center gap-4">
          {isSignedIn && !isReplying && (
            <button
              type="button"
              className="text-xs text-muted-foreground hover:text-foreground"
              onClick={() => setIsReplying(true)}
            >
              Reply
            </button>
          )}
          {comment.canDelete && <CommentDeleteButton commentId={comment.id} />}
        </div>
        {isReplying && (
          <div className="mt-3">
            <CommentForm
              videoId={videoId}
              parentId={threadId}
              isSignedIn={isSignedIn}
              placeholder={`Reply to ${comment.authorName}…`}
              autoFocus
              onDone={() => setIsReplying(false)}
            />
          </div>
        )}
        {children}
      </div>
    </li>
  );
}
