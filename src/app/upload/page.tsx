import { notFound } from 'next/navigation';
import { PageHeading } from '@/components/page-heading';
import { UploadForm } from '@/components/upload-form';
import { isAdmin } from '@/lib/auth';

export const metadata = { title: 'Upload · Experience Community' };

export default async function UploadPage() {
  if (!(await isAdmin())) notFound();

  return (
    <main className="mx-auto max-w-xl px-4 py-12">
      <PageHeading title="Upload a video" eyebrow="owner" size="small">
        The file goes straight to storage. A thumbnail is taken from the first second.
      </PageHeading>
      <div className="glass-panel mt-8 p-6">
        <UploadForm />
      </div>
    </main>
  );
}
