import Link from 'next/link';
import { SignInButton } from '@/components/auth/sign-in-button';
import { JoinForm } from '@/components/join-form';
import { PageHeading } from '@/components/page-heading';
import { getViewer } from '@/lib/auth';
import { reapplyDate } from '@/lib/members';

export const metadata = { title: 'Join · Experience Community' };

function Notice({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="glass-panel p-6">
      <h2 className="font-medium">{title}</h2>
      {children && <div className="mt-2 text-sm text-muted-foreground">{children}</div>}
    </div>
  );
}

export default async function JoinPage() {
  const viewer = await getViewer();
  const waitUntil = reapplyDate(viewer.membership);

  let content: React.ReactNode;
  if (!viewer.userId) {
    content = (
      <Notice title="Sign in to send a request">
        <SignInButton className="mt-2" />
      </Notice>
    );
  } else if (viewer.isMember) {
    content = (
      <Notice title="You're a member">
        <Link href="/" className="text-primary hover:underline">
          Watch all videos →
        </Link>
      </Notice>
    );
  } else if (viewer.memberStatus === 'pending') {
    content = (
      <Notice title="Request sent ✓">
        The owner reviews every request. You will get access to members-only videos once approved.
      </Notice>
    );
  } else if (waitUntil) {
    content = (
      <Notice title="Your last request was not approved">
        You can send a new one after {waitUntil.toDateString()}.
      </Notice>
    );
  } else {
    content = (
      <div className="glass-panel p-6">
        <JoinForm />
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-xl px-4 py-12">
      <PageHeading title="Join the community" eyebrow="membership" size="small">
        A small group of people who grow together. Anyone can watch the public videos; members see
        everything. The owner reviews every request.
      </PageHeading>
      <div className="mt-8">{content}</div>
    </main>
  );
}
