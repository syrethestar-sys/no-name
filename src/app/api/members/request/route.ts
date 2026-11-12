import { auth } from '@clerk/nextjs/server';
import { getDb } from '@/db';
import { members } from '@/db/schema';
import { getViewer } from '@/lib/auth';
import { reapplyDate } from '@/lib/members';
import { JoinRequestBody } from '@/lib/request-schemas';

/** Signed-in non-members: ask to join. The owner approves on /admin/members. */
export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: 'Sign in first.' }, { status: 401 });

  const viewer = await getViewer();
  if (viewer.isMember)
    return Response.json({ error: 'You are already a member.' }, { status: 409 });
  if (viewer.memberStatus === 'pending') {
    return Response.json({ error: 'Your request is already waiting.' }, { status: 409 });
  }
  const waitUntil = reapplyDate(viewer.membership);
  if (waitUntil) {
    return Response.json(
      { error: `You can send a new request after ${waitUntil.toDateString()}.` },
      { status: 409 },
    );
  }

  const parsed = JoinRequestBody.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json(
      { error: 'Write at least 20 characters about yourself. Links must start with https://' },
      { status: 400 },
    );
  }

  const { intro, interests, link } = parsed.data;
  const values = {
    intro,
    interests: [...new Set(interests)],
    link,
    status: 'pending' as const,
    createdAt: new Date(),
    reviewedAt: null,
  };
  try {
    await getDb()
      .insert(members)
      .values({ userId, ...values })
      .onConflictDoUpdate({ target: members.userId, set: values });
    return Response.json({ status: 'pending' }, { status: 201 });
  } catch (error) {
    console.error('join request failed', error);
    return Response.json({ error: 'Could not send your request. Try again.' }, { status: 500 });
  }
}
