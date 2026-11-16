import { afterEach, describe, expect, it, vi } from 'vitest';
import { checkYoutubeVideo } from '@/lib/youtube-check';

function stubFetch(result: Response | Error) {
  const fetchMock = vi.fn<typeof fetch>(() =>
    result instanceof Error ? Promise.reject(result) : Promise.resolve(result),
  );
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

afterEach(() => vi.unstubAllGlobals());

describe('checkYoutubeVideo', () => {
  it('is ok when YouTube answers 200', async () => {
    const fetchMock = stubFetch(new Response('{}', { status: 200 }));
    expect(await checkYoutubeVideo('q-zNoks1rFE')).toBe('ok');
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain(
      encodeURIComponent('https://www.youtube.com/watch?v=q-zNoks1rFE'),
    );
  });

  it('is unavailable for a private, missing or non-embeddable video', async () => {
    for (const status of [401, 403, 404]) {
      stubFetch(new Response('', { status }));
      expect(await checkYoutubeVideo('AAAAAAAAAAA')).toBe('unavailable');
    }
  });

  it('never blocks on a YouTube outage or a network failure', async () => {
    stubFetch(new Response('', { status: 503 }));
    expect(await checkYoutubeVideo('q-zNoks1rFE')).toBe('unknown');
    stubFetch(new Error('network down'));
    expect(await checkYoutubeVideo('q-zNoks1rFE')).toBe('unknown');
  });
});
