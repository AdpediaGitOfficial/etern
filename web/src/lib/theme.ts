export const THEME_COOKIE = 'etern_theme';
export type Theme = 'light' | 'dark';

/** Everyone starts in dark mode, whatever their system setting is. Light stays a
 *  first-class theme — it is one click away and remembered for a year. */
export const DEFAULT_THEME: Theme = 'dark';

export const parseTheme = (v: string | undefined): Theme | undefined => (v === 'light' || v === 'dark' ? v : undefined);
