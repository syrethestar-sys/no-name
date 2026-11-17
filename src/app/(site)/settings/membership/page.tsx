import Link from 'next/link';
import { getViewer } from '@/lib/auth';
import { formatDate } from '@/lib/format';
import { reapplyDate } from '@/lib/members';
import { requireUserId } from '@/lib/require-user';

export const metadata = { title: 'Membership · Backroom' };

const LINK_CLASS = 'text-primary hover:underline';

export default async function MembershipSettingsPage() {
  await requireUserId('/settings/membership');
  const viewer = await getViewer();
  const waitUntil = reapplyDate(viewer.membership);

  let title: string;
  let body: React.ReactNode;
  if (viewer.isOwner) {
    title = 'You are the owner';
    body = (
      <>
        You can watch everything and manage the site.{' '}
        <Link href="/upload" className={LINK_CLASS}>
          Upload
        </Link>{' '}
        ·{' '}
        <Link href="/admin/members" className={LINK_CLASS}>
          Members
        </Link>
      </>
    );
  } else if (viewer.isMember) {
    title = "You're a member";
    body = (
      <>
        {viewer.membership?.reviewedAt &&
          `Approved on ${formatDate(viewer.membership.reviewedAt)}. `}
        You can watch members-only videos, like, rate and comment.{' '}
        <Link href="/" className={LINK_CLASS}>
          Watch all videos →
        </Link>
      </>
    );
  } else if (viewer.memberStatus === 'pending' && viewer.membership) {
    title = 'Request pending';
    body = `Sent on ${formatDate(viewer.membership.createdAt)}. The owner reviews every request.`;
  } else if (waitUntil) {
    title = 'Your last request was not approved';
    body = `You can send a new one after ${waitUntil.toDateString()}.`;
  } else {
    title = 'Not a member yet';
    body = (
      <>
        Anyone can watch the public videos. Members also see the members-only ones.{' '}
        <Link href="/join" className={LINK_CLASS}>
          Request to join →
        </Link>
      </>
    );
  }

  return (
    <div className="glass-panel p-6">
      <h2 className="font-medium">{title}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}
