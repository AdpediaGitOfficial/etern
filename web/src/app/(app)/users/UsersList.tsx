'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ConfirmDialog, Notice, Pager, Pill } from '@/components/ui';
import { fmtDate, isExpired } from '@/lib/format';
import type { Paged, Student } from '@/lib/types';

type Filter = 'all' | 'upcoming' | 'expired';
const PER = 10;

export default function UsersList({ filter, initial }: { filter: Filter; initial: Paged<Student> | null }) {
  const [q, setQ] = useState('');
  const [sub, setSub] = useState('All');
  const [status, setStatus] = useState('All');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
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
      const res = await fetch(`/api/proxy/student/allAdmin?${params(true)}`, { signal });
      if (res.status === 401) { window.location.assign('/api/auth/logout'); return; }
      if (!res.ok) throw new Error();
      const body = await res.json();
      setRows(body.result?.data ?? []);
      setTotal(body.result?.totalCount ?? 0);
    } catch (e) {
      if ((e as Error).name !== 'AbortError') setError('We couldn’t load students.');
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

  async function runConfirm() {
    if (!confirm) return;
    setBusy(true);
    const { kind, s } = confirm;
    try {
      const res = await fetch(`/api/proxy/student/${kind === 'unsub' ? 'unsubscribe/' : ''}${s._id}`, { method: kind === 'delete' ? 'DELETE' : 'GET' });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setNotice({ tone: 'bad', text: body.message || (kind === 'delete' ? 'Could not delete the student.' : 'Could not unsubscribe the student.') });
      } else {
        setNotice({ tone: 'good', text: kind === 'delete' ? `${s.fullName} was deleted.` : `${s.fullName} was unsubscribed.` });
        await load();
      }
    } catch {
      setNotice({ tone: 'bad', text: 'The server is unreachable. Try again.' });
    }
    setBusy(false);
    setConfirm(null);
  }

  async function exportXlsx() {
    setExporting(true);
    try {
      const res = await fetch(`/api/proxy/student/export-students?${params(false)}`);
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'users.xlsx';
      a.click();
      URL.revokeObjectURL(a.href);
    } catch {
      setNotice({ tone: 'bad', text: 'The export failed. Try again.' });
    }
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
        <button type="button" className="btn export" onClick={exportXlsx} disabled={exporting}>{exporting ? 'Exporting…' : '⤓ Export to Excel'}</button>
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
