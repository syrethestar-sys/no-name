import Image from 'next/image';
import { notFound } from 'next/navigation';
import { MemberReviewButtons } from '@/components/member-review-buttons';
import { PageHeading } from '@/components/page-heading';
import { isAdmin } from '@/lib/auth';
import { formatDate } from '@/lib/format';
import { listMembersForReview, type MemberWithProfile } from '@/lib/members';

export const metadata = { title: 'Members · Experience Community' };

function MemberRow({ member, mode }: { member: MemberWithProfile; mode: 'pending' | 'approved' }) {
  return (
    <li className="flex flex-wrap items-start justify-between gap-4 glass-panel p-4">
      <div className="flex min-w-0 flex-1 gap-3">
        {member.imageUrl ? (
          <Image
            src={member.imageUrl}
            alt=""
            width={40}
            height={40}
            unoptimized
            className="size-10 shrink-0 rounded-full"
          />
        ) : (
          <div className="size-10 shrink-0 rounded-full bg-secondary" />
        )}
        <div className="min-w-0">
          <p className="font-medium">
            {member.name}
            {member.email && (
              <span className="ml-2 text-sm text-muted-foreground">{member.email}</span>
            )}
          </p>
          <p className="text-xs text-muted-foreground">
            {mode === 'pending' ? 'Requested' : 'Member since'}{' '}
            {formatDate(member.reviewedAt ?? member.createdAt)}
            {member.interests.length > 0 && ` · ${member.interests.join(', ')}`}
          </p>
          <p className="mt-2 text-sm whitespace-pre-line">{member.intro}</p>
          {member.link && (
            <a
              href={member.link}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="mt-1 inline-block text-sm break-all text-primary hover:underline"
            >
              {member.link}
            </a>
          )}
        </div>
      </div>
      <MemberReviewButtons userId={member.userId} mode={mode} />
    </li>
  );
}

export default async function AdminMembersPage() {
  if (!(await isAdmin())) notFound();

  const { pending, approved } = await listMembersForReview();

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <PageHeading title="Members" eyebrow="owner" size="small" />

      <h2 className="mt-8 font-medium">Waiting for review ({pending.length})</h2>
      {pending.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">No new requests.</p>
      ) : (
        <ul className="mt-3 flex flex-col gap-3">
          {pending.map((member) => (
            <MemberRow key={member.userId} member={member} mode="pending" />
          ))}
        </ul>
      )}

      <h2 className="mt-10 font-medium">Members ({approved.length})</h2>
      {approved.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">No members yet.</p>
      ) : (
        <ul className="mt-3 flex flex-col gap-3">
          {approved.map((member) => (
            <MemberRow key={member.userId} member={member} mode="approved" />
          ))}
        </ul>
      )}
    </main>
  );
}
