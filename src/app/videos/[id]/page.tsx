import type { Metadata } from 'next';
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { CommentsSection } from '@/components/comments-section';
import { DeleteVideoButton } from '@/components/delete-video-button';
import { LikeButton, type ReactionBlocker } from '@/components/like-button';
import { LockedVideo } from '@/components/locked-video';
import { RelatedVideos } from '@/components/related-videos';
import { TranscriptPanel } from '@/components/transcript-panel';
import { TranscribeButton } from '@/components/transcribe-button';
import { VisibilityToggle } from '@/components/visibility-toggle';
import { getViewer } from '@/lib/auth';
import { formatDate, formatDuration } from '@/lib/format';
import { TOPIC_LABELS, VISIBILITY_LABELS } from '@/lib/labels';
import { StarRating } from '@/components/star-rating';
import { getLikeState } from '@/lib/likes';
import { COMMENTS_PAGE_SIZE } from '@/lib/comments';
import { getRatingState } from '@/lib/ratings';
import { getVideoForPage } from '@/lib/videos';

function reactionBlockerFor(userId: string | null, isLocked: boolean): ReactionBlocker {
  if (!userId) return 'signed-out';
  return isLocked ? 'locked' : null;
}

type VideoPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ comments?: string }>;
};

/** `?comments=100` from "Show more comments"; capped so a URL can't ask for everything. */
function commentLimitFrom(value: string | undefined): number {
  const requested = Number(value);
  if (!Number.isInteger(requested) || requested < COMMENTS_PAGE_SIZE) return COMMENTS_PAGE_SIZE;
  return Math.min(requested, 500);
}

export async function generateMetadata({ params }: VideoPageProps): Promise<Metadata> {
  const { id } = await params;
  const viewer = await getViewer();
  const video = await getVideoForPage(id, viewer.isMember).catch(() => null);
  return { title: video ? `${video.title} · Experience Community` : 'Video not found' };
}

export default async function VideoPage({ params, searchParams }: VideoPageProps) {
  const { id } = await params;
  const { comments } = await searchParams;
  const viewer = await getViewer();
  const video = await getVideoForPage(id, viewer.isMember);
  if (!video) notFound();

  const [likeState, ratingState] = await Promise.all([
    getLikeState(video.id, viewer.userId),
    getRatingState(video.id, viewer.userId),
  ]);
  const reactionBlocker = reactionBlockerFor(viewer.userId, video.isLocked);
  const duration = formatDuration(video.durationSeconds);

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      {video.playbackUrl ? (
        <div className="overflow-hidden rounded-xl border bg-black">
          <video
            src={video.playbackUrl}
            poster={video.posterUrl ?? undefined}
            controls
            playsInline
            preload="metadata"
            className="aspect-video w-full"
          />
        </div>
      ) : (
        <LockedVideo posterUrl={video.posterUrl} memberStatus={viewer.memberStatus} />
      )}

      <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{video.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {TOPIC_LABELS[video.topic]} · {VISIBILITY_LABELS[video.visibility]} ·{' '}
            {formatDate(video.createdAt)}
            {duration && ` · ${duration}`}
          </p>
          <div className="mt-3 flex flex-wrap items-start gap-x-6 gap-y-3">
            <LikeButton
              videoId={video.id}
              initialLiked={likeState.liked}
              initialCount={likeState.likeCount}
              blocker={reactionBlocker}
            />
            <StarRating videoId={video.id} initialRating={ratingState} blocker={reactionBlocker} />
          </div>
        </div>
        {viewer.isOwner && (
          <div className="flex flex-col items-end gap-3">
            <div className="flex items-start gap-2">
              <VisibilityToggle videoId={video.id} visibility={video.visibility} />
              <DeleteVideoButton videoId={video.id} />
            </div>
            <TranscribeButton videoId={video.id} transcriptStatus={video.transcriptStatus} />
          </div>
        )}
      </div>

      {video.description && !video.isLocked && (
        <p className="mt-5 whitespace-pre-line leading-relaxed text-foreground/90">
          {video.description}
        </p>
      )}

      {/* A silent video transcribes to "." — not worth a panel. */}
      {!video.isLocked && video.transcript && video.transcript.split(/\s+/).length >= 5 && (
        <TranscriptPanel transcript={video.transcript} />
      )}

      {/* Pinecone can be slow; don't hold the rest of the page for it. */}
      <Suspense fallback={null}>
        <RelatedVideos video={video} viewerIsMember={viewer.isMember} />
      </Suspense>

      {!video.isLocked && (
        <CommentsSection videoId={video.id} viewer={viewer} limit={commentLimitFrom(comments)} />
      )}
    </main>
  );
}
