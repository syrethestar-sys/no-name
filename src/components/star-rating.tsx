'use client';

import { useState } from 'react';
import { StarIcon } from 'lucide-react';
import { useAuthDialog } from '@/components/auth/auth-dialog-provider';
import { formatRating } from '@/lib/format';
import type { ReactionBlocker } from '@/components/like-button';

type RatingResponse = { myStars: number | null; average: number | null; ratingCount: number };

const STARS = [1, 2, 3, 4, 5] as const;

/** Click a star to rate, another to change it, your current one again to remove it. */
export function StarRating({
  videoId,
  initialRating,
  blocker,
}: {
  videoId: string;
  initialRating: RatingResponse;
  blocker: ReactionBlocker;
}) {
  const { openAuthDialog } = useAuthDialog();
  const [rating, setRating] = useState(initialRating);
  const [hoveredStars, setHoveredStars] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const canRate = blocker === null;
  const shownStars = canRate
    ? (hoveredStars ?? rating.myStars ?? 0)
    : Math.round(rating.average ?? 0);

  async function saveRating(stars: number) {
    const isClearing = stars === rating.myStars;
    const previous = rating;
    // Optimistic: show your stars now; the server sends back the new average.
    setRating({ ...rating, myStars: isClearing ? null : stars });
    setIsSaving(true);
    setErrorMessage(null);

    const response = await fetch(`/api/videos/${videoId}/rating`, {
      method: isClearing ? 'DELETE' : 'PUT',
      headers: { 'content-type': 'application/json' },
      body: isClearing ? undefined : JSON.stringify({ stars }),
    }).catch(() => null);
    const saved: RatingResponse | null = response?.ok
      ? await response.json().catch(() => null)
      : null;
    setIsSaving(false);

    if (!saved) {
      setRating(previous);
      setErrorMessage('Could not save. Try again.');
      return;
    }
    setRating(saved);
  }

  const summary =
    rating.ratingCount > 0
      ? `${formatRating(rating.average)} · ${rating.ratingCount} ${rating.ratingCount === 1 ? 'rating' : 'ratings'}`
      : 'No ratings yet';

  return (
    <div className="flex flex-col items-start gap-1">
      <div className="flex flex-wrap items-center gap-3">
        <div
          role="group"
          aria-label={rating.myStars ? `Your rating: ${rating.myStars} of 5` : 'Rate this video'}
          className="flex"
          onMouseLeave={() => setHoveredStars(null)}
        >
          {STARS.map((stars) => (
            <button
              key={stars}
              type="button"
              disabled={!canRate || isSaving}
              aria-label={
                stars === rating.myStars
                  ? `Remove your ${stars}-star rating`
                  : `Rate ${stars} out of 5`
              }
              aria-pressed={stars === rating.myStars}
              onMouseEnter={() => canRate && setHoveredStars(stars)}
              onClick={() => saveRating(stars)}
              className="rounded p-0.5 text-muted-foreground transition-colors enabled:hover:text-primary disabled:cursor-default focus-visible:outline-2 focus-visible:outline-ring"
            >
              <StarIcon
                className={`size-5 ${stars <= shownStars ? 'fill-primary text-primary' : ''}`}
                aria-hidden
              />
            </button>
          ))}
        </div>
        <span className="font-mono text-sm text-muted-foreground">{summary}</span>
        {blocker === 'signed-out' && (
          <button
            type="button"
            className="text-sm text-primary hover:underline"
            onClick={openAuthDialog}
          >
            Sign in to rate
          </button>
        )}
      </div>
      {errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}
    </div>
  );
}
