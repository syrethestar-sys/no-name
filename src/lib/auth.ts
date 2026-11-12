import 'server-only';
import { cache } from 'react';
import { auth, currentUser } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';
import { getDb } from '@/db';
import { members } from '@/db/schema';
import type { Member, MemberStatus } from '@/types/db';

/** True when the signed-in user has Clerk publicMetadata.role === "admin". Cached per request. */
export const isAdmin = cache(async (): Promise<boolean> => {
  const { userId } = await auth();
  if (!userId) return false;

  const user = await currentUser();
  return user?.publicMetadata.role === 'admin';
});

/** Use at the top of admin-only API routes and pages. Returns the userId or null. */
export async function getAdminUserId(): Promise<string | null> {
  const { userId } = await auth();
  if (!userId) return null;
  return (await isAdmin()) ? userId : null;
}

export type Viewer = {
  userId: string | null;
  isOwner: boolean;
  /** null = never asked to join. */
  memberStatus: MemberStatus | null;
  membership: Member | null;
  /** Owner or approved member: may watch members-only videos and interact. */
  isMember: boolean;
};

/** Who is looking at this page, and what they're allowed to see. Cached per request. */
export const getViewer = cache(async (): Promise<Viewer> => {
  const { userId } = await auth();
  if (!userId) {
    return { userId: null, isOwner: false, memberStatus: null, membership: null, isMember: false };
  }

  const [isOwner, [membership]] = await Promise.all([
    isAdmin(),
    getDb().select().from(members).where(eq(members.userId, userId)).limit(1),
  ]);
  const memberStatus = membership?.status ?? null;
  return {
    userId,
    isOwner,
    memberStatus,
    membership: membership ?? null,
    isMember: isOwner || memberStatus === 'approved',
  };
});
