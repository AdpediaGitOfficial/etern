'use client';

import { FormEvent, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Field, FormFrame, ImagePicker, KIND_OPTIONS, Select, STATUS_OPTIONS, TextInput } from '@/components/forms';
import { api } from '@/lib/api';
import { useOptions, withCurrent } from '@/lib/useOptions';
import { hasErrors, minLength, positiveNumber, required } from '@/lib/validate';
import type { CategoryRow } from '@/lib/types';

export default function CategoryForm({ initial, assetBase }: { initial?: CategoryRow; assetBase: string }) {
  const router = useRouter();
  const [name, setName] = useState(initial?.categoryName ?? '');
  const [sorting, setSorting] = useState(initial ? String(initial.sorting) : '');
  const [type, setType] = useState<string>(initial?.type ?? '');
  const [packageId, setPackageId] = useState(initial?.packageId?._id ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [active, setActive] = useState(String(initial?.isActive ?? true));
  const [image, setImage] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState('');
  const [busy, setBusy] = useState(false);

  const packages = useOptions<{ _id: string; packageName: string }>('package/allAdmin?isActive=true', p => p.packageName);
  const packageOptions = useMemo(
    () => withCurrent(packages.options, initial ? { value: initial.packageId._id, label: initial.packageId.packageName } : null),
    [packages.options, initial],
  );

  async function onSubmit(ev: FormEvent) {
    ev.preventDefault();
    const e = {
      name: minLength(name, 3, 'category name'),
      sorting: positiveNumber(sorting, 'a sort order'),
      type: required(type, 'a type'),
      packageId: required(packageId, 'a package'),
    };
    setErrors(e);
    setSubmitError('');
    if (hasErrors(e)) return;

    const fd = new FormData();
    fd.append('categoryName', name.trim());
    fd.append('sorting', sorting);
    fd.append('packageId', packageId);
    fd.append('type', type);
    fd.append('description', description.trim());
    fd.append('isActive', active);
    if (image) fd.append('image', image);

    setBusy(true);
    const r = await api(initial ? `category/${initial._id}` : 'category', { method: initial ? 'PUT' : 'POST', body: fd }, 'The category could not be saved. Check the details and try again.');
    if (r.ok) { router.push('/categories'); router.refresh(); return; }
    setSubmitError(r.message);
    setBusy(false);
  }

  return (
    <FormFrame onSubmit={onSubmit} error={submitError} busy={busy} cancelHref="/categories" saveLabel={initial ? 'Save changes' : 'Create category'}>
      <div className="f-grid">
        <Field label="Category name" error={errors.name}><TextInput value={name} onChange={setName} error={errors.name} autoFocus /></Field>
        <Field label="Sort order" error={errors.sorting}><TextInput type="number" min="1" value={sorting} onChange={setSorting} error={errors.sorting} /></Field>
        <Field label="Type" error={errors.type}><Select value={type} onChange={setType} options={KIND_OPTIONS} placeholder="Choose a type" error={errors.type} /></Field>
        <Field label="Package" error={errors.packageId || (packages.error ? 'Packages could not be loaded.' : '')}>
          <Select value={packageId} onChange={setPackageId} options={packageOptions} placeholder={packages.loading ? 'Loading…' : 'Choose a package'} error={errors.packageId} disabled={packages.loading} />
        </Field>
        <Field label="Status"><Select value={active} onChange={setActive} options={STATUS_OPTIONS} /></Field>
        <ImagePicker file={image} onFile={setImage} existingUrl={initial?.imageUrl ? assetBase + initial.imageUrl : undefined} />
        <Field label="Description (optional)" wide><textarea rows={3} value={description} onChange={e => setDescription(e.target.value)} /></Field>
      </div>
    </FormFrame>
  );
}
