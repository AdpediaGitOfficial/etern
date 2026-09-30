'use client';

import Link from 'next/link';
import { ReactNode, useCallback, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Toast, { type ToastData } from '@/components/Toast';
import { ConfirmDialog, PageHead } from '@/components/ui';
import Icon from '@/components/icons';
import { api } from '@/lib/api';
import { categoryStatusForm, subCategoryStatusForm } from '@/lib/catalogue';
import { kindLabel } from '@/lib/kind';
import type { CategoryRow, SubCategoryRow } from '@/lib/types';

interface Row { _id: string; isActive: boolean; type: string; sorting: number; description?: string; imageUrl?: string }

/** The page for one category or sub category: status switch, key facts, description, picture and a student preview. */
export default function CatalogueDetail<T extends Row>({ initial, kind, noun, base, endpoint, name, subtitle, parentLabel, parentName, assetBase, extra }: {
  initial: T; kind: 'category' | 'subcategory'; noun: string; base: string; endpoint: string; name: string; subtitle: string;
  parentLabel: string; parentName: string; assetBase: string;
  extra?: ReactNode;
}) {
  // Chosen here, not passed in, because a server page cannot hand a function to a client component.
  const statusForm = (r: T, isActive: boolean) => (kind === 'category' ? categoryStatusForm(r as unknown as CategoryRow, isActive) : subCategoryStatusForm(r as unknown as SubCategoryRow, isActive));
  const router = useRouter();
  const [r, setR] = useState(initial);
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<ToastData | null>(null);
  const nextId = useRef(1);
  const say = useCallback((msg: string, x: Partial<ToastData> = {}) => setToast({ id: nextId.current++, msg, ...x }), []);

  async function setActive(isActive: boolean, isUndo = false) {
    const before = r;
    setR({ ...r, isActive });
    const res = await api(`${endpoint}/${r._id}`, { method: 'PUT', body: statusForm(before, isActive) }, `Could not update this ${noun}.`);
    if (!res.ok) { setR(before); say(res.message, { tone: 'bad' }); return; }
    say(isUndo ? `Back to ${isActive ? 'Active' : 'Inactive'}.` : `“${name}” is now ${isActive ? 'Active' : 'Inactive'}.`, isUndo ? {} : { undo: () => setActive(!isActive, true) });
  }

  async function remove() {
    setBusy(true);
    const res = await api(`${endpoint}/${r._id}`, { method: 'DELETE' }, `Could not delete this ${noun}.`);
    if (res.ok) { router.push(`${base}?notice=deleted`); return; }
    say(res.message, { tone: 'bad' });
    setBusy(false);
    setConfirm(false);
  }

  const img = r.imageUrl ? assetBase + r.imageUrl : null;
  return (
    <>
      <PageHead title={name} subtitle={subtitle}>
        <button type="button" className="sw big" role="switch" aria-checked={r.isActive} onClick={() => setActive(!r.isActive)}
                aria-label={`${name} is ${r.isActive ? 'active' : 'inactive'}. Press to turn ${r.isActive ? 'off' : 'on'}`}><i /><span>{r.isActive ? 'Active' : 'Inactive'}</span></button>
        <Link className="btn primary" href={`${base}/${r._id}/edit`}>Edit {noun}</Link>
        <button type="button" className="btn danger-o icon-only" onClick={() => setConfirm(true)} aria-label={`Delete this ${noun}`}><Icon name="x" size={16} /></button>
      </PageHead>

      <div className="stat-strip">
        <div className="stat"><span>For</span><b>{kindLabel(r.type)}</b></div>
        <div className="stat"><span>{parentLabel}</span><b>{parentName || '—'}</b></div>
        <div className="stat"><span>Show order</span><b>{r.sorting}</b></div>
        <div className="stat"><span>Visible to students</span><b className={r.isActive ? 'good-text' : 'muted'}>{r.isActive ? 'Yes' : 'No, draft'}</b></div>
      </div>

      <div className="pk-layout detail">
        <div>
          <section className="card sec">
            <h2>Description</h2>
            <p className="desc-full">{r.description?.trim() || <span className="muted">No description. Add one so students know what is inside.</span>}</p>
          </section>
          <section className="card sec">
            <h2>Picture</h2>
            {img ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="pic" src={img} alt={`${name} image`} />
            ) : <p className="muted">No picture yet. <Link href={`${base}/${r._id}/edit`}>Add one</Link></p>}
          </section>
          {extra}
        </div>
        <aside className="prev" aria-label="Preview">
          <div className="lab">What students see</div>
          <div className="cardp">
            {img ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="pic" src={img} alt="" />
            ) : null}
            <h3>{name}</h3>
            <span className="chip">{kindLabel(r.type)}</span>
            {r.description?.trim() ? <p className="muted pv-desc">{r.description.trim()}</p> : null}
            <div className="pv-status">{r.isActive ? <span className="chip good">● Visible to students</span> : <span className="chip">Draft · hidden</span>}</div>
          </div>
        </aside>
      </div>

      <ConfirmDialog open={confirm} danger busy={busy} title={`Delete “${name}”?`} body="Items that depend on it may stop showing in the app." confirmLabel={`Delete ${noun}`} onConfirm={remove} onCancel={() => setConfirm(false)} />
      <Toast toast={toast} onClose={() => setToast(null)} />
    </>
  );
}
