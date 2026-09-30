'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Field, FormFrame, Select, STATUS_OPTIONS, TextInput } from '@/components/forms';
import { api } from '@/lib/api';
import { hasErrors, minLength, positiveNumber, required } from '@/lib/validate';
import type { PackageRow } from '@/lib/types';

interface Cost { price: string; validity: string; from: string; to: string }
const emptyCost = (): Cost => ({ price: '', validity: '', from: '', to: '' });

export default function PackageForm({ initial }: { initial?: PackageRow }) {
  const router = useRouter();
  const [name, setName] = useState(initial?.packageName ?? '');
  const [ageFrom, setAgeFrom] = useState(initial ? String(initial.ageFrom) : '');
  const [ageTo, setAgeTo] = useState(initial ? String(initial.ageTo) : '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [active, setActive] = useState(String(initial?.isActive ?? true));
  const [costs, setCosts] = useState<Cost[]>(
    initial?.packageCosts?.length
      ? initial.packageCosts.map(c => ({ price: String(c.price), validity: String(c.validity), from: c.from.slice(0, 10), to: c.to.slice(0, 10) }))
      : [emptyCost()],
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState('');
  const [busy, setBusy] = useState(false);

  const setCost = (i: number, patch: Partial<Cost>) => setCosts(cs => cs.map((c, j) => (j === i ? { ...c, ...patch } : c)));

  function validate(): Record<string, string> {
    const e: Record<string, string> = {
      name: minLength(name, 3, 'package name'),
      ageFrom: positiveNumber(ageFrom, 'a minimum age'),
      ageTo: positiveNumber(ageTo, 'a maximum age') || (Number(ageTo) < Number(ageFrom) ? 'Maximum age cannot be below minimum age.' : ''),
    };
    costs.forEach((c, i) => {
      e[`price${i}`] = positiveNumber(c.price, 'a price');
      e[`validity${i}`] = positiveNumber(c.validity, 'validity in days');
      e[`from${i}`] = required(c.from, 'a start date');
      e[`to${i}`] = required(c.to, 'an end date') || (c.from && c.to < c.from ? 'End date cannot be before the start date.' : '');
    });
    return e;
  }

  async function onSubmit(ev: FormEvent) {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    setSubmitError('');
    if (hasErrors(e)) return;

    setBusy(true);
    const payload = {
      packageName: name.trim(), ageFrom: Number(ageFrom), ageTo: Number(ageTo), description: description.trim(),
      isActive: active === 'true',
      packageCosts: costs.map(c => ({ price: Number(c.price), validity: Number(c.validity), from: c.from, to: c.to })),
    };
    const r = await api(initial ? `package/${initial._id}` : 'package', {
      method: initial ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }, 'The package could not be saved. Check the details and try again.');
    if (r.ok) { router.push('/packages'); router.refresh(); return; }
    setSubmitError(r.message);
    setBusy(false);
  }

  return (
    <FormFrame onSubmit={onSubmit} error={submitError} busy={busy} cancelHref="/packages" saveLabel={initial ? 'Save changes' : 'Create package'}>
      <div className="f-grid">
        <Field label="Package name" error={errors.name}><TextInput value={name} onChange={setName} error={errors.name} autoFocus /></Field>
        <Field label="Status"><Select value={active} onChange={setActive} options={STATUS_OPTIONS} /></Field>
        <Field label="Age from" error={errors.ageFrom}><TextInput type="number" min="1" value={ageFrom} onChange={setAgeFrom} error={errors.ageFrom} /></Field>
        <Field label="Age to" error={errors.ageTo}><TextInput type="number" min="1" value={ageTo} onChange={setAgeTo} error={errors.ageTo} /></Field>
        <Field label="Description (optional)" wide><textarea rows={3} value={description} onChange={e => setDescription(e.target.value)} /></Field>
      </div>

      <fieldset className="pkgs">
        <legend>Prices</legend>
        {costs.map((c, i) => (
          <div key={i} className="cost-row">
            <Field label="Price (₹)" error={errors[`price${i}`]}><TextInput type="number" min="1" value={c.price} onChange={v => setCost(i, { price: v })} error={errors[`price${i}`]} /></Field>
            <Field label="Validity (days)" error={errors[`validity${i}`]}><TextInput type="number" min="1" value={c.validity} onChange={v => setCost(i, { validity: v })} error={errors[`validity${i}`]} /></Field>
            <Field label="Sold from" error={errors[`from${i}`]}><TextInput type="date" value={c.from} onChange={v => setCost(i, { from: v })} error={errors[`from${i}`]} /></Field>
            <Field label="Sold until" error={errors[`to${i}`]}><TextInput type="date" value={c.to} min={c.from || undefined} onChange={v => setCost(i, { to: v })} error={errors[`to${i}`]} /></Field>
            {costs.length > 1 ? (
              <button type="button" className="btn sm danger-o remove" onClick={() => setCosts(cs => cs.filter((_, j) => j !== i))} aria-label={`Remove price ${i + 1}`}>Remove</button>
            ) : null}
          </div>
        ))}
        <button type="button" className="btn sm" onClick={() => setCosts(cs => [...cs, emptyCost()])}>+ Add another price</button>
      </fieldset>
    </FormFrame>
  );
}
