import { describe, expect, it } from 'vitest';
import { parseYoutubeId, youtubeEmbedUrl } from '@/lib/youtube';

const ID = 'dQw4w9WgXcQ';

describe('parseYoutubeId', () => {
  it('reads the id from the usual link shapes', () => {
    expect(parseYoutubeId(`https://www.youtube.com/watch?v=${ID}`)).toBe(ID);
    expect(parseYoutubeId(`https://youtu.be/${ID}?si=abc`)).toBe(ID);
    expect(parseYoutubeId(`https://www.youtube.com/shorts/${ID}`)).toBe(ID);
    expect(parseYoutubeId(`https://www.youtube.com/embed/${ID}`)).toBe(ID);
    expect(parseYoutubeId(`https://www.youtube.com/live/${ID}?feature=share`)).toBe(ID);
    expect(parseYoutubeId(`https://m.youtube.com/watch?feature=share&v=${ID}&t=42s`)).toBe(ID);
  });

  it('accepts a link without https and surrounding spaces', () => {
    expect(parseYoutubeId(`  youtube.com/watch?v=${ID}  `)).toBe(ID);
    expect(parseYoutubeId(`youtu.be/${ID}`)).toBe(ID);
  });

  it('accepts a bare id', () => {
    expect(parseYoutubeId(ID)).toBe(ID);
  });

  it('rejects other sites, look-alike hosts and broken ids', () => {
    expect(parseYoutubeId('')).toBeNull();
    expect(parseYoutubeId('not a link')).toBeNull();
    expect(parseYoutubeId(`https://vimeo.com/watch?v=${ID}`)).toBeNull();
    expect(parseYoutubeId(`https://youtube.com.evil.example/watch?v=${ID}`)).toBeNull();
    expect(parseYoutubeId('https://www.youtube.com/watch?v=short')).toBeNull();
    expect(parseYoutubeId('https://www.youtube.com/watch')).toBeNull();
    expect(parseYoutubeId('https://www.youtube.com/@somechannel')).toBeNull();
    expect(parseYoutubeId(`https://www.youtube.com/watch?v=${ID}x`)).toBeNull();
  });
});

describe('youtubeEmbedUrl', () => {
  it('uses the no-cookie embed host and keeps suggestions to the same channel', () => {
    expect(youtubeEmbedUrl(ID)).toBe(
      `https://www.youtube-nocookie.com/embed/${ID}?rel=0&playsinline=1`,
    );
  });
});
