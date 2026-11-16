import { DeviceSettings } from '@/components/device-settings';
import { EmailSettings } from '@/components/email-settings';
import { requireUserId } from '@/lib/require-user';

export const metadata = { title: 'Account safety · Experience Community' };

export default async function SafetySettingsPage() {
  await requireUserId('/settings/safety');

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
    </div>
  );
}
