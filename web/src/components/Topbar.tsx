'use client';

import { useEffect, useState } from 'react';
import CommandPalette from './CommandPalette';
import Icon from './icons';
import { useShell } from './ShellProvider';
import ThemeToggle from './ThemeToggle';

export default function Topbar() {
  const [open, setOpen] = useState(false);
  const [mac, setMac] = useState(false);
  const { navOpen, setNavOpen } = useShell();

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
      <button type="button" className="btn icon-only menu-btn" onClick={() => setNavOpen(!navOpen)} aria-label="Open navigation menu" aria-expanded={navOpen} aria-controls="main-nav">
        <Icon name="menu" />
      </button>
      <button type="button" className="search-trigger" onClick={() => setOpen(true)} aria-label="Search students and pages" aria-keyshortcuts="Control+K Meta+K">
        <Icon name="search" />
        <span className="st-text">Search students and pages…</span>
        <kbd aria-hidden="true">{mac ? '⌘K' : 'Ctrl K'}</kbd>
      </button>
      <div className="topbar-actions">
        <ThemeToggle />
        <form action="/api/auth/logout" method="post">
          <button type="submit" className="btn" aria-label="Sign out"><Icon name="logout" size={16} /><span className="hide-sm">Sign out</span></button>
        </form>
      </div>
      <CommandPalette open={open} onClose={() => setOpen(false)} />
    </header>
  );
}
