import { notFound } from 'next/navigation';
import { UploadForm } from '@/components/upload-form';
import { isAdmin } from '@/lib/auth';

export const metadata = { title: 'Upload · Experience Community' };

export default async function UploadPage() {
  if (!(await isAdmin())) notFound();

  return (
    <main className="mx-auto max-w-xl px-4 py-12">
      <h1 className="text-2xl font-semibold tracking-tight">Upload a video</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        The file goes straight to storage. A thumbnail is taken from the first second.
      </p>
      <div className="mt-8 rounded-xl border bg-card p-6">
        <UploadForm />
      </div>
    </main>
  );
}
