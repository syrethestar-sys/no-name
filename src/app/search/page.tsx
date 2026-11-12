import type { Metadata } from 'next';
import { unstable_rethrow } from 'next/navigation';
import { SearchIcon } from 'lucide-react';
import { PageHeading } from '@/components/page-heading';
import { VideoCard } from '@/components/video-card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { getViewer } from '@/lib/auth';
import { searchVideos, type SearchOutcome } from '@/lib/search';

export const metadata: Metadata = { title: 'Search · Experience Community' };

type SearchPageProps = { searchParams: Promise<{ q?: string }> };

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q } = await searchParams;
  const query = (q ?? '').trim().slice(0, 200);

  let outcome: SearchOutcome | null = null;
  let searchFailed = false;
  if (query) {
    try {
      const viewer = await getViewer();
      outcome = await searchVideos(query, viewer.isMember);
    } catch (error) {
      unstable_rethrow(error);
      console.error('search failed', error);
      searchFailed = true;
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-12">
      <PageHeading title="Search" eyebrow="by meaning · English or Mongolian">
        Describe what you remember. It searches what is said in the videos.
      </PageHeading>

      <form
        action="/search"
        className="glass-panel relative mt-8 flex max-w-2xl items-center p-1.5 focus-within:ring-2 focus-within:ring-ring/50"
      >
        <SearchIcon className="ml-3 size-4 shrink-0 text-muted-foreground" aria-hidden />
        <Input
          name="q"
          defaultValue={query}
          placeholder="the trip where it snowed…"
          aria-label="Search videos"
          maxLength={200}
          className="h-10 border-0 bg-transparent focus-visible:ring-0 dark:bg-transparent"
        />
        <Button type="submit" className="h-9 rounded-lg px-4">
          Search
        </Button>
      </form>

      {searchFailed && (
        <p className="mt-10 text-destructive">Search is not working right now. Try again soon.</p>
      )}

      {outcome?.isFallback && (
        <p className="mt-6 text-sm text-muted-foreground">
          Showing simple matches by title for now.
        </p>
      )}

      {outcome && outcome.results.length === 0 && (
        <p className="mt-10 text-muted-foreground">Nothing found. Try other words.</p>
      )}

      {outcome && outcome.results.length > 0 && (
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {outcome.results.map((result) => (
            <div key={result.id} className="flex flex-col gap-2">
              <VideoCard video={result} />
              {result.snippet && (
                <p className="line-clamp-3 border-l-2 border-primary/40 pl-3 text-sm text-muted-foreground italic">
                  “{result.snippet}”
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
