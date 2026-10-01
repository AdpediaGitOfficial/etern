'use client';

import { useEffect, useState } from 'react';
import Icon from './icons';
import { applyTheme, readTheme, type Theme } from '@/lib/theme';

/** Light/dark switch. Dark is the default; the user's choice is remembered for a year.
 *  The same choice is also offered, with labels, under Settings → Appearance. */
export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme | null>(null);
  useEffect(() => setTheme(readTheme()), []);

  function toggle() {
    const next: Theme = readTheme() === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    setTheme(next);
  }

  return (
    <button type="button" className="btn icon-only theme-btn" onClick={toggle} aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}>
      <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
    </button>
  );
}
