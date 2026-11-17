import { PageHeading } from '@/components/page-heading';
import { SettingsTabs } from '@/components/settings-tabs';
import { requireUserId } from '@/lib/require-user';

export const metadata = { title: 'Settings · Backroom' };

export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  await requireUserId('/settings');

  return (
    <main className="mx-auto max-w-4xl px-4 py-12">
      <PageHeading title="Settings" eyebrow="account" size="small">
        Your profile and how you appear on the site.
      </PageHeading>
      <div className="mt-8 flex flex-col gap-6 md:flex-row md:gap-10">
        <SettingsTabs />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </main>
  );
}
