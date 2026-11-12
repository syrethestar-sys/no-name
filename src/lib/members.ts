import 'server-only';
import { clerkClient } from '@clerk/nextjs/server';
import { count, desc, eq, inArray } from 'drizzle-orm';
import { getDb } from '@/db';
import { members } from '@/db/schema';
import type { Member, MemberInterest } from '@/types/db';

export const MEMBER_INTERESTS = [
  'trading',
  'coding',
  'sharing',
  'other',
] as const satisfies readonly MemberInterest[];

/** After a rejection, a person can send a new request after this many days. */
export const REAPPLY_AFTER_DAYS = 7;

/** When a rejected person may apply again, or null if they can apply now. */
export function reapplyDate(membership: Member | null, now = new Date()): Date | null {
  if (membership?.status !== 'rejected' || !membership.reviewedAt) return null;
  const allowedAt = new Date(membership.reviewedAt.getTime() + REAPPLY_AFTER_DAYS * 86_400_000);
  return allowedAt > now ? allowedAt : null;
}

export async function countPendingRequests(): Promise<number> {
  const [row] = await getDb()
    .select({ total: count() })
    .from(members)
    .where(eq(members.status, 'pending'));
  return row?.total ?? 0;
}

export type MemberWithProfile = Member & {
  name: string;
  email: string | null;
  imageUrl: string | null;
};

/** Pending + approved members, newest first, with name/email/avatar from Clerk. */
export async function listMembersForReview(): Promise<{
  pending: MemberWithProfile[];
  approved: MemberWithProfile[];
}> {
  const rows = await getDb()
    .select()
    .from(members)
    .where(inArray(members.status, ['pending', 'approved']))
    .orderBy(desc(members.createdAt))
    .limit(200);

  const profiles = new Map<string, Omit<MemberWithProfile, keyof Member>>();
  if (rows.length > 0) {
    const client = await clerkClient();
    const { data: users } = await client.users.getUserList({
      userId: rows.map((row) => row.userId),
      limit: rows.length,
    });
    for (const user of users) {
      profiles.set(user.id, {
        name: user.fullName ?? user.username ?? 'Unnamed',
        email: user.primaryEmailAddress?.emailAddress ?? null,
        imageUrl: user.imageUrl || null,
      });
    }
  }

  const withProfile = rows.map((row) => ({
    ...row,
    ...(profiles.get(row.userId) ?? { name: 'Deleted user', email: null, imageUrl: null }),
  }));
  return {
    pending: withProfile.filter((row) => row.status === 'pending'),
    approved: withProfile.filter((row) => row.status === 'approved'),
  };
}
