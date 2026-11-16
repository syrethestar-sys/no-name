import { auth, clerkClient, reverificationErrorResponse } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { getDb } from '@/db';
import { comments, likes, members, ratings } from '@/db/schema';
import { isAdmin } from '@/lib/auth';
import { deleteAccount } from '@/lib/delete-account';

const Body = z.object({ confirm: z.literal('DELETE') });

/** Signed-in person deletes their own account and everything they left on the site. */
export async function DELETE(request: Request) {
  const { userId, has } = await auth();
  if (!userId) return Response.json({ error: 'Sign in first.' }, { status: 401 });

  if (!Body.safeParse(await request.json().catch(() => null)).success) {
    return Response.json({ error: 'Type DELETE to confirm.' }, { status: 400 });
  }
  // The sign-in cookie alone must not be enough: Clerk asks for a fresh check (a code by email).
  if (!has({ reverification: 'strict' })) return reverificationErrorResponse('strict');

  try {
    const result = await deleteAccount(userId, {
      isOwner: () => isAdmin(),
      deleteData: async (id) => {
        // Deleting a comment also deletes the replies under it (the database cascades).
        await getDb().transaction(async (tx) => {
          await tx.delete(likes).where(eq(likes.userId, id));
          await tx.delete(ratings).where(eq(ratings.userId, id));
          await tx.delete(comments).where(eq(comments.userId, id));
          await tx.delete(members).where(eq(members.userId, id));
        });
      },
      deleteLogin: async (id) => {
        await (await clerkClient()).users.deleteUser(id);
      },
    });
    if (result === 'owner') {
      return Response.json({ error: 'The owner account cannot be deleted.' }, { status: 403 });
    }
    return Response.json({ deleted: true });
  } catch (error) {
    console.error('delete account failed', error);
    return Response.json({ error: 'Could not delete the account. Try again.' }, { status: 500 });
  }
}
