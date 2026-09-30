'use client';

import Link from 'next/link';
import { FormEvent, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ImagePicker } from '@/components/forms';
import { api } from '@/lib/api';
import { kindLabel } from '@/lib/kind';
import { useOptions, withCurrent } from '@/lib/useOptions';
import { hasErrors, minLength, positiveNumber, required } from '@/lib/validate';
import type { CategoryRow, SubCategoryRow } from '@/lib/types';

type Entity = CategoryRow | SubCategoryRow;

const CFG = {
  category: { noun: 'category', Noun: 'Category', base: '/categories', endpoint: 'category', nameField: 'categoryName', parentField: 'packageId', parentLabel: 'Package', parentNoun: 'package' },
  subcategory: { noun: 'sub category', Noun: 'Sub category', base: '/sub-categories', endpoint: 'subcategory', nameField: 'subCategoryName', parentField: 'categoryId', parentLabel: 'Category', parentNoun: 'category' },
} as const;

const nameOf = (e: Entity | undefined): string => (e ? ('categoryName' in e ? e.categoryName : e.subCategoryName) : '');
const parentOf = (e: Entity | undefined): { value: string; label: string } | null => {
  if (!e) return null;
  return 'packageId' in e ? { value: e.packageId._id, label: e.packageId.packageName } : { value: e.categoryId._id, label: e.categoryId.categoryName };
};

