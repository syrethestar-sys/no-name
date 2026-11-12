'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAuthDialog } from '@/components/auth/auth-dialog-provider';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

const MAX_LENGTH = 2000;

/** New comment, or a reply when `parentId` is set. The server re-renders the list after posting. */
export function CommentForm({
  videoId,
  parentId,
  isSignedIn,
  placeholder = 'Add a comment…',
  autoFocus = false,
  onDone,
}: {
  videoId: string;
  parentId?: string;
  isSignedIn: boolean;
  placeholder?: string;
  autoFocus?: boolean;
  /** Called after posting or cancelling (reply forms close themselves). */
  onDone?: () => void;
}) {
  const router = useRouter();
  const { openAuthDialog } = useAuthDialog();
  const [text, setText] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const trimmedLength = text.trim().length;

  if (!isSignedIn) {
    return (
      <button
        type="button"
        className="text-sm text-primary hover:underline"
        onClick={openAuthDialog}
      >
        Sign in to comment
      </button>
    );
  }

  async function postComment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (trimmedLength === 0) return;
    setIsPosting(true);
    setErrorMessage(null);

    const response = await fetch(`/api/videos/${videoId}/comments`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text, parentId }),
    }).catch(() => null);
    setIsPosting(false);

    if (!response?.ok) {
      const body: { error?: string } | null = await response?.json().catch(() => null);
      setErrorMessage(body?.error ?? 'Could not save. Try again.');
      return;
    }
    setText('');
    onDone?.();
    router.refresh();
  }

  return (
    <form onSubmit={postComment} className="flex flex-col gap-2">
      <Textarea
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder={placeholder}
        aria-label={parentId ? 'Your reply' : 'Your comment'}
        maxLength={MAX_LENGTH}
        autoFocus={autoFocus}
        disabled={isPosting}
      />
      <div className="flex items-center justify-between gap-3">
        <span className="font-mono text-xs text-muted-foreground">
          {trimmedLength}/{MAX_LENGTH}
        </span>
        <div className="flex gap-2">
          {onDone && (
            <Button type="button" variant="ghost" disabled={isPosting} onClick={onDone}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isPosting || trimmedLength === 0}>
            {isPosting ? 'Posting…' : parentId ? 'Reply' : 'Post'}
          </Button>
        </div>
      </div>
      {errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}
    </form>
  );
}
