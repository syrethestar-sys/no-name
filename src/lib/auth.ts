import 'server-only';
import { auth, currentUser } from '@clerk/nextjs/server';

/** True when the signed-in user has Clerk publicMetadata.role === "admin". */
export async function isAdmin(): Promise<boolean> {
  const { userId } = await auth();
  if (!userId) return false;

  const user = await currentUser();
  return user?.publicMetadata.role === 'admin';
}

/** Use at the top of admin-only API routes and pages. Returns the userId or null. */
export async function getAdminUserId(): Promise<string | null> {
  const { userId } = await auth();
  if (!userId) return null;
  return (await isAdmin()) ? userId : null;
}
