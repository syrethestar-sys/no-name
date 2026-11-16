import { ProfileForm } from '@/components/profile-form';
import { requireUserId } from '@/lib/require-user';

export const metadata = { title: 'Profile · Experience Community' };

export default async function ProfileSettingsPage() {
  await requireUserId('/settings/profile');

  return (
    <div className="glass-panel p-6">
      <ProfileForm />
    </div>
  );
}
