import { describe, expect, it } from 'vitest';
import { splitText } from './split-text';

describe('splitText', () => {
  it('splits into words and letters', () => {
    expect(splitText('keep going')).toEqual([
      { word: 'keep', letters: ['k', 'e', 'e', 'p'] },
      { word: 'going', letters: ['g', 'o', 'i', 'n', 'g'] },
    ]);
  });

  it('ignores extra spaces and line breaks', () => {
    expect(splitText('  a \n  b  ').map((item) => item.word)).toEqual(['a', 'b']);
  });

  it('gives nothing for an empty string', () => {
    expect(splitText('')).toEqual([]);
    expect(splitText('   ')).toEqual([]);
  });

  it('keeps Cyrillic letters and emoji whole', () => {
    expect(splitText('Сайн 😀')).toEqual([
      { word: 'Сайн', letters: ['С', 'а', 'й', 'н'] },
      { word: '😀', letters: ['😀'] },
    ]);
  });
});
