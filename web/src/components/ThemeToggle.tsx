'use client';

import { useEffect, useState } from 'react';
import Icon from './icons';
import { THEME_COOKIE, type Theme } from '@/lib/theme';

/** The server always renders an explicit theme, so the attribute is the single source of truth.
 *  Dark is the default, so anything that is not an explicit "light" is dark. */
const currentTheme = (): Theme => (document.documentElement.dataset.theme === 'light' ? 'light' : 'dark');

/** Light/dark switch. Dark is the default; the user's choice is remembered for a year. */
export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme | null>(null);
  useEffect(() => setTheme(currentTheme()), []);

  function toggle() {
    const next: Theme = currentTheme() === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    const secure = window.location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = `${THEME_COOKIE}=${next}; Path=/; Max-Age=31536000; SameSite=Lax${secure}`;
    setTheme(next);
  }

  return (
    <button type="button" className="btn icon-only theme-btn" onClick={toggle} aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}>
      <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
    </button>
  );
}
