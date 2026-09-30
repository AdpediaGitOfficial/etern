'use client';

import Link from 'next/link';
import { ReactNode, useEffect, useRef } from 'react';

export function Breadcrumb({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav className="crumb" aria-label="Breadcrumb">
      <Link href="/dashboard">Home</Link>
      {items.map(i => (
        <span key={i.label}> / {i.href ? <Link href={i.href}>{i.label}</Link> : <b aria-current="page">{i.label}</b>}</span>
      ))}
    </nav>
  );
}

export function PageHead({ title, subtitle, children }: { title: string; subtitle?: string; children?: ReactNode }) {
  return (
    <div className="dash-head">
      <div><h1>{title}</h1>{subtitle ? <p className="muted">{subtitle}</p> : null}</div>
      <div className="head-actions">{children}</div>
    </div>
  );
}

export function Pill({ tone, children }: { tone: 'good' | 'bad' | 'warn' | 'off'; children: ReactNode }) {
  return <span className={`pill ${tone}`}>{children}</span>;
}

export function DetailList({ items }: { items: [string, ReactNode][] }) {
  return (
    <dl className="dl">
      {items.map(([k, v]) => (<div key={k}><dt>{k}</dt><dd>{v ?? '—'}</dd></div>))}
    </dl>
  );
}

export function Pager({ page, total, per, onPage }: { page: number; total: number; per: number; onPage: (p: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / per));
  const from = total ? (page - 1) * per + 1 : 0;
  const to = Math.min(total, page * per);
  return (
    <div className="pgn">
      <span className="muted">Showing {from}–{to} of {total}</span>
      <span>
        <button type="button" className="btn" onClick={() => onPage(page - 1)} disabled={page <= 1}>Previous</button>
        <span className="pg-now" aria-live="polite">Page {page} of {pages}</span>
        <button type="button" className="btn" onClick={() => onPage(page + 1)} disabled={page >= pages}>Next</button>
      </span>
    </div>
  );
}

/** Modal confirm built on <dialog>: focus is trapped and Escape cancels. */
export function ConfirmDialog({ open, title, body, confirmLabel, danger, busy, onConfirm, onCancel }: {
  open: boolean; title: string; body: string; confirmLabel: string; danger?: boolean; busy?: boolean;
  onConfirm: () => void; onCancel: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog ref={ref} className="dlg" onCancel={e => { e.preventDefault(); onCancel(); }} aria-labelledby="dlg-t">
      <h2 id="dlg-t">{title}</h2>
      <p>{body}</p>
      <div className="dlg-actions">
        <button type="button" className="btn" onClick={onCancel} disabled={busy}>Cancel</button>
        <button type="button" className={'btn ' + (danger ? 'danger' : 'primary')} onClick={onConfirm} disabled={busy}>
          {busy ? 'Working…' : confirmLabel}
        </button>
      </div>
    </dialog>
  );
}

export function Notice({ tone, children }: { tone: 'good' | 'bad'; children: ReactNode }) {
  return <div className={`banner ${tone}`} role={tone === 'bad' ? 'alert' : 'status'}>{children}</div>;
}

/** Shown inside a dashboard/list panel whose data failed to load. */
export function PanelError({ onRetry, busy }: { onRetry: () => void; busy: boolean }) {
  return (
    <div className="err" role="alert">
      <strong>We couldn’t load this.</strong>
      <span>The server didn’t respond. Your data is safe.</span>
      <button type="button" className="btn" onClick={onRetry} disabled={busy}>{busy ? 'Retrying…' : 'Try again'}</button>
    </div>
  );
}

export function Empty({ title, hint }: { title: string; hint: string }) {
  return <div className="empty"><strong>{title}</strong><span>{hint}</span></div>;
}
