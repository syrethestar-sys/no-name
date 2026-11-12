import type { Metadata } from 'next';
import { unstable_rethrow } from 'next/navigation';
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
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">Search</h1>
      <p className="mt-1 text-muted-foreground">
        Describe what you remember, in English or Mongolian. It searches what is said in the videos.
      </p>

      <form action="/search" className="mt-6 flex max-w-2xl gap-2">
        <Input
          name="q"
          defaultValue={query}
          placeholder="the trip where it snowed…"
          aria-label="Search videos"
          maxLength={200}
          className="h-10"
        />
        <Button type="submit" className="h-10">
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
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {outcome.results.map((result) => (
            <div key={result.id} className="flex flex-col gap-2">
              <VideoCard video={result} />
              {result.snippet && (
                <p className="line-clamp-3 px-1 text-sm text-muted-foreground">
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
