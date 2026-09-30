'use client';

import { FormEvent, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Field, FormFrame, ImagePicker, KIND_OPTIONS, Select, STATUS_OPTIONS, TextInput } from '@/components/forms';
import { api } from '@/lib/api';
import { useOptions, withCurrent } from '@/lib/useOptions';
import { hasErrors, minLength, positiveNumber, required } from '@/lib/validate';
import type { SubCategoryRow } from '@/lib/types';

export default function SubCategoryForm({ initial, assetBase }: { initial?: SubCategoryRow; assetBase: string }) {
  const router = useRouter();
  const [name, setName] = useState(initial?.subCategoryName ?? '');
  const [sorting, setSorting] = useState(initial ? String(initial.sorting) : '');
  const [type, setType] = useState<string>(initial?.type ?? '');
  const [categoryId, setCategoryId] = useState(initial?.categoryId?._id ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [active, setActive] = useState(String(initial?.isActive ?? true));
  const [image, setImage] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState('');
  const [busy, setBusy] = useState(false);

  // Categories depend on the chosen type, so they load only once a type is picked.
  const categories = useOptions<{ _id: string; categoryName: string }>(type ? `category/all?type=${type}&isActive=true` : null, c => c.categoryName);
  const categoryOptions = useMemo(
    () => withCurrent(categories.options, initial && initial.type === type ? { value: initial.categoryId._id, label: initial.categoryId.categoryName } : null),
    [categories.options, initial, type],
  );

  function changeType(v: string) {
    setType(v);
    setCategoryId('');
  }

  async function onSubmit(ev: FormEvent) {
    ev.preventDefault();
    const e = {
      name: minLength(name, 3, 'sub category name'),
      sorting: positiveNumber(sorting, 'a sort order'),
      type: required(type, 'a type'),
      categoryId: required(categoryId, 'a category'),
    };
    setErrors(e);
    setSubmitError('');
    if (hasErrors(e)) return;

    const fd = new FormData();
    fd.append('subCategoryName', name.trim());
    fd.append('sorting', sorting);
    fd.append('categoryId', categoryId);
    fd.append('type', type);
    fd.append('description', description.trim());
    fd.append('isActive', active);
    if (image) fd.append('image', image);

    setBusy(true);
    const r = await api(initial ? `subcategory/${initial._id}` : 'subcategory', { method: initial ? 'PUT' : 'POST', body: fd }, 'The sub category could not be saved. Check the details and try again.');
    if (r.ok) { router.push('/sub-categories'); router.refresh(); return; }
    setSubmitError(r.message);
    setBusy(false);
  }

  return (
    <FormFrame onSubmit={onSubmit} error={submitError} busy={busy} cancelHref="/sub-categories" saveLabel={initial ? 'Save changes' : 'Create sub category'}>
      <div className="f-grid">
        <Field label="Sub category name" error={errors.name}><TextInput value={name} onChange={setName} error={errors.name} autoFocus /></Field>
        <Field label="Sort order" error={errors.sorting}><TextInput type="number" min="1" value={sorting} onChange={setSorting} error={errors.sorting} /></Field>
        <Field label="Type" error={errors.type}><Select value={type} onChange={changeType} options={KIND_OPTIONS} placeholder="Choose a type" error={errors.type} /></Field>
        <Field label="Category" error={errors.categoryId || (categories.error ? 'Categories could not be loaded.' : '')}>
          <Select value={categoryId} onChange={setCategoryId} options={categoryOptions} disabled={!type || categories.loading}
                  placeholder={!type ? 'Choose a type first' : categories.loading ? 'Loading…' : 'Choose a category'} error={errors.categoryId} />
        </Field>
        <Field label="Status"><Select value={active} onChange={setActive} options={STATUS_OPTIONS} /></Field>
        <ImagePicker file={image} onFile={setImage} existingUrl={initial?.imageUrl ? assetBase + initial.imageUrl : undefined} />
        <Field label="Description (optional)" wide><textarea rows={3} value={description} onChange={e => setDescription(e.target.value)} /></Field>
      </div>
    </FormFrame>
  );
}
