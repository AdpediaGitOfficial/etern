import { describe, expect, it } from 'vitest';
import { parseTheme } from './theme';

describe('parseTheme', () => {
  it('accepts only the two known themes', () => {
    expect(parseTheme('dark')).toBe('dark');
    expect(parseTheme('light')).toBe('light');
    for (const bad of [undefined, '', 'DARK', 'blue', '"><script>']) expect(parseTheme(bad)).toBeUndefined();
  });
});
