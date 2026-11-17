import Link from 'next/link';
import { PageHeading } from '@/components/page-heading';

export function NotFoundMessage() {
  return (
    <main className="mx-auto max-w-xl px-4 py-24">
      <PageHeading title="Page not found" eyebrow="404" size="small">
        This page could not be found.
      </PageHeading>
      <Link href="/" className="mt-6 inline-block text-primary hover:underline">
        Back to videos →
      </Link>
    </main>
  );
}
