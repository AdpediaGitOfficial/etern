import { describe, expect, it } from 'vitest';
import { DEFAULT_THEME, parseTheme } from './theme';

describe('parseTheme', () => {
  it('defaults to dark', () => {
    expect(DEFAULT_THEME).toBe('dark');
    expect(parseTheme(undefined) ?? DEFAULT_THEME).toBe('dark');
  });

  it('falls back to dark for a cookie that is missing or tampered with', () => {
    for (const bad of [undefined, '', 'DARK', 'blue', '"><script>']) {
      expect(parseTheme(bad) ?? DEFAULT_THEME).toBe('dark');
    }
  });

  it('accepts only the two known themes', () => {
    expect(parseTheme('dark')).toBe('dark');
    expect(parseTheme('light')).toBe('light');
    for (const bad of [undefined, '', 'DARK', 'blue', '"><script>']) expect(parseTheme(bad)).toBeUndefined();
  });
});
