'use client';

import { FormEvent, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Field, FormFrame, ImagePicker, KIND_OPTIONS, Select, STATUS_OPTIONS, TextInput } from '@/components/forms';
import { api } from '@/lib/api';
import { useOptions, withCurrent } from '@/lib/useOptions';
import { hasErrors, httpUrl, minLength, positiveNumber, required } from '@/lib/validate';
import type { CourseMaterialRow } from '@/lib/types';

export default function CourseMaterialForm({ initial, assetBase }: { initial?: CourseMaterialRow; assetBase: string }) {
  const router = useRouter();
  const initialCategory = initial?.subCategoryId?.categoryId;
  const [name, setName] = useState(initial?.courseMaterialName ?? '');
  const [url, setUrl] = useState(initial?.courseMaterialUrl ?? '');
  const [sorting, setSorting] = useState(initial ? String(initial.sorting) : '');
  const [type, setType] = useState<string>(initial?.type ?? '');
  const [categoryId, setCategoryId] = useState(initialCategory?._id ?? '');
  const [subCategoryId, setSubCategoryId] = useState(initial?.subCategoryId?._id ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [active, setActive] = useState(String(initial?.isActive ?? true));
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

  const changeType = (v: string) => { setType(v); setCategoryId(''); setSubCategoryId(''); };
  const changeCategory = (v: string) => { setCategoryId(v); setSubCategoryId(''); };

  async function onSubmit(ev: FormEvent) {
    ev.preventDefault();
    const e = {
      name: minLength(name, 3, 'course material name'),
      url: httpUrl(url, 'the course material link'),
      sorting: positiveNumber(sorting, 'a sort order'),
      type: required(type, 'a type'),
      categoryId: required(categoryId, 'a category'),
      subCategoryId: required(subCategoryId, 'a sub category'),
    };
    setErrors(e);
    setSubmitError('');
    if (hasErrors(e)) return;

    const fd = new FormData();
    fd.append('courseMaterialName', name.trim());
    fd.append('courseMaterialUrl', url.trim());
    fd.append('sorting', sorting);
    fd.append('categoryId', categoryId);
    fd.append('subCategoryId', subCategoryId);
    fd.append('type', type);
    fd.append('description', description.trim());
    fd.append('isActive', active);
    if (image) fd.append('image', image);

    setBusy(true);
    const r = await api(initial ? `coursematerial/${initial._id}` : 'coursematerial', { method: initial ? 'PUT' : 'POST', body: fd }, 'The course material could not be saved. Check the details and try again.');
    if (r.ok) { router.push('/course-materials'); router.refresh(); return; }
    setSubmitError(r.message);
    setBusy(false);
  }

  return (
    <FormFrame onSubmit={onSubmit} error={submitError} busy={busy} cancelHref="/course-materials" saveLabel={initial ? 'Save changes' : 'Create course material'}>
      <div className="f-grid">
        <Field label="Course material name" error={errors.name}><TextInput value={name} onChange={setName} error={errors.name} autoFocus /></Field>
        <Field label="Link (https://…)" error={errors.url}><TextInput type="url" inputMode="url" value={url} onChange={setUrl} error={errors.url} /></Field>
        <Field label="Sort order" error={errors.sorting}><TextInput type="number" min="1" value={sorting} onChange={setSorting} error={errors.sorting} /></Field>
        <Field label="Type" error={errors.type}><Select value={type} onChange={changeType} options={KIND_OPTIONS} placeholder="Choose a type" error={errors.type} /></Field>
        <Field label="Category" error={errors.categoryId || (categories.error ? 'Categories could not be loaded.' : '')}>
          <Select value={categoryId} onChange={changeCategory} options={categoryOptions} disabled={!type || categories.loading}
                  placeholder={!type ? 'Choose a type first' : categories.loading ? 'Loading…' : 'Choose a category'} error={errors.categoryId} />
        </Field>
        <Field label="Sub category" error={errors.subCategoryId || (subCategories.error ? 'Sub categories could not be loaded.' : '')}>
          <Select value={subCategoryId} onChange={setSubCategoryId} options={subOptions} disabled={!categoryId || subCategories.loading}
                  placeholder={!categoryId ? 'Choose a category first' : subCategories.loading ? 'Loading…' : 'Choose a sub category'} error={errors.subCategoryId} />
        </Field>
        <Field label="Status"><Select value={active} onChange={setActive} options={STATUS_OPTIONS} /></Field>
        <ImagePicker file={image} onFile={setImage} existingUrl={initial?.imageUrl ? assetBase + initial.imageUrl : undefined} />
        <Field label="Description (optional)" wide><textarea rows={3} value={description} onChange={e => setDescription(e.target.value)} /></Field>
      </div>
    </FormFrame>
  );
}
