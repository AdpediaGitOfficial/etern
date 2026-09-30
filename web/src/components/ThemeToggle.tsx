'use client';

import { useEffect, useState } from 'react';
import Icon from './icons';
import { THEME_COOKIE, type Theme } from '@/lib/theme';

/** The server always renders an explicit theme, so the attribute is the single source of truth. */
const currentTheme = (): Theme => (document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light');

/** Light/dark switch. Light is the default; the user's choice is remembered for a year. */
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
