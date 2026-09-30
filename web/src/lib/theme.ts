export const THEME_COOKIE = 'etern_theme';
export type Theme = 'light' | 'dark';

/** Everyone starts in light mode, whatever their system setting is. */
export const DEFAULT_THEME: Theme = 'light';

export const parseTheme = (v: string | undefined): Theme | undefined => (v === 'light' || v === 'dark' ? v : undefined);
