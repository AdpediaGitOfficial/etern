'use client';

import { useEffect, useState } from 'react';
import CommandPalette from './CommandPalette';
import ThemeToggle from './ThemeToggle';

export default function Topbar() {
  const [open, setOpen] = useState(false);
  const [mac, setMac] = useState(false);

  useEffect(() => {
    setMac(/Mac|iPhone|iPad/.test(navigator.platform));
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setOpen(o => !o); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <header className="topbar">
      <button type="button" className="search-trigger" onClick={() => setOpen(true)} aria-label="Search students and pages" aria-keyshortcuts="Control+K Meta+K">
        <span aria-hidden="true">⌕</span>
        <span className="st-text">Search students and pages…</span>
        <kbd aria-hidden="true">{mac ? '⌘K' : 'Ctrl K'}</kbd>
      </button>
      <div className="topbar-actions">
        <ThemeToggle />
        <form action="/api/auth/logout" method="post">
          <button type="submit" className="btn">Sign out</button>
        </form>
      </div>
      <CommandPalette open={open} onClose={() => setOpen(false)} />
    </header>
  );
}
