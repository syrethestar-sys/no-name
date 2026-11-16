import { notFound } from 'next/navigation';
import { PageHeading } from '@/components/page-heading';
import { UploadTabs } from '@/components/upload-tabs';
import { isAdmin } from '@/lib/auth';

export const metadata = { title: 'Upload · Experience Community' };

export default async function UploadPage() {
  if (!(await isAdmin())) notFound();

  return (
    <main className="mx-auto max-w-xl px-4 py-12">
      <PageHeading title="Upload a video" eyebrow="owner" size="small">
        Upload the file here, or paste the link of an Unlisted YouTube video. Either way a thumbnail
        is taken from the first second.
      </PageHeading>
      <div className="glass-panel mt-8 p-6">
        <UploadTabs />
      </div>
    </main>
  );
}
