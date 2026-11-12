import { describe, expect, it } from 'vitest';
import type { DocumentMatch } from '@/lib/pinecone';
import { pickBestMatches, toSearchResults } from '@/lib/search';
import type { VideoCardData } from '@/lib/videos';

const match = (id: string, score: number, text = 'some words'): DocumentMatch => ({
  id,
  videoId: id.split('#')[0],
  text,
  score,
});

const card = (id: string, isLocked = false): VideoCardData => ({
  id,
  title: `Video ${id}`,
  durationSeconds: 60,
  createdAt: new Date('2026-11-01'),
  visibility: isLocked ? 'members' : 'public',
  topic: 'life',
  thumbnailUrl: null,
  isLocked,
  likeCount: 0,
  ratingAverage: null,
  ratingCount: 0,
});

describe('pickBestMatches', () => {
  it('keeps one match per video: its best one', () => {
    const best = pickBestMatches([match('a#0', 0.85), match('a#1', 0.84), match('b#0', 0.83)]);
    expect([...best.keys()]).toEqual(['a', 'b']);
    expect(best.get('a')?.score).toBe(0.85);
  });

  it('drops matches far below the best one', () => {
    const best = pickBestMatches([match('a#0', 0.85), match('b#0', 0.81), match('c#0', 0.79)]);
    expect([...best.keys()]).toEqual(['a', 'b']);
  });

  it('drops everything under the minimum score', () => {
    expect(pickBestMatches([match('a#0', 0.76)]).size).toBe(0);
  });

  it('has no snippet for title/description matches, and shortens long ones', () => {
    const best = pickBestMatches([
      match('a#meta', 0.85, 'Title and description'),
      match('b#0', 0.84, 'word '.repeat(100)),
    ]);
    expect(best.get('a')?.snippet).toBeNull();
    expect(best.get('b')?.snippet?.endsWith('…')).toBe(true);
    expect(best.get('b')?.snippet?.length).toBeLessThanOrEqual(181);
  });

  it('handles no matches', () => {
    expect(pickBestMatches([]).size).toBe(0);
  });
});

describe('toSearchResults', () => {
  const best = pickBestMatches([match('b#0', 0.85, 'the snowy road'), match('a#0', 0.84)]);

  it('orders by score, not by the database order', () => {
    const results = toSearchResults([card('a'), card('b')], best);
    expect(results.map((result) => result.id)).toEqual(['b', 'a']);
  });

  it('never shows transcript text for a locked video', () => {
    const [locked] = toSearchResults([card('b', true)], best);
    expect(locked.snippet).toBeNull();
    const [open] = toSearchResults([card('b')], best);
    expect(open.snippet).toBe('the snowy road');
  });
});
