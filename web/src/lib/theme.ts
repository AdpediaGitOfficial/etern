export const THEME_COOKIE = 'etern_theme';
export type Theme = 'light' | 'dark';

/** Everyone starts in dark mode, whatever their system setting is. Light stays a
 *  first-class theme — it is one click away and remembered for a year. */
export const DEFAULT_THEME: Theme = 'dark';

export const parseTheme = (v: string | undefined): Theme | undefined => (v === 'light' || v === 'dark' ? v : undefined);

/**
 * Browser-side helpers, shared by the topbar toggle and the Settings picker so the
 * cookie is written in exactly one place. Safe to import from server components:
 * nothing here touches `document` until it is called.
 */

/** The server always renders an explicit theme, so the attribute is the single source of truth. */
export const readTheme = (): Theme => (document.documentElement.dataset.theme === 'light' ? 'light' : 'dark');

/** Applies the theme now and remembers it for a year, so the server renders it on the next visit. */
export function applyTheme(next: Theme): void {
  document.documentElement.dataset.theme = next;
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${THEME_COOKIE}=${next}; Path=/; Max-Age=31536000; SameSite=Lax${secure}`;
}
