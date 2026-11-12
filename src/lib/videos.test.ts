import { describe, expect, it } from 'vitest';
import { containsPattern, feedHref, isFeedSort, isVideoTopic } from '@/lib/videos';

describe('feedHref', () => {
  it('leaves defaults out of the URL', () => {
    expect(feedHref({ topic: null, sort: 'newest' })).toBe('/');
  });

  it('keeps both filters together', () => {
    expect(feedHref({ topic: 'coding', sort: 'liked' })).toBe('/?topic=coding&sort=liked');
    expect(feedHref({ topic: 'life', sort: 'newest' })).toBe('/?topic=life');
    expect(feedHref({ topic: null, sort: 'rated' })).toBe('/?sort=rated');
  });
});

describe('URL filter checks', () => {
  it('accepts only known topics and sorts', () => {
    expect(isVideoTopic('trading')).toBe(true);
    expect(isVideoTopic('cooking')).toBe(false);
    expect(isFeedSort('rated')).toBe(true);
    expect(isFeedSort('random')).toBe(false);
    expect(isFeedSort(undefined)).toBe(false);
  });
});

describe('containsPattern', () => {
  it('wraps the text so it matches anywhere', () => {
    expect(containsPattern('snow')).toBe('%snow%');
  });

  it('escapes SQL wildcards so "100%" means the characters, not "anything"', () => {
    expect(containsPattern('100%')).toBe('%100\\%%');
    expect(containsPattern('a_b')).toBe('%a\\_b%');
    expect(containsPattern('back\\slash')).toBe('%back\\\\slash%');
  });
});
