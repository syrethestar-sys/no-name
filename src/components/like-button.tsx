'use client';

import Link from 'next/link';
import { useState } from 'react';
import { SignInButton } from '@clerk/nextjs';
import { HeartIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

/** Why the viewer can't like: shown as a hint next to the count. */
export type LikeBlocker = 'signed-out' | 'not-member' | 'pending' | null;

type LikeResponse = { liked: boolean; likeCount: number };

const hintClass = 'text-sm text-primary hover:underline';

export function LikeButton({
  videoId,
  initialLiked,
  initialCount,
  blocker,
}: {
  videoId: string;
  initialLiked: boolean;
  initialCount: number;
  blocker: LikeBlocker;
}) {
  const [liked, setLiked] = useState(initialLiked);
  const [likeCount, setLikeCount] = useState(initialCount);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function toggleLike() {
    const nextLiked = !liked;
    // Optimistic: show the change now, roll back if the server says no.
    setLiked(nextLiked);
    setLikeCount((current) => current + (nextLiked ? 1 : -1));
    setIsSaving(true);
    setErrorMessage(null);

    const response = await fetch(`/api/videos/${videoId}/like`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ liked: nextLiked }),
    }).catch(() => null);
    const saved: LikeResponse | null = response?.ok
      ? await response.json().catch(() => null)
      : null;
    setIsSaving(false);

    if (!saved) {
      setLiked(!nextLiked);
      setLikeCount((current) => current - (nextLiked ? 1 : -1));
      setErrorMessage('Could not save. Try again.');
      return;
    }
    setLiked(saved.liked);
    setLikeCount(saved.likeCount);
  }

  if (blocker) {
    return (
      <div className="flex items-center gap-3">
        <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <HeartIcon className="size-4" aria-hidden />
          {likeCount}
        </span>
        {blocker === 'signed-out' && (
          <SignInButton mode="modal">
            <button type="button" className={hintClass}>
              Sign in to like
            </button>
          </SignInButton>
        )}
        {blocker === 'not-member' && (
          <Link href="/join" className={hintClass}>
            Join to like
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <Button
        variant="outline"
        aria-pressed={liked}
        aria-label={`${liked ? 'Unlike' : 'Like'} (${likeCount} likes)`}
        disabled={isSaving}
        onClick={toggleLike}
      >
        <HeartIcon className={liked ? 'fill-primary text-primary' : ''} aria-hidden />
        {likeCount}
      </Button>
      {errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}
    </div>
  );
}