/** One simple form for both categories and sub categories: name, who it is for, where it sits, then image and visibility. */
export default function CatalogueForm({ kind, initial, assetBase }: { kind: keyof typeof CFG; initial?: Entity; assetBase: string }) {
  const c = CFG[kind];
  const router = useRouter();
  const [name, setName] = useState(nameOf(initial));
  const [type, setType] = useState<string>(initial?.type ?? '');
  const [parent, setParent] = useState(parentOf(initial)?.value ?? '');
  const [sorting, setSorting] = useState(initial ? String(initial.sorting) : '1');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [active, setActive] = useState(initial?.isActive ?? true);
  const [image, setImage] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState('');
  const [busy, setBusy] = useState(false);

  // A category belongs to a package. A sub category belongs to a category of the same type, so it loads after a type is chosen.
  const path = kind === 'category' ? 'package/allAdmin?isActive=true' : type ? `category/all?type=${type}&isActive=true` : null;
  const parents = useOptions<{ _id: string } & Record<string, string>>(path, r => (kind === 'category' ? r.packageName : r.categoryName));
  const current = parentOf(initial);
  const options = useMemo(
    () => withCurrent(parents.options, current && (kind === 'category' || initial?.type === type) ? current : null),
    [parents.options, current, kind, initial?.type, type],
  );
  const parentLabel = options.find(o => o.value === parent)?.label;

  function pickType(v: string) {
    setType(v);
    if (kind === 'subcategory') setParent('');
    setErrors(e => ({ ...e, type: '' }));
  }

  async function onSubmit(ev: FormEvent) {
    ev.preventDefault();
    const found = {
      name: minLength(name, 3, `${c.noun} name`),
      type: required(type, 'a type'),
      parent: required(parent, `a ${c.parentNoun}`),
      sorting: positiveNumber(sorting, 'a show order'),
    };
    setErrors(found);
    setSubmitError('');
    if (hasErrors(found)) {
      const first = (['name', 'type', 'parent', 'sorting'] as const).find(k => found[k]);
      setTimeout(() => (first ? document.getElementById(first)?.focus() : undefined), 0);
      return;
    }
    const fd = new FormData();
    fd.append(c.nameField, name.trim());
    fd.append('sorting', sorting);
    fd.append(c.parentField, parent);
    fd.append('type', type);
    fd.append('description', description.trim());
    fd.append('isActive', String(active));
    if (image) fd.append('image', image);

    setBusy(true);
    const r = await api(initial ? `${c.endpoint}/${initial._id}` : c.endpoint, { method: initial ? 'PUT' : 'POST', body: fd }, `The ${c.noun} could not be saved. Check the details and try again.`);
    if (r.ok) { router.push(`${c.base}?notice=${initial ? 'saved' : 'created'}`); router.refresh(); return; }
    setSubmitError(r.message);
    setBusy(false);
  }

  const existing = initial?.imageUrl ? assetBase + initial.imageUrl : undefined;

  return (
    <form onSubmit={onSubmit} noValidate>
      {submitError ? <div className="banner bad" role="alert">{submitError}</div> : null}
      <div className="pk-layout">
        <div>
          <section className="card sec">
            <h2><span className="n">1</span>Basics</h2>
            <p className="hint">Name it, say who it is for and where it belongs.</p>
            <label className="fld" htmlFor="name">{c.Noun} name
              <input id="name" className={errors.name ? 'bad' : ''} value={name} onChange={e => { setName(e.target.value); setErrors(x => ({ ...x, name: '' })); }} autoComplete="off" autoFocus={!initial} aria-invalid={Boolean(errors.name)}
                     placeholder={kind === 'category' ? 'e.g. Story time' : 'e.g. Animal stories'} />
              {errors.name ? <span className="f-err" role="alert">{errors.name}</span> : <span className="help">Students see this name.</span>}
            </label>

            <div className="fld" role="group" aria-labelledby="type-l">
              <span id="type-l" className="lbl">Who is it for?</span>
              <div className="chips" id="type" tabIndex={-1}>
                {([['kid', 'Kid'], ['parent', 'Parent']] as const).map(([v, l]) => <button key={v} type="button" className="pick" aria-pressed={type === v} onClick={() => pickType(v)}>{l}</button>)}
              </div>
              {errors.type ? <span className="f-err" role="alert">{errors.type}</span> : null}
            </div>

            <label className="fld" htmlFor="parent">{c.parentLabel}
              <select id="parent" className={errors.parent ? 'bad' : ''} value={parent} onChange={e => { setParent(e.target.value); setErrors(x => ({ ...x, parent: '' })); }} disabled={parents.loading || (kind === 'subcategory' && !type)} aria-invalid={Boolean(errors.parent)}>
                <option value="">{kind === 'subcategory' && !type ? 'Choose who it is for first' : parents.loading ? 'Loading…' : `Choose a ${c.parentNoun}`}</option>
                {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              {errors.parent ? <span className="f-err" role="alert">{errors.parent}</span> : parents.error ? <span className="f-err" role="alert">The list could not be loaded. Reload the page to try again.</span> : null}
            </label>

            <label className="fld" htmlFor="description">Description <span className="help inline">(optional)</span>
              <textarea id="description" rows={3} value={description} onChange={e => setDescription(e.target.value)} placeholder="One sentence about what is inside" />
            </label>
          </section>

          <section className="card sec">
            <h2><span className="n">2</span>Picture and visibility</h2>
            <p className="hint">The picture is optional. Hidden items stay saved but students cannot see them.</p>
            <ImagePicker file={image} onFile={setImage} existingUrl={existing} />
            <label className="fld narrow" htmlFor="sorting">Show order
              <input id="sorting" type="number" min="1" inputMode="numeric" className={errors.sorting ? 'bad' : ''} value={sorting} onChange={e => { setSorting(e.target.value); setErrors(x => ({ ...x, sorting: '' })); }} aria-invalid={Boolean(errors.sorting)} />
              {errors.sorting ? <span className="f-err" role="alert">{errors.sorting}</span> : <span className="help">Lower numbers show first.</span>}
            </label>
            <div className="tog">
              <div><strong>Visible to students</strong><small className="muted">Turn this off to keep it as a draft.</small></div>
              <button type="button" className="sw" role="switch" aria-checked={active} aria-label="Visible to students" onClick={() => setActive(!active)}><i /><span>{active ? 'On' : 'Off'}</span></button>
            </div>
          </section>
        </div>

        <aside className="prev" aria-label="Preview">
          <div className="lab">Preview</div>
          <div className="cardp">
            <h3>{name.trim() || <span className="ph-text">{c.Noun} name</span>}</h3>
            <span className="chip">{type ? kindLabel(type) : 'Kid or parent'}</span>
            <p className="muted pv-desc">{parentLabel ? `${c.parentLabel}: ${parentLabel}` : `${c.parentLabel} not chosen yet`}</p>
            {description.trim() ? <p className="muted pv-desc">{description.trim()}</p> : null}
            <div className="pv-status">{active ? <span className="chip good">● Visible to students</span> : <span className="chip">Draft · hidden</span>}</div>
          </div>
          <ul className="check" aria-label="Checklist">
            {[[name.trim().length >= 3, 'Name (3+ letters)'], [Boolean(type), 'Kid or parent'], [Boolean(parent), `A ${c.parentNoun}`]].map(([ok, label]) => (
              <li key={String(label)} className={ok ? 'ok' : ''}><span aria-hidden="true">{ok ? '✓' : '○'}</span>{label as string}</li>
            ))}
          </ul>
        </aside>
      </div>

      <div className="formbar">
        <Link className="btn" href={c.base}>Cancel</Link>
        <button type="submit" className="btn primary" disabled={busy}>{busy ? 'Saving…' : initial ? 'Save changes' : `Create ${c.noun}`}</button>
      </div>
    </form>
  );
}
