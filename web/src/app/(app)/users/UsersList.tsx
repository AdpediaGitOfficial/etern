'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ConfirmDialog, Notice, Pager, Pill } from '@/components/ui';
import { api, download } from '@/lib/api';
import { endsWhen, isRunning, STATUS_LABEL, STATUS_TONE, statusOf, type Segment } from '@/lib/access';
import { fmtDate } from '@/lib/format';
import type { Paged, SegmentCounts, Student } from '@/lib/types';

type Filter = 'all' | 'upcoming' | 'expired';
export interface InitialFilters { q?: string; segment?: Segment; status?: 'true' | 'false'; from?: string; to?: string }
const TABS: { key: Segment; label: string; count: keyof SegmentCounts }[] = [
  { key: '', label: 'All', count: 'all' }, { key: 'active', label: 'Subscribed', count: 'active' }, { key: 'expiring', label: 'Expiring in 7 days', count: 'expiring' },
  { key: 'lapsed', label: 'Free (plan ended)', count: 'lapsed' }, { key: 'never', label: 'Never subscribed', count: 'never' },
];
const NOTES: Record<string, string> = {
  active: 'Students with a running plan. The ones that end within 7 days are also under “Expiring in 7 days”.',
  expiring: 'Plans that end within 7 days. Ask these families to renew before their videos lock.',
  lapsed: 'Plan ended, now on the free version. Progress is kept, and renewing unlocks every video again.',
  never: 'Never bought a plan. They use the free version.',
  free: 'Everyone on the free version.',
};
const PER = 10;

const PRESET: Record<Filter, Segment> = { all: '', upcoming: 'expiring', expired: 'lapsed' };

