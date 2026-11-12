import { describe, expect, it } from 'vitest';
import { buildDocuments } from '@/lib/transcribe';

const video = (transcript: string | null) => ({
  id: 'v1',
  title: 'Snow trip',
  description: 'Stuck in the mountains',
  transcript,
});
const words = (count: number) => Array.from({ length: count }, (_, index) => `w${index}`).join(' ');

describe('buildDocuments', () => {
  it('always has a #meta document with the title and description', () => {
    const [meta] = buildDocuments(video(null));
    expect(meta).toEqual({
      id: 'v1#meta',
      videoId: 'v1',
      text: 'Snow trip\n\nStuck in the mountains',
    });
  });

  it('cuts the transcript into 200-word chunks numbered from 0', () => {
    const documents = buildDocuments(video(words(450)));
    expect(documents.map((document) => document.id)).toEqual(['v1#meta', 'v1#0', 'v1#1', 'v1#2']);
    expect(documents[1].text.split(' ')).toHaveLength(200);
    expect(documents[3].text.split(' ')).toHaveLength(50);
  });

  it('drops near-empty chunks, which would match every search', () => {
    expect(buildDocuments(video('.'))).toHaveLength(1);
    expect(buildDocuments(video(words(203))).map((document) => document.id)).toEqual([
      'v1#meta',
      'v1#0',
    ]);
  });
});
