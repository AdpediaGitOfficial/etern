'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import Icon from './icons';
import { initials, type Account } from '@/lib/account';

/**
 * The signed-in administrator, and the two things you do with an account: open
 * Settings, or sign out. This block used to be a static label that looked like a
 * menu and opened nothing.
 */
export default function AccountMenu({ account }: { account: Account }) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  // A menu that stays open after you click elsewhere or press Escape is a trap.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [open]);

  const label = account.name || account.email || 'Account';

  return (
    <div className="side-user" ref={box}>
      <button type="button" className="side-user-btn" aria-haspopup="menu" aria-expanded={open}
              onClick={() => setOpen(o => !o)} aria-label={`Account: ${label}. Settings and sign out`}>
        <span className="avatar" aria-hidden="true">{initials(account)}</span>
        <span className="side-user-id">
          <strong>{label}</strong>
          {account.email && account.email !== label ? <small>{account.email}</small> : <small>Administrator</small>}
        </span>
        <Icon name="chevronUpDown" size={16} aria-hidden="true" />
      </button>

      {open ? (
        <div className="menu account-menu" role="menu">
          <Link role="menuitem" href="/settings" onClick={() => setOpen(false)}>
            <Icon name="settings" size={16} /> Settings
          </Link>
          {/* A real form post, so signing out works even if JavaScript has not loaded. */}
          <form action="/api/auth/logout" method="post">
            <button type="submit" role="menuitem"><Icon name="logout" size={16} /> Sign out</button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
