import { describe, expect, it } from 'vitest';
import { DEFAULT_THEME, parseTheme } from './theme';

describe('parseTheme', () => {
  it('defaults to light', () => {
    expect(DEFAULT_THEME).toBe('light');
    expect(parseTheme(undefined) ?? DEFAULT_THEME).toBe('light');
  });

  it('accepts only the two known themes', () => {
    expect(parseTheme('dark')).toBe('dark');
    expect(parseTheme('light')).toBe('light');
    for (const bad of [undefined, '', 'DARK', 'blue', '"><script>']) expect(parseTheme(bad)).toBeUndefined();
  });
});
