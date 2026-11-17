import { DeleteAccount } from '@/components/delete-account';
import { DeviceSettings } from '@/components/device-settings';
import { EmailSettings } from '@/components/email-settings';
import { getViewer } from '@/lib/auth';
import { requireUserId } from '@/lib/require-user';

export const metadata = { title: 'Account safety · Backroom' };

export default async function SafetySettingsPage() {
  await requireUserId('/settings/safety');
  const { isOwner } = await getViewer();

  return (
    <div className="flex flex-col gap-6">
      <section className="glass-panel p-6">
        <h2 className="font-medium">Email</h2>
        <p className="mt-1 mb-4 text-sm text-muted-foreground">
          You sign in with a code sent to your main email.
        </p>
        <EmailSettings />
      </section>
      <section className="glass-panel p-6">
        <h2 className="font-medium">Devices</h2>
        <p className="mt-1 mb-4 text-sm text-muted-foreground">Where you are signed in.</p>
        <DeviceSettings />
      </section>
      <section className="glass-panel border border-destructive/30 p-6">
        <h2 className="font-medium text-destructive">Delete account</h2>
        <div className="mt-2">
          <DeleteAccount isOwner={isOwner} />
        </div>
      </section>
    </div>
  );
}
