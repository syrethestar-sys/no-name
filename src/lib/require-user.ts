import 'server-only';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

/** For signed-in-only pages: the user's id, or a redirect to sign in that comes back to `returnTo`. */
export async function requireUserId(returnTo: string): Promise<string> {
  const { userId } = await auth();
  if (!userId) redirect(`/sign-in?redirect_url=${encodeURIComponent(returnTo)}`);
  return userId;
}
