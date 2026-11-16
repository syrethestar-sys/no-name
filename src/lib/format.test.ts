import { describe, expect, it } from 'vitest';
import {
  formatDate,
  formatDuration,
  formatFileSize,
  formatRating,
  formatTimeAgo,
} from '@/lib/format';

describe('formatDuration', () => {
  it('shows minutes and seconds, adding hours only when needed', () => {
    expect(formatDuration(0)).toBe('0:00');
    expect(formatDuration(75)).toBe('1:15');
    expect(formatDuration(3725)).toBe('1:02:05');
  });

  it('returns null when the length is unknown', () => {
    expect(formatDuration(null)).toBeNull();
  });
});

describe('formatRating', () => {
  it('rounds to one decimal and shows a dash when nobody rated', () => {
    expect(formatRating(4.25)).toBe('4.3');
    expect(formatRating(5)).toBe('5.0');
    expect(formatRating(null)).toBe('–');
  });
});

describe('formatDate', () => {
  it('uses a short English month', () => {
    expect(formatDate(new Date(2026, 10, 12))).toBe('Nov 12, 2026');
  });
});

describe('formatTimeAgo', () => {
  const now = new Date('2026-11-13T12:00:00Z');
  const ago = (seconds: number) => formatTimeAgo(new Date(now.getTime() - seconds * 1000), now);

  it('says "just now" under a minute, and for clocks slightly ahead', () => {
    expect(ago(30)).toBe('just now');
    expect(ago(-5)).toBe('just now');
  });

  it('picks the largest whole unit', () => {
    expect(ago(60)).toBe('1 minute ago');
    expect(ago(5 * 60)).toBe('5 minutes ago');
    expect(ago(3 * 86_400)).toBe('3 days ago');
    expect(ago(400 * 86_400)).toBe('1 year ago');
  });
});

describe('formatFileSize', () => {
  it('shows MB below 1 GB, rounded', () => {
    expect(formatFileSize(50_000_000)).toBe('50 MB');
    expect(formatFileSize(1_400_000)).toBe('1 MB');
  });

  it('shows GB from 1 GB, one decimal at most', () => {
    expect(formatFileSize(2_000_000_000)).toBe('2 GB');
    expect(formatFileSize(1_250_000_000)).toBe('1.3 GB');
  });
});
