export type TextWord = { word: string; letters: string[] };

/**
 * Splits a string into words, and each word into letters, for the letter-by-letter reveals.
 * `Array.from` keeps a letter whole when it is more than one UTF-16 unit, so Mongolian Cyrillic and
 * emoji are never cut in half.
 */
export function splitText(text: string): TextWord[] {
  return text
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => ({ word, letters: Array.from(word) }));
}
