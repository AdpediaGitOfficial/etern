'use client';

import Link from 'next/link';
import { useCallback, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Icon from '@/components/icons';
import Toast, { type ToastData } from '@/components/Toast';
import { ConfirmDialog, PageHead } from '@/components/ui';
import { safeHref } from '@/components/CatalogueBrowser';
import { api } from '@/lib/api';
import { courseMaterialStatusForm } from '@/lib/catalogue';
import { kindLabel } from '@/lib/kind';
import type { CourseMaterialRow } from '@/lib/types';

/** One video: thumbnail, an "Open video" button, where it sits, and the controls to turn it on or off, edit or delete. */
export default function CourseMaterialDetail({ initial, assetBase }: { initial: CourseMaterialRow; assetBase: string }) {
  const router = useRouter();
  const [m, setM] = useState(initial);
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<ToastData | null>(null);
  const nextId = useRef(1);
  const say = useCallback((msg: string, x: Partial<ToastData> = {}) => setToast({ id: nextId.current++, msg, ...x }), []);
  const href = safeHref(m.courseMaterialUrl);
  const img = m.imageUrl ? assetBase + m.imageUrl : null;
  const cat = m.subCategoryId?.categoryId?.categoryName;
  const sub = m.subCategoryId?.subCategoryName;

  async function setActive(isActive: boolean, isUndo = false) {
    const before = m;
    setM({ ...m, isActive });
    const r = await api(`coursematerial/${m._id}`, { method: 'PUT', body: courseMaterialStatusForm(before, isActive) }, 'Could not update this course material.');
    if (!r.ok) { setM(before); say(r.message, { tone: 'bad' }); return; }
    say(isUndo ? `Back to ${isActive ? 'Active' : 'Inactive'}.` : `“${m.courseMaterialName}” is now ${isActive ? 'Active' : 'Inactive'}.`, isUndo ? {} : { undo: () => setActive(!isActive, true) });
  }

  async function remove() {
    setBusy(true);
    const r = await api(`coursematerial/${m._id}`, { method: 'DELETE' }, 'Could not delete this course material.');
    if (r.ok) { router.push('/course-materials?notice=deleted'); return; }
    say(r.message, { tone: 'bad' });
    setBusy(false);
    setConfirm(false);
  }

  return (
    <>
      <PageHead title={m.courseMaterialName} subtitle={[cat, sub].filter(Boolean).join(' › ') || 'Course material'}>
        <button type="button" className="sw big" role="switch" aria-checked={m.isActive} onClick={() => setActive(!m.isActive)}
                aria-label={`${m.courseMaterialName} is ${m.isActive ? 'active' : 'inactive'}. Press to turn ${m.isActive ? 'off' : 'on'}`}><i /><span>{m.isActive ? 'Active' : 'Inactive'}</span></button>
        <Link className="btn primary" href={`/course-materials/${m._id}/edit`}>Edit course material</Link>
        <button type="button" className="btn danger-o icon-only" onClick={() => setConfirm(true)} aria-label="Delete this course material"><Icon name="x" size={16} /></button>
      </PageHead>

      <div className="stat-strip">
        <div className="stat"><span>For</span><b>{kindLabel(m.type)}</b></div>
        <div className="stat"><span>Category</span><b>{cat ?? '—'}</b></div>
        <div className="stat"><span>Sub category</span><b>{sub ?? '—'}</b></div>
        <div className="stat"><span>Visible to students</span><b className={m.isActive ? 'good-text' : 'muted'}>{m.isActive ? 'Yes' : 'No, draft'}</b></div>
      </div>

      <div className="pk-layout detail">
        <div>
          <section className="card sec">
            <h2>Video</h2>
            <div className="mcell big">
              {img ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img className="pic" src={img} alt={`${m.courseMaterialName} thumbnail`} />
              ) : <p className="muted">No thumbnail yet. <Link href={`/course-materials/${m._id}/edit`}>Add one</Link></p>}
            </div>
            <div className="linkcell big">
              {href ? <a href={href} target="_blank" rel="noopener noreferrer">{m.courseMaterialUrl.replace(/^https?:\/\//i, '')}</a> : <span className="muted">{m.courseMaterialUrl || 'No link'} (not a web link)</span>}
            </div>
            {href ? <a className="btn primary" href={href} target="_blank" rel="noopener noreferrer">Open video</a> : null}
          </section>
          <section className="card sec">
            <h2>Description</h2>
            <p className="desc-full">{m.description?.trim() || <span className="muted">No description.</span>}</p>
            <p className="muted">Show order: {m.sorting}</p>
          </section>
        </div>
        <aside className="prev" aria-label="Preview">
          <div className="lab">What students see</div>
          <div className="cardp">
            {img ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="pic" src={img} alt="" />
            ) : null}
            <h3>{m.courseMaterialName}</h3>
            <span className="chip">{kindLabel(m.type)}</span>
            {m.description?.trim() ? <p className="muted pv-desc">{m.description.trim()}</p> : null}
            <div className="pv-status">{m.isActive ? <span className="chip good">● Visible to students</span> : <span className="chip">Draft · hidden</span>}</div>
          </div>
        </aside>
      </div>

      <ConfirmDialog open={confirm} danger busy={busy} title={`Delete “${m.courseMaterialName}”?`} body="Students will no longer see this video." confirmLabel="Delete course material" onConfirm={remove} onCancel={() => setConfirm(false)} />
      <Toast toast={toast} onClose={() => setToast(null)} />
    </>
  );
}
