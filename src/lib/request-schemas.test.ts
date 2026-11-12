import { describe, expect, it } from 'vitest';
import { CommentBody, JoinRequestBody, RatingBody, TranscribeBody } from '@/lib/request-schemas';

const UUID = '0bbd71b0-eba2-4335-851b-0f54b778ff30';

describe('CommentBody', () => {
  it('accepts 1–2000 characters, trimmed', () => {
    expect(CommentBody.parse({ text: '  hi  ' })).toEqual({ text: 'hi' });
    expect(CommentBody.safeParse({ text: 'x'.repeat(2000) }).success).toBe(true);
  });

  it('rejects blank and too-long comments', () => {
    expect(CommentBody.safeParse({ text: '   ' }).success).toBe(false);
    expect(CommentBody.safeParse({ text: 'x'.repeat(2001) }).success).toBe(false);
  });

  it('only takes a real id as the parent', () => {
    expect(CommentBody.safeParse({ text: 'hi', parentId: UUID }).success).toBe(true);
    expect(CommentBody.safeParse({ text: 'hi', parentId: '1 or 1=1' }).success).toBe(false);
  });
});

describe('RatingBody', () => {
  it('takes whole stars from 1 to 5 only', () => {
    expect(RatingBody.safeParse({ stars: 1 }).success).toBe(true);
    expect(RatingBody.safeParse({ stars: 5 }).success).toBe(true);
    for (const stars of [0, 6, 4.5, '5']) {
      expect(RatingBody.safeParse({ stars }).success).toBe(false);
    }
  });
});

describe('JoinRequestBody', () => {
  const intro = 'I trade a little and want to learn with others.';

  it('needs a real introduction', () => {
    expect(JoinRequestBody.safeParse({ intro: 'hi' }).success).toBe(false);
    expect(JoinRequestBody.parse({ intro })).toEqual({ intro, interests: [], link: null });
  });

  it('only accepts http(s) links', () => {
    expect(JoinRequestBody.safeParse({ intro, link: 'https://example.com' }).success).toBe(true);
    expect(JoinRequestBody.safeParse({ intro, link: 'javascript:alert(1)' }).success).toBe(false);
  });

  it('only accepts known interests', () => {
    expect(JoinRequestBody.safeParse({ intro, interests: ['trading'] }).success).toBe(true);
    expect(JoinRequestBody.safeParse({ intro, interests: ['hacking'] }).success).toBe(false);
  });
});

describe('TranscribeBody', () => {
  it('allows an empty body (plain retry)', () => {
    expect(TranscribeBody.parse({})).toEqual({});
  });

  it('only accepts audio paths in our audio folder', () => {
    expect(TranscribeBody.safeParse({ audioPath: `audio/${UUID}.webm` }).success).toBe(true);
    const badPaths = [`videos/${UUID}.mp4`, `audio/${UUID}.webm/../x`, `../audio/${UUID}.webm`];
    for (const audioPath of badPaths) {
      expect(TranscribeBody.safeParse({ audioPath }).success).toBe(false);
    }
  });
});
