'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ConfirmDialog, Notice, Pager, Pill } from '@/components/ui';
import { api, download } from '@/lib/api';
import { fmtDate, isExpired } from '@/lib/format';
import type { Paged, Student } from '@/lib/types';

type Filter = 'all' | 'upcoming' | 'expired';
export interface InitialFilters { q?: string; subscription?: 'true' | 'false'; status?: 'true' | 'false'; from?: string; to?: string }
const PER = 10;

export default function UsersList({ filter, initial, initialFilters = {} }: { filter: Filter; initial: Paged<Student> | null; initialFilters?: InitialFilters }) {
  const [q, setQ] = useState(initialFilters.q ?? '');
  const [sub, setSub] = useState(initialFilters.subscription ?? 'All');
  const [status, setStatus] = useState(initialFilters.status ?? 'All');
  const [from, setFrom] = useState(initialFilters.from ?? '');
  const [to, setTo] = useState(initialFilters.to ?? '');
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<Student[]>(initial?.data ?? []);
  const [total, setTotal] = useState(initial?.totalCount ?? 0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(initial ? '' : 'We couldn’t load students.');
  const [notice, setNotice] = useState<{ tone: 'good' | 'bad'; text: string } | null>(null);
  const [confirm, setConfirm] = useState<{ kind: 'delete' | 'unsub'; s: Student } | null>(null);
  const [busy, setBusy] = useState(false);
  const first = useRef(Boolean(initial));
  const [exporting, setExporting] = useState(false);

  const params = useCallback((withPage: boolean) => {
    const p = new URLSearchParams();
    if (withPage) { p.set('page', String(page)); p.set('limit', String(PER)); }
    if (q.trim()) p.set('fullName', q.trim());
    if (sub !== 'All') p.set('subscribed', sub);
    if (status !== 'All') p.set('isActive', status);
    if (from && to) { p.set('startDate', from); p.set('endDate', to); }
    if (filter === 'upcoming') p.set('expiresIn7Days', 'true');
    if (filter === 'expired') p.set('isExpired', 'true');
    return p.toString();
  }, [page, q, sub, status, from, to, filter]);

  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError('');
    try {
      const r = await api<{ result?: Paged<Student> }>(`student/allAdmin?${params(true)}`, { signal });
      if (!r.ok) { setError('We couldn’t load students.'); return; }
      setRows(r.body?.result?.data ?? []);
      setTotal(r.body?.result?.totalCount ?? 0);
    } catch {
      /* aborted: a newer request is in flight */
    } finally {
      setLoading(false);
    }
  }, [params]);

  // Refetch when a filter or the page changes. Typing in the search box waits 350 ms.
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    const ctl = new AbortController();
    const t = setTimeout(() => load(ctl.signal), q ? 350 : 0);
    return () => { clearTimeout(t); ctl.abort(); };
  }, [load, q]);

  const changeFilter = (fn: () => void) => { fn(); setPage(1); };
  const filtered = Boolean(q.trim()) || sub !== 'All' || status !== 'All' || Boolean(from && to);

  // Keep the address in step with the filters, so a filtered list can be bookmarked or shared.
  useEffect(() => {
    const p = new URLSearchParams();
    if (q.trim()) p.set('q', q.trim());
    if (sub !== 'All') p.set('subscription', sub);
    if (status !== 'All') p.set('status', status);
    if (from && to) { p.set('from', from); p.set('to', to); }
    const qs = p.toString();
    window.history.replaceState(null, '', qs ? `?${qs}` : window.location.pathname);
  }, [q, sub, status, from, to]);

  function clearFilters() { setQ(''); setSub('All'); setStatus('All'); setFrom(''); setTo(''); setPage(1); }

  async function runConfirm() {
    if (!confirm) return;
    setBusy(true);
    const { kind, s } = confirm;
    const isDelete = kind === 'delete';
    const r = await api(`student/${isDelete ? '' : 'unsubscribe/'}${s._id}`, { method: isDelete ? 'DELETE' : 'GET' },
      isDelete ? 'Could not delete the student.' : 'Could not unsubscribe the student.');
    if (r.ok) {
      setNotice({ tone: 'good', text: isDelete ? `${s.fullName} was deleted.` : `${s.fullName} was unsubscribed.` });
      await load();
    } else {
      setNotice({ tone: 'bad', text: r.message });
    }
    setBusy(false);
    setConfirm(null);
  }

  async function exportXlsx() {
    setExporting(true);
    const ok = await download(`student/export-students?${params(false)}`, 'users.xlsx');
    if (!ok) setNotice({ tone: 'bad', text: 'The export failed. Try again.' });
    setExporting(false);
  }

  return (
    <div className="card">
      {notice ? <Notice tone={notice.tone}>{notice.text}</Notice> : null}
      <div className="filters">
        <label>Search
          <input type="search" placeholder="Name or mobile number" value={q} onChange={e => changeFilter(() => setQ(e.target.value))} />
        </label>
        <label>Subscription
          <select value={sub} onChange={e => changeFilter(() => setSub(e.target.value))}>
            <option value="All">All</option><option value="true">Subscribed</option><option value="false">Free user</option>
          </select>
        </label>
        <label>Status
          <select value={status} onChange={e => changeFilter(() => setStatus(e.target.value))}>
            <option value="All">All</option><option value="true">Active</option><option value="false">Inactive</option>
          </select>
        </label>
        <label>Joined from<input type="date" value={from} max={to || undefined} onChange={e => changeFilter(() => setFrom(e.target.value))} /></label>
        <label>Joined to<input type="date" value={to} min={from || undefined} onChange={e => changeFilter(() => setTo(e.target.value))} /></label>
        {filtered ? <button type="button" className="btn" onClick={clearFilters}>Clear filters</button> : null}
        <button type="button" className="btn export" onClick={exportXlsx} disabled={exporting}>{exporting ? 'Exporting…' : 'Export to Excel'}</button>
      </div>
      {(from && !to) || (!from && to) ? <p className="hint">Pick both dates to filter by joining date.</p> : null}

      <div className="tw" aria-busy={loading}>
        <table className="tbl">
          <thead>
            <tr><th>#</th><th>Joined</th><th>Student</th><th>Mobile</th><th>Type</th><th>Subscription ends</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody className={loading ? 'dim' : ''}>
            {rows.map((s, i) => {
              const exp = isExpired(s.subscriptionEndDate);
              return (
                <tr key={s._id}>
                  <td>{(page - 1) * PER + i + 1}</td>
                  <td>{fmtDate(s.createdAt)}</td>
                  <td><Link href={`/users/${s._id}`} className="strong-link">{s.fullName}</Link></td>
                  <td>{s.mobileNumber || '—'}</td>
                  <td><Pill tone={s.subscribed ? 'good' : 'off'}>{s.subscribed ? 'Subscribed' : 'Free user'}</Pill></td>
                  <td className={exp ? 'bad-text' : ''}>{s.subscriptionEndDate ? <>{fmtDate(s.subscriptionEndDate)}{exp ? ' (expired)' : ''}</> : '—'}</td>
                  <td><Pill tone={s.isActive ? 'good' : 'bad'}>{s.isActive ? 'Active' : 'Inactive'}</Pill></td>
                  <td>
                    <div className="row-actions">
                      <Link className="btn sm" href={`/users/${s._id}`}>View</Link>
                      {!s.subscribed || exp ? (
                        <Link className="btn sm" href={`/offline-payments/new?studentId=${s._id}&name=${encodeURIComponent(s.fullName)}`}>Add payment</Link>
                      ) : null}
                      {s.subscribed && !exp ? <button type="button" className="btn sm" onClick={() => setConfirm({ kind: 'unsub', s })}>Unsubscribe</button> : null}
                      <button type="button" className="btn sm danger-o" onClick={() => setConfirm({ kind: 'delete', s })}>Delete</button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {!rows.length && !loading ? (
              <tr><td colSpan={8}>
                {error ? (
                  <div className="err" role="alert"><strong>{error}</strong><span>The server didn’t respond. Your data is safe.</span><button type="button" className="btn" onClick={() => load()}>Try again</button></div>
                ) : (
                  <div className="empty"><strong>No students found</strong><span>Try clearing the search or changing the filters.</span></div>
                )}
              </td></tr>
            ) : null}
          </tbody>
        </table>
      </div>
      <Pager page={page} total={total} per={PER} onPage={setPage} />

      <ConfirmDialog
        open={Boolean(confirm)}
        danger={confirm?.kind === 'delete'}
        busy={busy}
        title={confirm?.kind === 'delete' ? 'Delete this student?' : 'Unsubscribe this student?'}
        body={confirm?.kind === 'delete'
          ? `${confirm?.s.fullName} will be removed from the list. This cannot be undone from here.`
          : `${confirm?.s.fullName} will lose access to paid content straight away.`}
        confirmLabel={confirm?.kind === 'delete' ? 'Delete student' : 'Unsubscribe'}
        onConfirm={runConfirm}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}
