'use client';

import { useRouter } from 'next/navigation';
import { KeyboardEvent, useEffect, useMemo, useRef, useState } from 'react';
import { api } from '@/lib/api';
import type { Paged, Student } from '@/lib/types';

interface Entry { id: string; label: string; hint: string; href: string }

const PAGES: Entry[] = [
  { id: 'p-dash', label: 'Dashboard', hint: 'Page', href: '/dashboard' },
  { id: 'p-users', label: 'All users', hint: 'Page', href: '/users' },
  { id: 'p-up', label: 'Upcoming expiry', hint: 'Page', href: '/users/upcoming' },
  { id: 'p-exp', label: 'Expired subscriptions', hint: 'Page', href: '/users/expired' },
  { id: 'p-off', label: 'Offline payments', hint: 'Page', href: '/offline-payments' },
  { id: 'p-on', label: 'Online payments', hint: 'Page', href: '/online-payments' },
  { id: 'p-pkg', label: 'Packages', hint: 'Page', href: '/packages' },
  { id: 'p-pkg-new', label: 'Add package', hint: 'Action', href: '/packages/new' },
  { id: 'p-cat', label: 'Categories', hint: 'Page', href: '/categories' },
  { id: 'p-cat-new', label: 'Add category', hint: 'Action', href: '/categories/new' },
  { id: 'p-sub', label: 'Sub categories', hint: 'Page', href: '/sub-categories' },
  { id: 'p-sub-new', label: 'Add sub category', hint: 'Action', href: '/sub-categories/new' },
  { id: 'p-cm', label: 'Course materials', hint: 'Page', href: '/course-materials' },
  { id: 'p-cm-new', label: 'Add course material', hint: 'Action', href: '/course-materials/new' },
];

/** ⌘K / Ctrl+K quick search: jump to any page, or find a student by name or mobile number. */
export default function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const [q, setQ] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [searching, setSearching] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
    if (!open) { setQ(''); setStudents([]); setActive(0); setUnavailable(false); }
  }, [open]);

  // Student search waits 250 ms after typing stops and needs at least 2 characters.
  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) { setStudents([]); setSearching(false); setUnavailable(false); return; }
    setSearching(true);
    const ctl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const r = await api<{ result?: Paged<Student> }>(`student/allAdmin?page=1&limit=5&fullName=${encodeURIComponent(term)}`, { signal: ctl.signal });
        setUnavailable(!r.ok);
        setStudents(r.ok ? r.body?.result?.data ?? [] : []);
        setSearching(false);
      } catch {
        /* aborted by a newer keystroke */
      }
    }, 250);
    return () => { clearTimeout(t); ctl.abort(); };
  }, [q]);

  const entries = useMemo<Entry[]>(() => {
    const term = q.trim().toLowerCase();
    const pages = PAGES.filter(p => !term || p.label.toLowerCase().includes(term)).slice(0, 6);
    const people = students.map(s => ({ id: `s-${s._id}`, label: s.fullName, hint: s.mobileNumber ? `Student · ${s.mobileNumber}` : 'Student', href: `/users/${s._id}` }));
    return [...people, ...pages];
  }, [q, students]);

  useEffect(() => setActive(0), [entries.length]);

  function go(e: Entry | undefined) {
    if (!e) return;
    onClose();
    router.push(e.href);
  }

  function onKey(ev: KeyboardEvent<HTMLInputElement>) {
    if (ev.key === 'ArrowDown') { ev.preventDefault(); setActive(a => (entries.length ? (a + 1) % entries.length : 0)); }
    else if (ev.key === 'ArrowUp') { ev.preventDefault(); setActive(a => (entries.length ? (a - 1 + entries.length) % entries.length : 0)); }
    else if (ev.key === 'Enter') { ev.preventDefault(); go(entries[active]); }
  }

  return (
    <dialog ref={dialog} className="palette" aria-label="Quick search" onCancel={ev => { ev.preventDefault(); onClose(); }}
            onClick={ev => { if (ev.target === dialog.current) onClose(); }}>
      <input
        className="palette-input" placeholder="Search students or jump to a page…" value={q} onChange={e => setQ(e.target.value)} onKeyDown={onKey}
        role="combobox" aria-expanded="true" aria-controls="palette-list" aria-autocomplete="list"
        aria-activedescendant={entries[active] ? `opt-${entries[active].id}` : undefined} autoComplete="off" spellCheck={false}
      />
      <ul id="palette-list" role="listbox" className="palette-list" aria-busy={searching}>
        {entries.map((e, i) => (
          <li key={e.id} id={`opt-${e.id}`} role="option" aria-selected={i === active} className={i === active ? 'on' : ''}
              onMouseEnter={() => setActive(i)} onClick={() => go(e)}>
            <span>{e.label}</span><small>{e.hint}</small>
          </li>
        ))}
        {!entries.length && !searching ? <li className="palette-empty" role="presentation">No matches for “{q.trim()}”</li> : null}
      </ul>
      <div className="palette-foot" aria-live="polite">
        {searching ? 'Searching students…' : unavailable ? 'Student search is unavailable right now.' : q.trim().length === 1 ? 'Type 2 or more letters to search students.' : '↑↓ to move · Enter to open · Esc to close'}
      </div>
    </dialog>
  );
}
