import { ActivityList } from '@/components/activity-list';
import { getMyActivity } from '@/lib/activity';
import { getViewer } from '@/lib/auth';
import { requireUserId } from '@/lib/require-user';

export const metadata = { title: 'Activity · Experience Community' };

export default async function ActivitySettingsPage() {
  const userId = await requireUserId('/settings/activity');
  const viewer = await getViewer();

  let activity: Awaited<ReturnType<typeof getMyActivity>>;
  try {
    activity = await getMyActivity(userId, viewer.isMember);
  } catch (error) {
    console.error('activity failed', error);
    return <p className="text-destructive">Could not load your activity. Refresh to try again.</p>;
  }

  return (
    <div className="flex flex-col gap-10">
      <ActivityList
        title="Liked"
        emptyText="You have not liked any video yet."
        rows={activity.liked.map((item) => ({
          key: item.video.id,
          video: item.video,
          at: item.at,
        }))}
      />
      <ActivityList
        title="Rated"
        emptyText="You have not rated any video yet."
        rows={activity.rated.map((item) => ({
          key: item.video.id,
          video: item.video,
          at: item.at,
          detail: `${'★'.repeat(item.stars)}${'☆'.repeat(5 - item.stars)}`,
        }))}
      />
      <ActivityList
        title="Comments"
        emptyText="You have not commented yet."
        rows={activity.commented.map((item) => ({
          key: item.id,
          video: item.video,
          at: item.at,
          detail: item.text,
        }))}
      />
    </div>
  );
}
