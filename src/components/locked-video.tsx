import Image from 'next/image';
import Link from 'next/link';
import { LockIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { MemberStatus } from '@/types/db';

const MESSAGES: Record<'none' | MemberStatus, string> = {
  none: 'This video is for members. Request to join — the owner reviews every request.',
  pending: 'Your request to join is waiting for the owner. You will get access once approved.',
  rejected: 'Your last request was not approved. You can send a new one later.',
  approved: '',
};

/** Shown instead of the player when a members-only video is opened by a non-member. */
export function LockedVideo({
  posterUrl,
  memberStatus,
}: {
  posterUrl: string | null;
  memberStatus: MemberStatus | null;
}) {
  const showJoinButton = memberStatus === null || memberStatus === 'rejected';

  return (
    <div className="relative aspect-video overflow-hidden rounded-xl bg-thumb">
      {posterUrl && (
        <Image
          src={posterUrl}
          alt=""
          fill
          unoptimized
          className="scale-110 object-cover blur-lg brightness-40"
        />
      )}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
        <LockIcon className="size-7 text-primary" aria-hidden />
        <p className="max-w-sm text-sm">{MESSAGES[memberStatus ?? 'none']}</p>
        {showJoinButton && (
          <Button nativeButton={false} render={<Link href="/join" />}>
            Request to join
          </Button>
        )}
      </div>
    </div>
  );
}
