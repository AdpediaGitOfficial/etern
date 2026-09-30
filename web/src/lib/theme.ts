export const THEME_COOKIE = 'etern_theme';
export type Theme = 'light' | 'dark';

export const parseTheme = (v: string | undefined): Theme | undefined => (v === 'light' || v === 'dark' ? v : undefined);
