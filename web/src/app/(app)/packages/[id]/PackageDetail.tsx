'use client';

import Link from 'next/link';
import { useCallback, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Icon from '@/components/icons';
import Toast, { type ToastData } from '@/components/Toast';
import { ConfirmDialog, PageHead } from '@/components/ui';
import { api } from '@/lib/api';
import { firstOf } from '@/lib/entityPage';
import { inr } from '@/lib/format';
import { bestValueIndex, durationLabel, perMonth, planSummary, repeatedLengths, sortedPlans, statusPayload } from '@/lib/packages';
import type { PackageRow } from '@/lib/types';

/** The package page: who it is for, what it costs, and the controls to turn it on or off, edit, copy or delete. */
export default function PackageDetail({ initial }: { initial: PackageRow }) {
  const router = useRouter();
  const [p, setP] = useState(initial);
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<ToastData | null>(null);
  const nextId = useRef(1);
  const say = useCallback((msg: string, extra: Partial<ToastData> = {}) => setToast({ id: nextId.current++, msg, ...extra }), []);

  // Shortest first, so a long price list reads in order instead of in the order it happened to be saved.
  const plans = sortedPlans(p.packageCosts);
  const summary = planSummary(plans, inr);
  const best = bestValueIndex(plans);
  const repeated = repeatedLengths(plans);

  async function setActive(isActive: boolean, isUndo = false) {
    const before = p;
    setP({ ...p, isActive });
    const r = await api(`package/${p._id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(statusPayload(before, isActive)) }, 'Could not update this package.');
    if (!r.ok) { setP(before); say(r.message, { tone: 'bad' }); return; }
    say(isUndo ? `Back to ${isActive ? 'Active' : 'Inactive'}.` : `“${p.packageName}” is now ${isActive ? 'Active' : 'Inactive'}.`, isUndo ? {} : { undo: () => setActive(!isActive, true) });
    // The backend recreates plans (new ids) on every save, so read the package again to stay in sync.
    const fresh = await api<{ result?: unknown }>(`package/${p._id}`);
    const next = fresh.ok ? firstOf<PackageRow>(fresh.body?.result) : null;
    if (next) setP(next);
  }

  async function remove() {
    setBusy(true);
    const r = await api(`package/${p._id}`, { method: 'DELETE' }, 'Could not delete this package.');
    if (r.ok) { router.push('/packages?notice=deleted'); return; }
    say(r.message, { tone: 'bad' });
    setBusy(false);
    setConfirm(false);
  }

  return (
    <>
      <PageHead title={p.packageName} subtitle={`For ages ${p.ageFrom}–${p.ageTo}`}>
        <button type="button" className="sw big" role="switch" aria-checked={p.isActive} onClick={() => setActive(!p.isActive)}
                aria-label={`${p.packageName} is ${p.isActive ? 'active' : 'inactive'}. Press to turn ${p.isActive ? 'off' : 'on'}`}>
          <i /><span>{p.isActive ? 'Active' : 'Inactive'}</span>
        </button>
        <Link className="btn" href={`/packages/new?copy=${p._id}`}><Icon name="layers" size={16} />Duplicate</Link>
        <Link className="btn primary" href={`/packages/${p._id}/edit`}>Edit package</Link>
        <button type="button" className="btn danger-o icon-only" onClick={() => setConfirm(true)} aria-label="Delete this package"><Icon name="x" size={16} /></button>
      </PageHead>

      <div className="stat-strip">
        <div className="stat"><span>Age group</span><b>{p.ageFrom}–{p.ageTo} years</b></div>
        <div className="stat"><span>Plans</span><b>{plans.length || 'None'}</b></div>
        <div className="stat"><span>Starting price</span><b>{summary ? summary.headline.replace('From ', '') : '—'}</b></div>
        <div className="stat"><span>Visible to students</span><b className={p.isActive ? 'good-text' : 'muted'}>{p.isActive ? 'Yes' : 'No, draft'}</b></div>
      </div>

      <div className="pk-layout detail">
        <div>
          <section className="card sec">
            <div className="ch" style={{ marginBottom: 12 }}>
              <div><h2>Plans</h2><p className="muted">Each plan starts the day it is given to a student.</p></div>
              <Link className="btn sm" href={`/packages/${p._id}/edit`}>{plans.length ? 'Change plans' : 'Add a plan'}</Link>
            </div>
            {repeated.size ? (
              <p className="warn-line" role="status">
                {repeated.size === 1 ? 'One length is' : `${repeated.size} lengths are`} offered at more than one price
                ({[...repeated].sort((a, b) => a - b).map(durationLabel).join(', ')}). Students see every plan, so keep the one you mean to sell.
              </p>
            ) : null}
            {plans.length ? (
              <div className="plan-grid">
                {plans.map((c, i) => (
                  <div key={c._id ?? i} className={'plan-card' + (i === best ? ' best' : '')}>
                    {i === best ? <span className="badge-best">Best value</span> : null}
                    <div className="len">{durationLabel(c.validity)}{repeated.has(c.validity) ? <span className="dup" title="Another plan is this length too">repeated</span> : null}</div>
                    <div className="amt">{inr(c.price)}</div>
                    <div className="muted per">{c.validity > 30 ? `about ${inr(Math.round(perMonth(c)))} a month` : 'one month of access'}</div>
                    <small className="muted">{c.validity} days of access</small>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty"><strong>No plans yet</strong><span>Students cannot buy this package until it has at least one plan.</span><Link className="btn primary" href={`/packages/${p._id}/edit`}>Add a plan</Link></div>
            )}
          </section>

          <section className="card sec">
            <h2>Description</h2>
            <p className="desc-full">{p.description?.trim() || <span className="muted">No description. Add one so parents know what is included.</span>}</p>
          </section>
        </div>

        <aside className="prev" aria-label="Preview">
          <div className="lab">What students see</div>
          <div className="cardp">
            <h3>{p.packageName}</h3>
            <span className="chip">{p.ageFrom}–{p.ageTo} years</span>
            {p.description?.trim() ? <p className="muted pv-desc">{p.description.trim()}</p> : null}
            {plans.map((c, i) => <div key={c._id ?? i} className="pl"><span>{durationLabel(c.validity)}</span><b>{inr(c.price)}</b></div>)}
            <div className="pv-status">{p.isActive ? <span className="chip good">● Visible to students</span> : <span className="chip">Draft · hidden</span>}</div>
          </div>
        </aside>
      </div>

      <ConfirmDialog open={confirm} danger busy={busy} title={`Delete “${p.packageName}”?`} body="Students who already bought it keep access. It will no longer be offered to anyone."
                     confirmLabel="Delete package" onConfirm={remove} onCancel={() => setConfirm(false)} />
      <Toast toast={toast} onClose={() => setToast(null)} />
    </>
  );
}
