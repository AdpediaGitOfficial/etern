'use client';

import Link from 'next/link';
import { ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Icon from '@/components/icons';
import Toast, { type ToastData } from '@/components/Toast';
import { ConfirmDialog, Empty, PanelError, Pager } from '@/components/ui';
import { api, listOf, totalOf } from '@/lib/api';
import { listQuery, type StatusTab } from '@/lib/catalogue';
import { kindLabel } from '@/lib/kind';

const PER = 10;

interface Row { _id: string; isActive: boolean; type: string; description?: string; imageUrl?: string; sorting: number }

interface Props<T extends Row> {
  noun: string; // "category"
  plural: string; // "categories"
  base: string; // "/categories"
  endpoint: string; // "category"
  listPath: string; // "category/all"
  nameParam: string; // backend search parameter
  typeFilter: boolean;
  nameOf: (r: T) => string;
  /** Second line under the name. */
  subOf: (r: T) => string;
  /** Extra column, e.g. the package a category belongs to. */
  parentHeader: string;
  parentOf: (r: T) => string;
  statusForm: (r: T, isActive: boolean) => FormData;
  assetBase: string;
  initial: { rows: T[]; total: number } | null;
  notice?: string;
  panelExtra?: (r: T) => [string, ReactNode][];
  /** The backend ignores search for some lists; then the search box is left out. Default true. */
  searchable?: boolean;
  /** True when the backend already treats the search word as plain text (course materials). */
  serverEscapes?: boolean;
  /** Media lists (course materials) show a thumbnail beside the name and the link in its own column. */
  media?: { linkHeader: string; linkOf: (r: T) => string };
}

/** Only http(s) links become clickable, so a stored javascript: URL can never run. */
export const safeHref = (u: string): string | null => (/^https?:\/\//i.test(u) ? u : null);

function Thumb({ src, name }: { src: string | null; name: string }) {
  const [bad, setBad] = useState(false);
  return src && !bad ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img className="mt" src={src} alt="" loading="lazy" onError={() => setBad(true)} />
  ) : <span className="mt ph" aria-hidden="true">{name.trim().slice(0, 1).toUpperCase() || '?'}</span>;
}

function LinkCell({ url, onCopy }: { url: string; onCopy: () => void }) {
  const href = safeHref(url);
  if (!url) return <span className="muted">No link</span>;
  return (
    <div className="linkcell">
      {href ? <a href={href} target="_blank" rel="noopener noreferrer" title={url}>{url.replace(/^https?:\/\//i, '')}</a> : <span className="muted" title="Not a web link">{url}</span>}
      <button type="button" className="btn ghost sm" aria-label="Copy link" onClick={async () => { try { await navigator.clipboard.writeText(url); onCopy(); } catch { /* clipboard blocked: nothing to do */ } }}>Copy</button>
    </div>
  );
}

export default function CatalogueBrowser<T extends Row>(p: Props<T>) {
  const router = useRouter();
  const [rows, setRows] = useState<T[]>(p.initial?.rows ?? []);
  const [total, setTotal] = useState(p.initial?.total ?? 0);
  const [failed, setFailed] = useState(!p.initial);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [term, setTerm] = useState('');
  const [tab, setTab] = useState<StatusTab>('all');
  const [type, setType] = useState<'' | 'kid' | 'parent'>('');
  const [menu, setMenu] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<T | null>(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<ToastData | null>(p.notice ? { id: 0, msg: p.notice, tone: 'good' } : null);
  const nextId = useRef(1);
  const skipFirst = useRef(Boolean(p.initial));
  const say = useCallback((msg: string, extra: Partial<ToastData> = {}) => setToast({ id: nextId.current++, msg, ...extra }), []);

  // The search box waits for a pause in typing before asking the server.
  useEffect(() => {
    const t = setTimeout(() => { setTerm(q); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [q]);

  const query = listQuery({ page, per: PER, q: term, tab, type, nameParam: p.nameParam, typeParam: p.typeFilter, escape: !p.serverEscapes });

  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    try {
      const r = await api<{ result: unknown }>(`${p.listPath}?${query}`, { signal });
      if (!r.ok) { setFailed(true); return; }
      setRows(listOf<T>(r.body?.result));
      setTotal(totalOf(r.body?.result));
      setFailed(false);
    } catch { /* aborted: a newer request is in flight */ } finally { setLoading(false); }
  }, [p.listPath, query]);

  useEffect(() => {
    if (skipFirst.current) { skipFirst.current = false; return; }
    const ctl = new AbortController();
    load(ctl.signal);
    return () => ctl.abort();
  }, [load]);

  useEffect(() => {
    if (!menu) return;
    const close = (e: Event) => { if (!(e.target as HTMLElement).closest('.kebab')) setMenu(null); };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenu(null); };
    document.addEventListener('click', close);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('click', close); document.removeEventListener('keydown', esc); };
  }, [menu]);

  /** Flips Active/Inactive at once, then confirms with the server. On failure it flips back. */
  async function setActive(r: T, isActive: boolean, isUndo = false) {
    const apply = (v: boolean) => {
      setRows(rs => rs.map(x => (x._id === r._id ? { ...x, isActive: v } : x)));
    };
    apply(isActive);
    const res = await api(`${p.endpoint}/${r._id}`, { method: 'PUT', body: p.statusForm(r, isActive) }, `Could not update “${p.nameOf(r)}”.`);
    if (!res.ok) { apply(!isActive); say(res.message, { tone: 'bad' }); return; }
    if (isUndo) say(`“${p.nameOf(r)}” is ${isActive ? 'Active' : 'Inactive'} again.`);
    else say(`“${p.nameOf(r)}” is now ${isActive ? 'Active' : 'Inactive'}.`, { undo: () => setActive({ ...r, isActive }, !isActive, true) });
    if (tab !== 'all') load(); // the row may no longer belong to this tab
  }

  async function remove() {
    if (!confirm) return;
    setBusy(true);
    const res = await api(`${p.endpoint}/${confirm._id}`, { method: 'DELETE' }, `Could not delete “${p.nameOf(confirm)}”.`);
    if (res.ok) {
      say(`“${p.nameOf(confirm)}” was deleted.`);
      if (rows.length === 1 && page > 1) setPage(page - 1); else await load();
    } else say(res.message, { tone: 'bad' });
    setBusy(false);
    setConfirm(null);
  }

  const filtered = Boolean(term.trim() || tab !== 'all' || type);
  // The whole row opens the item's page; the switch and the ⋯ menu keep their own clicks.
  const openRow = (r: T) => (e: React.MouseEvent) => {
    if (!(e.target as HTMLElement).closest('button, a')) router.push(`${p.base}/${r._id}`);
  };
  const pickTab = (t: StatusTab) => { setTab(t); setPage(1); };
  const pickType = (t: '' | 'kid' | 'parent') => { setType(t); setPage(1); };

  return (
    <div className="card flush">
      <div className="tools">
        {p.searchable === false ? null : (
          <label className="searchbox">
            <Icon name="search" size={16} />
            <input type="search" placeholder={`Search ${p.plural}`} aria-label={`Search ${p.plural}`} value={q} onChange={e => setQ(e.target.value)} />
          </label>
        )}
        <div className="tabs" role="tablist" aria-label="Filter by status">
          {([['all', 'All'], ['on', 'Active'], ['off', 'Inactive']] as const).map(([k, label]) => (
            <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => pickTab(k)}>{label}</button>
          ))}
        </div>
        {p.typeFilter ? (
          <div className="tabs" role="tablist" aria-label="Filter by type">
            {([['', 'Any type'], ['kid', 'Kid'], ['parent', 'Parent']] as const).map(([k, label]) => (
              <button key={k} type="button" role="tab" aria-selected={type === k} onClick={() => pickType(k)}>{label}</button>
            ))}
          </div>
        ) : null}
      </div>

      {failed && !rows.length ? (
        <PanelError onRetry={() => load()} busy={loading} />
      ) : (
        <div className="tw flat" aria-busy={loading}>
          <table className={'tbl pk' + (p.media ? ' media' : '')}>
            <thead><tr><th>{p.noun[0].toUpperCase() + p.noun.slice(1)}</th>{p.media ? <th>{p.media.linkHeader}</th> : null}<th>{p.parentHeader}</th>{p.media ? null : <th>Type</th>}<th>Status</th><th className="narrow-col"><span className="sr-only">Actions</span></th></tr></thead>
            <tbody className={loading ? 'dim' : ''}>
              {rows.map(r => (
                <tr key={r._id} className="clickable" onClick={openRow(r)}>
                  <td>
                    <div className={p.media ? 'mcell' : undefined}>
                      {p.media ? <Thumb src={r.imageUrl ? p.assetBase + r.imageUrl : null} name={p.nameOf(r)} /> : null}
                      <div className="mtext">
                        <Link className="strong-link" href={`${p.base}/${r._id}`}>{p.nameOf(r)}</Link>
                        <div className="desc">{p.subOf(r)}</div>
                        {p.media ? <div className="desc mob-link">{p.media.linkOf(r).replace(/^https?:\/\//i, '')}</div> : null}
                      </div>
                    </div>
                  </td>
                  {p.media ? <td><LinkCell url={p.media.linkOf(r)} onCopy={() => say('Link copied.')} /></td> : null}
                  <td>{p.parentOf(r) || '—'}</td>
                  {p.media ? null : <td><span className="chip">{kindLabel(r.type)}</span></td>}
                  <td>
                    <button type="button" className="sw" role="switch" aria-checked={r.isActive} onClick={() => setActive(r, !r.isActive)}
                            aria-label={`${p.nameOf(r)}: ${r.isActive ? 'active' : 'inactive'}. Press to ${r.isActive ? 'turn off' : 'turn on'}`}>
                      <i /><span>{r.isActive ? 'Active' : 'Inactive'}</span>
                    </button>
                  </td>
                  <td>
                    <div className="kebab">
                      <button type="button" className="btn ghost sm" aria-haspopup="menu" aria-expanded={menu === r._id} aria-label={`More actions for ${p.nameOf(r)}`}
                              onClick={e => { e.stopPropagation(); setMenu(menu === r._id ? null : r._id); }}>⋯</button>
                      {menu === r._id ? (
                        <div className="menu" role="menu">
                          <Link role="menuitem" href={`${p.base}/${r._id}`}>Open</Link>
                          <Link role="menuitem" href={`${p.base}/${r._id}/edit`}>Edit</Link>
                          <button type="button" role="menuitem" className="dn" onClick={() => { setMenu(null); setConfirm(r); }}>Delete…</button>
                        </div>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!rows.length && !loading ? <Empty title={filtered ? `No ${p.plural} match` : `No ${p.plural} yet`} hint={filtered ? 'Try a different word or clear the filters.' : `Use “Add ${p.noun}” to create the first one.`} /> : null}
        </div>
      )}
      <Pager page={page} total={total} per={PER} onPage={setPage} />


      <ConfirmDialog open={Boolean(confirm)} danger busy={busy} title={`Delete “${confirm ? p.nameOf(confirm) : ''}”?`}
                     body="Items that depend on it may stop showing in the app." confirmLabel={`Delete ${p.noun}`} onConfirm={remove} onCancel={() => setConfirm(null)} />
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
