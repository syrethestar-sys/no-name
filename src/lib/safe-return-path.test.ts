import { describe, expect, it } from 'vitest';
import { safeReturnPath } from '@/lib/safe-return-path';

describe('safeReturnPath', () => {
  it('keeps a path and its query on this site', () => {
    expect(safeReturnPath('/videos/abc?comments=100')).toBe('/videos/abc?comments=100');
  });

  it('strips the host from a full URL (Clerk sends those)', () => {
    expect(safeReturnPath('https://evil.example/steal?x=1')).toBe('/steal?x=1');
  });

  it('never returns a protocol-relative link to another site', () => {
    expect(safeReturnPath('//evil.example/path')).toBe('/path');
    expect(safeReturnPath('/\evil.example')).not.toMatch(/^\/\//);
  });

  it('falls back to the home page', () => {
    expect(safeReturnPath(undefined)).toBe('/');
    expect(safeReturnPath('')).toBe('/');
    expect(safeReturnPath('javascript:alert(1)')).toBe('/');
  });
});
