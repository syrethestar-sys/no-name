import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { getDb } from '@/db';
import { members } from '@/db/schema';
import { getAdminUserId } from '@/lib/auth';

type RouteContext = { params: Promise<{ userId: string }> };

// "rejected" is also used to remove an approved member.
const Body = z.object({ status: z.enum(['approved', 'rejected']) });

/** Owner only: approve or reject a join request (or remove a member). */
export async function PATCH(request: Request, { params }: RouteContext) {
  const adminUserId = await getAdminUserId();
  if (!adminUserId) return Response.json({ error: 'Only the owner can review.' }, { status: 403 });

  const { userId } = await params;
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: 'Unknown status.' }, { status: 400 });

  try {
    const [updated] = await getDb()
      .update(members)
      .set({ status: parsed.data.status, reviewedAt: new Date() })
      .where(eq(members.userId, userId))
      .returning({ userId: members.userId, status: members.status });
    if (!updated) return Response.json({ error: 'Request not found.' }, { status: 404 });
    return Response.json(updated);
  } catch (error) {
    console.error('review member failed', error);
    return Response.json({ error: 'Could not save. Try again.' }, { status: 500 });
  }
}
