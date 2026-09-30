'use client';

import Link from 'next/link';
import { ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { ConfirmDialog, Notice, Pager, Pill } from '@/components/ui';
import { api, listOf, totalOf } from '@/lib/api';

const PER = 10;

export interface Column<T> { header: string; cell: (row: T) => ReactNode }

interface Props<T extends { _id: string; isActive: boolean }> {
  /** e.g. "category": used for wording and the delete endpoint */
  noun: string;
  base: string;
  endpoint: string;
  /** Server-paged when set (`page` and `limit` are sent); otherwise the full list is paged in the browser. */
  listPath: string;
  serverPaged: boolean;
  columns: Column<T>[];
  nameOf: (row: T) => string;
  initial: { rows: T[]; total: number } | null;
}

export default function CatalogueList<T extends { _id: string; isActive: boolean }>({ noun, base, endpoint, listPath, serverPaged, columns, nameOf, initial }: Props<T>) {
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<T[]>(initial?.rows ?? []);
  const [total, setTotal] = useState(initial?.total ?? 0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(!initial);
  const [notice, setNotice] = useState<{ tone: 'good' | 'bad'; text: string } | null>(null);
  const [confirm, setConfirm] = useState<T | null>(null);
  const [busy, setBusy] = useState(false);
  const skipFirst = useRef(Boolean(initial));

  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(false);
    const query = serverPaged ? `?page=${page}&limit=${PER}` : '';
    try {
      const r = await api<{ result: unknown }>(`${listPath}${query}`, { signal });
      if (!r.ok) { setError(true); return; }
      setRows(listOf<T>(r.body?.result));
      setTotal(totalOf(r.body?.result));
    } catch {
      /* aborted: a newer request is in flight */
    } finally {
      setLoading(false);
    }
  }, [listPath, page, serverPaged]);

  useEffect(() => {
    if (skipFirst.current) { skipFirst.current = false; return; }
    if (!serverPaged) return; // the whole list is already in memory
    const ctl = new AbortController();
    load(ctl.signal);
    return () => ctl.abort();
  }, [load, serverPaged]);

  async function remove() {
    if (!confirm) return;
    setBusy(true);
    const r = await api(`${endpoint}/${confirm._id}`, { method: 'DELETE' }, `Could not delete the ${noun}.`);
    if (r.ok) {
      setNotice({ tone: 'good', text: `“${nameOf(confirm)}” was deleted.` });
      if (serverPaged && rows.length === 1 && page > 1) setPage(page - 1);
      else await load();
    } else {
      setNotice({ tone: 'bad', text: r.message });
    }
    setBusy(false);
    setConfirm(null);
  }

  const visible = serverPaged ? rows : rows.slice((page - 1) * PER, page * PER);
  const count = serverPaged ? total : rows.length;

  return (
    <div className="card">
      {notice ? <Notice tone={notice.tone}>{notice.text}</Notice> : null}
      <div className="tw" aria-busy={loading}>
        <table className="tbl">
          <thead>
            <tr>
              <th>#</th>
              {columns.map(c => <th key={c.header}>{c.header}</th>)}
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody className={loading ? 'dim' : ''}>
            {visible.map((row, i) => (
              <tr key={row._id}>
                <td>{(page - 1) * PER + i + 1}</td>
                {columns.map(c => <td key={c.header}>{c.cell(row)}</td>)}
                <td><Pill tone={row.isActive ? 'good' : 'off'}>{row.isActive ? 'Active' : 'Inactive'}</Pill></td>
                <td>
                  <div className="row-actions">
                    <Link className="btn sm" href={`${base}/${row._id}`}>View</Link>
                    <Link className="btn sm" href={`${base}/${row._id}/edit`}>Edit</Link>
                    <button type="button" className="btn sm danger-o" onClick={() => setConfirm(row)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
            {!visible.length && !loading ? (
              <tr><td colSpan={columns.length + 3}>
                {error ? (
                  <div className="err" role="alert"><strong>We couldn’t load the list.</strong><span>The server didn’t respond. Your data is safe.</span><button type="button" className="btn" onClick={() => load()}>Try again</button></div>
                ) : (
                  <div className="empty"><strong>No {noun}s yet</strong><span>Use the Add button to create the first one.</span></div>
                )}
              </td></tr>
            ) : null}
          </tbody>
        </table>
      </div>
      <Pager page={page} total={count} per={PER} onPage={setPage} />
      <ConfirmDialog
        open={Boolean(confirm)}
        danger
        busy={busy}
        title={`Delete this ${noun}?`}
        body={confirm ? `“${nameOf(confirm)}” will be removed. Items that depend on it may stop showing in the app.` : ''}
        confirmLabel={`Delete ${noun}`}
        onConfirm={remove}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}
