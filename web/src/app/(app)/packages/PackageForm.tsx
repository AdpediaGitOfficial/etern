'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { inr } from '@/lib/format';
import { AGE_PRESETS, DURATIONS, draftFrom, durationLabel, emptyDraft, toPayload, validateDraft, type PackageDraft } from '@/lib/packages';
import { hasErrors } from '@/lib/validate';
import type { PackageRow } from '@/lib/types';

interface Props {
  /** Editing this package. */
  initial?: PackageRow;
  /** Starting a new package from a copy of this one. */
  copyOf?: PackageRow;
}

const isPreset = (days: string) => DURATIONS.some(d => String(d.days) === days);

export default function PackageForm({ initial, copyOf }: Props) {
  const router = useRouter();
  const [d, setD] = useState<PackageDraft>(() => (initial ? draftFrom(initial) : copyOf ? draftFrom(copyOf, { copy: true }) : emptyDraft()));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (patch: Partial<PackageDraft>) => setD(cur => ({ ...cur, ...patch }));
  const setPlan = (i: number, patch: Partial<PackageDraft['plans'][number]>) => set({ plans: d.plans.map((p, j) => (j === i ? { ...p, ...patch } : p)) });
  const clear = (key: string) => setErrors(e => (e[key] ? { ...e, [key]: '' } : e));

  const nameOk = d.name.trim().length >= 3;
  const ageOk = Number(d.ageFrom) >= 1 && Number(d.ageTo) >= Number(d.ageFrom);
  const plansOk = d.plans.length > 0 && d.plans.every(p => Number(p.price) >= 1 && Number(p.days) >= 1);

  async function onSubmit(ev: FormEvent) {
    ev.preventDefault();
    const found = validateDraft(d);
    setErrors(found);
    setSubmitError('');
    if (hasErrors(found)) {
      const first = found.name ? 'name' : found.age ? 'ageFrom' : Object.keys(found).find(k => found[k])?.replace(/^(price|days)(\d+)$/, '$1$2');
      setTimeout(() => (first ? document.getElementById(first)?.focus() : undefined), 0);
      return;
    }
    setBusy(true);
    const r = await api(initial ? `package/${initial._id}` : 'package', {
      method: initial ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(toPayload(d)),
    }, 'The package could not be saved. Check the details and try again.');
    if (r.ok) { router.push(`/packages?notice=${initial ? 'saved' : 'created'}`); router.refresh(); return; }
    setSubmitError(r.message);
    setBusy(false);
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      {submitError ? <div className="banner bad" role="alert">{submitError}</div> : null}
      <div className="pk-layout">
        <div>
          <section className="card sec">
            <h2><span className="n">1</span>Basics</h2>
            <p className="hint">Give it a clear name and say who it is for.</p>
            <label className="fld" htmlFor="name">Package name
              <input id="name" className={errors.name ? 'bad' : ''} value={d.name} onChange={e => { set({ name: e.target.value }); clear('name'); }} placeholder="e.g. Explorer, 6 months" autoComplete="off" autoFocus={!initial} aria-invalid={Boolean(errors.name)} />
              {errors.name ? <span className="f-err" role="alert">{errors.name}</span> : <span className="help">Students see this name.</span>}
            </label>

            <div className="fld" role="group" aria-labelledby="age-l">
              <span id="age-l" className="lbl">Age group</span>
              <div className="chips">
                {AGE_PRESETS.map(a => (
                  <button key={a.label} type="button" className="pick" aria-pressed={Number(d.ageFrom) === a.from && Number(d.ageTo) === a.to}
                          onClick={() => { set({ ageFrom: String(a.from), ageTo: String(a.to) }); clear('age'); }}>{a.label}</button>
                ))}
              </div>
              <div className="two">
                <label className="fld" htmlFor="ageFrom">From age
                  <input id="ageFrom" type="number" min="1" inputMode="numeric" className={errors.age ? 'bad' : ''} value={d.ageFrom} onChange={e => { set({ ageFrom: e.target.value }); clear('age'); }} />
                </label>
                <label className="fld" htmlFor="ageTo">To age
                  <input id="ageTo" type="number" min="1" inputMode="numeric" className={errors.age ? 'bad' : ''} value={d.ageTo} onChange={e => { set({ ageTo: e.target.value }); clear('age'); }} />
                </label>
              </div>
              {errors.age ? <span className="f-err" role="alert">{errors.age}</span> : null}
            </div>

            <label className="fld" htmlFor="description">Description <span className="help inline">(optional)</span>
              <textarea id="description" rows={3} value={d.description} onChange={e => set({ description: e.target.value })} placeholder="One sentence students and parents will read" />
            </label>
          </section>

          <section className="card sec">
            <h2><span className="n">2</span>Pricing</h2>
            <p className="hint">Add one or more plans. A plan starts the day it is given to a student and lasts the time you choose.</p>
            {d.plans.map((p, i) => (
              <div key={i} className="planrow">
                <div className="top">
                  <strong>Plan {i + 1}</strong>
                  {d.plans.length > 1 ? <button type="button" className="btn ghost sm" onClick={() => set({ plans: d.plans.filter((_, j) => j !== i) })} aria-label={`Remove plan ${i + 1}`}>Remove</button> : null}
                </div>
                <div className="fld" role="group" aria-label={`Plan ${i + 1} length`}>
                  <span className="lbl">How long does it last?</span>
                  <div className="chips">
                    {DURATIONS.map(x => <button key={x.days} type="button" className="pick" aria-pressed={p.days === String(x.days)} onClick={() => { setPlan(i, { days: String(x.days) }); clear(`days${i}`); }}>{x.label}</button>)}
                    <button type="button" className="pick" aria-pressed={!isPreset(p.days)} onClick={() => { if (isPreset(p.days)) setPlan(i, { days: '' }); }}>Custom</button>
                  </div>
                  {!isPreset(p.days) ? (
                    <label className="fld narrow" htmlFor={`days${i}`}>Days
                      <input id={`days${i}`} type="number" min="1" inputMode="numeric" className={errors[`days${i}`] ? 'bad' : ''} value={p.days} onChange={e => { setPlan(i, { days: e.target.value }); clear(`days${i}`); }} />
                      {errors[`days${i}`] ? <span className="f-err" role="alert">{errors[`days${i}`]}</span> : null}
                    </label>
                  ) : null}
                </div>
                <label className="fld narrow" htmlFor={`price${i}`}>Price
                  <span className="pfx"><span aria-hidden="true">₹</span>
                    <input id={`price${i}`} type="number" min="1" inputMode="decimal" className={errors[`price${i}`] ? 'bad' : ''} value={p.price} placeholder="0" onChange={e => { setPlan(i, { price: e.target.value }); clear(`price${i}`); }} aria-invalid={Boolean(errors[`price${i}`])} />
                  </span>
                  {errors[`price${i}`] ? <span className="f-err" role="alert">{errors[`price${i}`]}</span> : null}
                </label>
              </div>
            ))}
            {errors.plans ? <span className="f-err" role="alert">{errors.plans}</span> : null}
            <button type="button" className="btn sm" onClick={() => set({ plans: [...d.plans, { price: '', days: '365' }] })}>+ Add another plan</button>
          </section>

          <section className="card sec">
            <h2><span className="n">3</span>Availability</h2>
            <p className="hint">Decide whether students can buy it now.</p>
            <div className="tog">
              <div><strong>Visible to students</strong><small className="muted">Turn this off to keep it as a draft.</small></div>
              <button type="button" className="sw" role="switch" aria-checked={d.active} aria-label="Visible to students" onClick={() => set({ active: !d.active })}><i /><span>{d.active ? 'On' : 'Off'}</span></button>
            </div>
          </section>
        </div>

        <aside className="prev" aria-label="Preview">
          <div className="lab">What students will see</div>
          <div className="cardp">
            <h3>{d.name.trim() || <span className="ph-text">Package name</span>}</h3>
            <span className="chip">{ageOk ? `${d.ageFrom}–${d.ageTo} years` : 'Age group'}</span>
            {d.description.trim() ? <p className="muted pv-desc">{d.description.trim()}</p> : null}
            {d.plans.map((p, i) => <div key={i} className="pl"><span>{Number(p.days) >= 1 ? durationLabel(Number(p.days)) : '—'}</span><b>{Number(p.price) >= 1 ? inr(Number(p.price)) : '—'}</b></div>)}
            <div className="pv-status">{d.active ? <span className="chip good">● Visible to students</span> : <span className="chip">Draft · hidden</span>}</div>
          </div>
          <ul className="check" aria-label="Checklist">
            {[[nameOk, 'Name (3+ letters)'], [ageOk, 'Age group'], [plansOk, 'At least one priced plan']].map(([ok, label]) => (
              <li key={String(label)} className={ok ? 'ok' : ''}><span aria-hidden="true">{ok ? '✓' : '○'}</span>{label as string}</li>
            ))}
          </ul>
        </aside>
      </div>

      <div className="formbar">
        <Link className="btn" href="/packages">Cancel</Link>
        <button type="submit" className="btn primary" disabled={busy}>{busy ? 'Saving…' : initial ? 'Save changes' : 'Create package'}</button>
      </div>
    </form>
  );
}