export default function UsersList({ filter, initial, initialFilters = {}, initialCounts = null }: { filter: Filter; initial: Paged<Student> | null; initialFilters?: InitialFilters; initialCounts?: SegmentCounts | null }) {
  const [q, setQ] = useState(initialFilters.q ?? '');
  const [seg, setSeg] = useState<Segment>(PRESET[filter] || initialFilters.segment || '');
  const [counts, setCounts] = useState<SegmentCounts | null>(initialCounts);
  const [menu, setMenu] = useState<string | null>(null);
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
    if (seg) p.set('segment', seg);
    if (status !== 'All') p.set('isActive', status);
    if (from && to) { p.set('startDate', from); p.set('endDate', to); }
    return p.toString();
  }, [page, q, seg, status, from, to]);

  const loadCounts = useCallback(async () => {
    const r = await api<{ result?: SegmentCounts }>('student/segments');
    if (r.ok && r.body?.result) setCounts(r.body.result);
  }, []);
  useEffect(() => { if (filter === 'all' && !initialCounts) loadCounts(); }, [filter, initialCounts, loadCounts]);
  useEffect(() => {
    if (!menu) return;
    const close = (e: Event) => { if (!(e.target as HTMLElement).closest('.kebab')) setMenu(null); };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenu(null); };
    document.addEventListener('click', close); document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('click', close); document.removeEventListener('keydown', esc); };
  }, [menu]);

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
  const filtered = Boolean(q.trim()) || status !== 'All' || Boolean(from && to);

  // Keep the address in step with the filters, so a filtered list can be bookmarked or shared.
  useEffect(() => {
    const p = new URLSearchParams();
    if (q.trim()) p.set('q', q.trim());
    if (seg && filter === 'all') p.set('segment', seg);
    if (status !== 'All') p.set('status', status);
    if (from && to) { p.set('from', from); p.set('to', to); }
    const qs = p.toString();
    window.history.replaceState(null, '', qs ? `?${qs}` : window.location.pathname);
  }, [q, seg, filter, status, from, to]);

  function clearFilters() { setQ(''); setStatus('All'); setFrom(''); setTo(''); setPage(1); }

  async function runConfirm() {
    if (!confirm) return;
    setBusy(true);
    const { kind, s } = confirm;
    const isDelete = kind === 'delete';
    const r = await api(`student/${isDelete ? '' : 'unsubscribe/'}${s._id}`, { method: isDelete ? 'DELETE' : 'GET' },
      isDelete ? 'Could not delete the student.' : 'Could not unsubscribe the student.');
    if (r.ok) {
      setNotice({ tone: 'good', text: isDelete ? `${s.fullName} was deleted.` : `${s.fullName}’s plan was ended. They are now on the free version.` });
      await load();
      loadCounts();
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
    <div className="card flush">
      {notice ? <div className="pad"><Notice tone={notice.tone}>{notice.text}</Notice></div> : null}
      {filter === 'all' ? (
        <div className="tools">
          <div className="tabs" role="tablist" aria-label="Group of students">
            {TABS.map(t => (
              <button key={t.key} type="button" role="tab" aria-selected={seg === t.key} onClick={() => changeFilter(() => setSeg(t.key))}>
                {t.label}{counts ? <em>{counts[t.count]}</em> : null}
              </button>
            ))}
          </div>
        </div>
      ) : null}
      {seg && NOTES[seg] ? <div className="segnote">{NOTES[seg]}</div> : null}
      <div className="filters">
        <label>Search
          <input type="search" placeholder="Name or mobile number" value={q} onChange={e => changeFilter(() => setQ(e.target.value))} />
        </label>
        <label>Account
          <select value={status} onChange={e => changeFilter(() => setStatus(e.target.value))}>
            <option value="All">All</option><option value="true">Active</option><option value="false">Inactive</option>
          </select>
        </label>
        <label>Joined from<input type="date" value={from} max={to || undefined} onChange={e => changeFilter(() => setFrom(e.target.value))} /></label>
        <label>Joined to<input type="date" value={to} min={from || undefined} onChange={e => changeFilter(() => setTo(e.target.value))} /></label>
        {filtered ? <button type="button" className="btn" onClick={clearFilters}>Clear filters</button> : null}
        <button type="button" className="btn export" onClick={exportXlsx} disabled={exporting}>{exporting ? 'Exporting…' : 'Export to Excel'}</button>
      </div>
      {(from && !to) || (!from && to) ? <p className="hint pad">Pick both dates to filter by joining date.</p> : null}

      <div className="tw flat" aria-busy={loading}>
        <table className="tbl pk users">
          <thead>
            <tr><th>Student</th><th>Plan</th><th>Plan ends</th><th>Joined</th><th className="narrow-col"><span className="sr-only">Actions</span></th></tr>
          </thead>
          <tbody className={loading ? 'dim' : ''}>
            {rows.map(s => {
              const st = statusOf(s);
              return (
                <tr key={s._id}>
                  <td>
                    <Link href={`/users/${s._id}`} className="strong-link">{s.fullName}</Link>
                    <div className="desc">{s.mobileNumber || '—'}{s.isActive ? '' : ' · Account inactive'}</div>
                  </td>
                  <td><Pill tone={STATUS_TONE[st]}>{STATUS_LABEL[st]}</Pill></td>
                  <td>{s.subscriptionEndDate ? <>{fmtDate(s.subscriptionEndDate)}<div className={'desc' + (st === 'expiring' ? ' warn-text' : '')}>{endsWhen(s.subscriptionEndDate)}</div></> : <span className="muted">No plan yet</span>}</td>
                  <td>{fmtDate(s.createdAt)}</td>
                  <td>
                    <div className="row-actions">
                      <Link className="btn sm" href={`/users/${s._id}`}>Open</Link>
                      <div className="kebab">
                        <button type="button" className="btn ghost sm" aria-haspopup="menu" aria-expanded={menu === s._id} aria-label={`More actions for ${s.fullName}`}
                                onClick={e => { e.stopPropagation(); setMenu(menu === s._id ? null : s._id); }}>⋯</button>
                        {menu === s._id ? (
                          <div className="menu" role="menu">
                            <Link role="menuitem" href={`/offline-payments/new?studentId=${s._id}&name=${encodeURIComponent(s.fullName)}`}>{isRunning(st) ? 'Renew plan' : 'Add payment'}</Link>
                            {isRunning(st) ? <button type="button" role="menuitem" onClick={() => { setMenu(null); setConfirm({ kind: 'unsub', s }); }}>End plan now…</button> : null}
                            <button type="button" role="menuitem" className="dn" onClick={() => { setMenu(null); setConfirm({ kind: 'delete', s }); }}>Delete…</button>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
            {!rows.length && !loading ? (
              <tr><td colSpan={5}>
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
        danger
        busy={busy}
        title={confirm?.kind === 'delete' ? 'Delete this student?' : 'End this plan now?'}
        body={confirm?.kind === 'delete'
          ? `${confirm?.s.fullName} will be removed from the list. This cannot be undone from here.`
          : `${confirm?.s.fullName} moves to the free version straight away. Only the free videos stay open. Progress is kept.`}
        confirmLabel={confirm?.kind === 'delete' ? 'Delete student' : 'End plan'}
        onConfirm={runConfirm}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}
