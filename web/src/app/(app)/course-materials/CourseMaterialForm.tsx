'use client';

import Link from 'next/link';
import { FormEvent, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ImagePicker } from '@/components/forms';
import { api } from '@/lib/api';
import { kindLabel } from '@/lib/kind';
import { useOptions, withCurrent } from '@/lib/useOptions';
import { hasErrors, httpUrl, minLength, positiveNumber, required } from '@/lib/validate';
import type { CourseMaterialRow } from '@/lib/types';

/** Add or edit a video: name and link first, then where it sits (type, category, sub category), then picture and visibility. */
export default function CourseMaterialForm({ initial, assetBase }: { initial?: CourseMaterialRow; assetBase: string }) {
  const router = useRouter();
  const initialCategory = initial?.subCategoryId?.categoryId;
  const [name, setName] = useState(initial?.courseMaterialName ?? '');
  const [url, setUrl] = useState(initial?.courseMaterialUrl ?? '');
  const [sorting, setSorting] = useState(initial ? String(initial.sorting) : '1');
  const [type, setType] = useState<string>(initial?.type ?? '');
  const [categoryId, setCategoryId] = useState(initialCategory?._id ?? '');
  const [subCategoryId, setSubCategoryId] = useState(initial?.subCategoryId?._id ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [active, setActive] = useState(initial?.isActive ?? true);
  const [image, setImage] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState('');
  const [busy, setBusy] = useState(false);

  // Type -> category -> sub category: each list loads only once its parent value is chosen.
  const categories = useOptions<{ _id: string; categoryName: string }>(type ? `category/all?type=${type}&isActive=true` : null, c => c.categoryName);
  const subCategories = useOptions<{ _id: string; subCategoryName: string }>(type && categoryId ? `subcategory/by-categoryAdmin/${categoryId}/${type}` : null, s => s.subCategoryName);

  const sameType = initial && initial.type === type;
  const categoryOptions = useMemo(
    () => withCurrent(categories.options, sameType && initialCategory ? { value: initialCategory._id, label: initialCategory.categoryName } : null),
    [categories.options, sameType, initialCategory],
  );
  const subOptions = useMemo(
    () => withCurrent(subCategories.options, sameType && initial && initialCategory?._id === categoryId ? { value: initial.subCategoryId._id, label: initial.subCategoryId.subCategoryName } : null),
    [subCategories.options, sameType, initial, initialCategory, categoryId],
  );

  const clear = (k: string) => setErrors(e => (e[k] ? { ...e, [k]: '' } : e));
  const pickType = (v: string) => { setType(v); setCategoryId(''); setSubCategoryId(''); clear('type'); };
  const pickCategory = (v: string) => { setCategoryId(v); setSubCategoryId(''); clear('categoryId'); };

  async function onSubmit(ev: FormEvent) {
    ev.preventDefault();
    const found = {
      name: minLength(name, 3, 'course material name'),
      url: httpUrl(url, 'the video link'),
      type: required(type, 'a type'),
      categoryId: required(categoryId, 'a category'),
      subCategoryId: required(subCategoryId, 'a sub category'),
      sorting: positiveNumber(sorting, 'a show order'),
    };
    setErrors(found);
    setSubmitError('');
    if (hasErrors(found)) {
      const first = (['name', 'url', 'type', 'categoryId', 'subCategoryId', 'sorting'] as const).find(k => found[k]);
      setTimeout(() => (first ? document.getElementById(first)?.focus() : undefined), 0);
      return;
    }
    const fd = new FormData();
    fd.append('courseMaterialName', name.trim());
    fd.append('courseMaterialUrl', url.trim());
    fd.append('sorting', sorting);
    fd.append('categoryId', categoryId);
    fd.append('subCategoryId', subCategoryId);
    fd.append('type', type);
    fd.append('description', description.trim());
    fd.append('isActive', String(active));
    if (image) fd.append('image', image);

    setBusy(true);
    const r = await api(initial ? `coursematerial/${initial._id}` : 'coursematerial', { method: initial ? 'PUT' : 'POST', body: fd }, 'The course material could not be saved. Check the details and try again.');
    if (r.ok) { router.push(`/course-materials?notice=${initial ? 'saved' : 'created'}`); router.refresh(); return; }
    setSubmitError(r.message);
    setBusy(false);
  }

  const urlOk = !httpUrl(url, 'x');
  const catLabel = categoryOptions.find(o => o.value === categoryId)?.label;
  const subLabel = subOptions.find(o => o.value === subCategoryId)?.label;

  return (
    <form onSubmit={onSubmit} noValidate>
      {submitError ? <div className="banner bad" role="alert">{submitError}</div> : null}
      <div className="pk-layout">
        <div>
          <section className="card sec">
            <h2><span className="n">1</span>The video</h2>
            <p className="hint">Give it a name and paste the link to the video.</p>
            <label className="fld" htmlFor="name">Name
              <input id="name" className={errors.name ? 'bad' : ''} value={name} onChange={e => { setName(e.target.value); clear('name'); }} autoComplete="off" autoFocus={!initial} aria-invalid={Boolean(errors.name)} placeholder="e.g. Good touch and bad touch" />
              {errors.name ? <span className="f-err" role="alert">{errors.name}</span> : <span className="help">Students see this name.</span>}
            </label>
            <label className="fld" htmlFor="url">Video link
              <input id="url" type="url" inputMode="url" className={errors.url ? 'bad' : ''} value={url} onChange={e => { setUrl(e.target.value); clear('url'); }} autoComplete="off" aria-invalid={Boolean(errors.url)} placeholder="https://vimeo.com/…" />
              {errors.url ? <span className="f-err" role="alert">{errors.url}</span> : <span className="help">Must start with https://</span>}
            </label>
            <label className="fld" htmlFor="description">Description <span className="help inline">(optional)</span>
              <textarea id="description" rows={3} value={description} onChange={e => setDescription(e.target.value)} placeholder="One sentence about the video" />
            </label>
          </section>

          <section className="card sec">
            <h2><span className="n">2</span>Where it belongs</h2>
            <p className="hint">Pick who it is for, then the category and sub category it appears under.</p>
            <div className="fld" role="group" aria-labelledby="type-l">
              <span id="type-l" className="lbl">Who is it for?</span>
              <div className="chips" id="type" tabIndex={-1}>
                {([['kid', 'Kid'], ['parent', 'Parent']] as const).map(([v, l]) => <button key={v} type="button" className="pick" aria-pressed={type === v} onClick={() => pickType(v)}>{l}</button>)}
              </div>
              {errors.type ? <span className="f-err" role="alert">{errors.type}</span> : null}
            </div>
            <div className="two">
              <label className="fld" htmlFor="categoryId">Category
                <select id="categoryId" className={errors.categoryId ? 'bad' : ''} value={categoryId} onChange={e => pickCategory(e.target.value)} disabled={!type || categories.loading} aria-invalid={Boolean(errors.categoryId)}>
                  <option value="">{!type ? 'Choose who it is for first' : categories.loading ? 'Loading…' : 'Choose a category'}</option>
                  {categoryOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                {errors.categoryId ? <span className="f-err" role="alert">{errors.categoryId}</span> : categories.error ? <span className="f-err" role="alert">The list could not be loaded. Reload the page to try again.</span> : null}
              </label>
              <label className="fld" htmlFor="subCategoryId">Sub category
                <select id="subCategoryId" className={errors.subCategoryId ? 'bad' : ''} value={subCategoryId} onChange={e => { setSubCategoryId(e.target.value); clear('subCategoryId'); }} disabled={!categoryId || subCategories.loading} aria-invalid={Boolean(errors.subCategoryId)}>
                  <option value="">{!categoryId ? 'Choose a category first' : subCategories.loading ? 'Loading…' : 'Choose a sub category'}</option>
                  {subOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                {errors.subCategoryId ? <span className="f-err" role="alert">{errors.subCategoryId}</span> : subCategories.error ? <span className="f-err" role="alert">The list could not be loaded. Reload the page to try again.</span> : null}
              </label>
            </div>
          </section>

          <section className="card sec">
            <h2><span className="n">3</span>Thumbnail and visibility</h2>
            <p className="hint">The thumbnail shows in lists so you can spot the video at a glance. It is optional.</p>
            <ImagePicker file={image} onFile={setImage} existingUrl={initial?.imageUrl ? assetBase + initial.imageUrl : undefined} />
            <label className="fld narrow" htmlFor="sorting">Show order
              <input id="sorting" type="number" min="1" inputMode="numeric" className={errors.sorting ? 'bad' : ''} value={sorting} onChange={e => { setSorting(e.target.value); clear('sorting'); }} aria-invalid={Boolean(errors.sorting)} />
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
            <h3>{name.trim() || <span className="ph-text">Video name</span>}</h3>
            <span className="chip">{type ? kindLabel(type) : 'Kid or parent'}</span>
            <p className="muted pv-desc">{catLabel && subLabel ? `${catLabel} › ${subLabel}` : 'Category and sub category not chosen yet'}</p>
            <p className="muted pv-desc pv-link">{urlOk ? url.trim().replace(/^https?:\/\//i, '') : 'No link yet'}</p>
            <div className="pv-status">{active ? <span className="chip good">● Visible to students</span> : <span className="chip">Draft · hidden</span>}</div>
          </div>
          <ul className="check" aria-label="Checklist">
            {[[name.trim().length >= 3, 'Name (3+ letters)'], [urlOk, 'A valid https:// link'], [Boolean(type), 'Kid or parent'], [Boolean(subCategoryId), 'Category and sub category']].map(([ok, label]) => (
              <li key={String(label)} className={ok ? 'ok' : ''}><span aria-hidden="true">{ok ? '✓' : '○'}</span>{label as string}</li>
            ))}
          </ul>
        </aside>
      </div>

      <div className="formbar">
        <Link className="btn" href="/course-materials">Cancel</Link>
        <button type="submit" className="btn primary" disabled={busy}>{busy ? 'Saving…' : initial ? 'Save changes' : 'Create course material'}</button>
      </div>
    </form>
  );
}
