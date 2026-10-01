'use client';

import { useEffect, useState } from 'react';
import Icon from '@/components/icons';
import { applyTheme, readTheme, type Theme } from '@/lib/theme';

const CHOICES: { value: Theme; label: string; hint: string; icon: 'moon' | 'sun' }[] = [
  { value: 'dark', label: 'Dark', hint: 'The default. Easier on the eyes in a dim room.', icon: 'moon' },
  { value: 'light', label: 'Light', hint: 'Better in bright daylight or for printing a page.', icon: 'sun' },
];

export default function ThemePicker() {
  // The server rendered the theme already; read it after mount so the markup matches on both sides.
  const [theme, setTheme] = useState<Theme | null>(null);
  useEffect(() => setTheme(readTheme()), []);

  function choose(next: Theme) {
    applyTheme(next);
    setTheme(next);
  }

  return (
    <section className="card">
      <h2>Appearance</h2>
      <p className="muted">Remembered on this browser for a year.</p>
      <div className="theme-choices" role="radiogroup" aria-label="Colour theme">
        {CHOICES.map(c => (
          <button key={c.value} type="button" role="radio" aria-checked={theme === c.value}
                  className={'theme-choice' + (theme === c.value ? ' on' : '')} onClick={() => choose(c.value)}>
            <span className={'theme-swatch ' + c.value} aria-hidden="true"><Icon name={c.icon} size={16} /></span>
            <span><strong>{c.label}</strong><small>{c.hint}</small></span>
            {theme === c.value ? <Icon name="check" size={16} aria-hidden="true" /> : null}
          </button>
        ))}
      </div>
    </section>
  );
}
