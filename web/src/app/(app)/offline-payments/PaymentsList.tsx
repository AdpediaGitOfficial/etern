'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pager } from '@/components/ui';
import { api } from '@/lib/api';
import { fmtDate, inr } from '@/lib/format';
import type { Paged, Payment } from '@/lib/types';

const PER = 10;

export default function PaymentsList({ mode, initial }: { mode: 'offline' | 'online'; initial: Paged<Payment> | null }) {
  const base = mode === 'offline' ? '/offline-payments' : '/online-payments';
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [rows, setRows] = useState<Payment[]>(initial?.data ?? []);
  const [total, setTotal] = useState(initial?.totalCount ?? 0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(!initial);
  const first = useRef(Boolean(initial));

  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(false);
    const p = new URLSearchParams({ mode, page: String(page), limit: String(PER) });
    if (q.trim()) p.set('studentName', q.trim());
    try {
      const r = await api<{ result?: Paged<Payment> }>(`subscription/offlinepayments?${p}`, { signal });
      if (!r.ok) { setError(true); return; }
      setRows(r.body?.result?.data ?? []);
      setTotal(r.body?.result?.totalCount ?? 0);
    } catch {
      /* aborted: a newer request is in flight */
    } finally {
      setLoading(false);
    }
  }, [mode, page, q]);

  useEffect(() => {
    if (first.current) { first.current = false; return; }
    const ctl = new AbortController();
    const t = setTimeout(() => load(ctl.signal), q ? 350 : 0);
    return () => { clearTimeout(t); ctl.abort(); };
  }, [load, q]);

  return (
    <div className="card">
      <div className="filters">
        <label>Search
          <input type="search" placeholder="Student name" value={q} onChange={e => { setQ(e.target.value); setPage(1); }} />
        </label>
      </div>
      <div className="tw" aria-busy={loading}>
        <table className="tbl">
          <thead><tr><th>#</th><th>Student</th><th>Package</th><th className="n">Amount</th><th>Entry date</th><th>Actions</th></tr></thead>
          <tbody className={loading ? 'dim' : ''}>
            {rows.map((p, i) => (
              <tr key={p._id}>
                <td>{(page - 1) * PER + i + 1}</td>
                <td><Link href={`${base}/${p._id}`} className="strong-link">{p.studentId?.fullName ?? '—'}</Link></td>
                <td>{p.packageId?.packageName ?? '—'}</td>
                <td className="n">{p.paymentId?.amount === undefined ? '—' : inr(p.paymentId.amount)}</td>
                <td>{fmtDate(p.createdAt, 'medium')}</td>
                <td><Link className="btn sm" href={`${base}/${p._id}`}>View</Link></td>
              </tr>
            ))}
            {!rows.length && !loading ? (
              <tr><td colSpan={6}>
                {error ? (
                  <div className="err" role="alert"><strong>We couldn’t load payments.</strong><span>The server didn’t respond. Your data is safe.</span><button type="button" className="btn" onClick={() => load()}>Try again</button></div>
                ) : (
                  <div className="empty"><strong>{q ? `No payments for “${q}”` : `No ${mode} payments yet`}</strong><span>{q ? 'Try a different name.' : 'Payments will appear here once recorded.'}</span></div>
                )}
              </td></tr>
            ) : null}
          </tbody>
        </table>
      </div>
      <Pager page={page} total={total} per={PER} onPage={setPage} />
    </div>
  );
}
