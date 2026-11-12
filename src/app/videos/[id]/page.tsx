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
import { ViewfinderCorners } from '@/components/viewfinder-corners';
import { VisibilityToggle } from '@/components/visibility-toggle';
import { getViewer } from '@/lib/auth';
import { formatDate, formatDuration } from '@/lib/format';
import { TOPIC_LABELS, VISIBILITY_LABELS } from '@/lib/labels';
import { StarRating } from '@/components/star-rating';
import { getLikeState } from '@/lib/likes';
import { COMMENTS_PAGE_SIZE } from '@/lib/comments';
import { getRatingState } from '@/lib/ratings';
import { getVideoForPage } from '@/lib/videos';

const metaChipClass =
  'rounded-md bg-glass px-2 py-0.5 font-mono text-xs text-muted-foreground shadow-[inset_0_1px_0_var(--glass-edge)]';

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

  // The side column only appears once related videos have loaded.
  return (
    <main className="mx-auto grid max-w-7xl gap-x-8 px-4 py-8 lg:has-[>aside>section]:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="mx-auto w-full max-w-5xl min-w-0">
        {video.playbackUrl ? (
          <div className="group/player relative overflow-hidden rounded-xl bg-black shadow-[0_0_80px_-24px_color-mix(in_oklab,var(--primary)_35%,transparent)]">
            <video
              src={video.playbackUrl}
              poster={video.posterUrl ?? undefined}
              controls
              playsInline
              preload="metadata"
              className="aspect-video w-full"
            />
            {/* Brackets fade while the cursor is on the player, so they never cover controls. */}
            <div className="transition-opacity duration-300 group-hover/player:opacity-0">
              <ViewfinderCorners label="PLAY" />
            </div>
          </div>
        ) : (
          <LockedVideo posterUrl={video.posterUrl} memberStatus={viewer.memberStatus} />
        )}

        <h1 className="display-title mt-6 text-4xl sm:text-5xl">{video.title}</h1>
        <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Video info">
          {[
            TOPIC_LABELS[video.topic],
            VISIBILITY_LABELS[video.visibility],
            formatDate(video.createdAt),
            duration,
          ].map(
            (info) =>
              info && (
                <li key={info} className={metaChipClass}>
                  {info}
                </li>
              ),
          )}
        </ul>
        <div className="mt-4 flex flex-wrap items-start gap-x-6 gap-y-3">
          <LikeButton
            videoId={video.id}
            initialLiked={likeState.liked}
            initialCount={likeState.likeCount}
            blocker={reactionBlocker}
          />
          <StarRating videoId={video.id} initialRating={ratingState} blocker={reactionBlocker} />
        </div>

        {viewer.isOwner && (
          <section
            aria-label="Owner tools"
            className="glass-panel mt-6 flex flex-wrap items-start justify-between gap-3 p-3"
          >
            <span className="pt-1.5 font-mono text-xs text-primary">owner</span>
            <div className="flex flex-wrap items-start justify-end gap-2">
              <TranscribeButton
                videoId={video.id}
                transcriptStatus={video.transcriptStatus}
                videoUrl={video.playbackUrl}
                hasAudio={video.audioPath !== null}
              />
              <VisibilityToggle videoId={video.id} visibility={video.visibility} />
              <DeleteVideoButton videoId={video.id} />
            </div>
          </section>
        )}

        {video.description && !video.isLocked && (
          <p className="mt-6 whitespace-pre-line leading-relaxed text-foreground/90">
            {video.description}
          </p>
        )}

        {/* A silent video transcribes to "." — not worth a panel. */}
        {!video.isLocked && video.transcript && video.transcript.split(/\s+/).length >= 5 && (
          <TranscriptPanel transcript={video.transcript} />
        )}

        {!video.isLocked && (
          <CommentsSection videoId={video.id} viewer={viewer} limit={commentLimitFrom(comments)} />
        )}
      </div>

      {/* Pinecone can be slow; don't hold the rest of the page for it. */}
      <aside>
        <Suspense fallback={null}>
          <RelatedVideos video={video} viewerIsMember={viewer.isMember} />
        </Suspense>
      </aside>
    </main>
  );
}
