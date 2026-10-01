'use client';

import { useState } from 'react';
import { Field, TextInput } from '@/components/forms';
import Icon from '@/components/icons';
import { Notice } from '@/components/ui';
import { api } from '@/lib/api';

/**
 * Creates another administrator. The backend has always supported this
 * (POST /api/user/register-admin) but there was no screen for it, so a second
 * admin could only be added straight in the database.
 *
 * The rules below mirror the server's validation exactly, so the common mistakes
 * are caught here with a message next to the field rather than as one error at
 * the top after a round trip.
 */
const RULES: { test: (v: string) => boolean; message: string }[] = [
  { test: v => v.length >= 8, message: 'at least 8 characters' },
  { test: v => /[A-Z]/.test(v), message: 'an uppercase letter' },
  { test: v => /[a-z]/.test(v), message: 'a lowercase letter' },
  { test: v => /\d/.test(v), message: 'a number' },
  { test: v => /[@$!%*?&]/.test(v), message: 'a special character (@ $ ! % * ? &)' },
];

const EMPTY = { fullName: '', email: '', mobileNumber: '', dob: '', password: '' };
type Form = typeof EMPTY;

export default function AddAdmin() {
  const [form, setForm] = useState<Form>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof Form, string>>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState('');

  const set = (k: keyof Form) => (v: string) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: undefined })); };

  function validate(): boolean {
    const next: Partial<Record<keyof Form, string>> = {};
    if (form.fullName.trim().length < 3) next.fullName = 'Enter the full name.';
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email.trim())) next.email = 'Enter a valid email address.';
    if (!/^\d{6,15}$/.test(form.mobileNumber.trim())) next.mobileNumber = 'Enter digits only, 6 to 15 of them.';
    if (!form.dob) next.dob = 'Enter a date of birth.';
    else if (new Date(form.dob) > new Date()) next.dob = 'The date of birth cannot be in the future.';
    const missing = RULES.filter(r => !r.test(form.password));
    if (missing.length) next.password = `The password needs ${missing.map(m => m.message).join(', ')}.`;
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setDone('');
    if (!validate()) return;
    setBusy(true);
    const res = await api('user/register-admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // userType is required by the API and only accepts these three values; an
      // administrator is always an adult, so it is not worth asking.
      body: JSON.stringify({ ...form, mobileNumber: Number(form.mobileNumber), userType: 'adult' }),
    }, 'Could not add the administrator.');
    setBusy(false);
    if (!res.ok) { setError(res.message); return; }
    setDone(`${form.fullName.trim()} can now sign in with ${form.email.trim()}.`);
    setForm(EMPTY);
  }

  return (
    <section className="card">
      <h2>Administrators</h2>
      <p className="muted">
        Anyone added here can sign in to this panel and change students, payments and the catalogue.
        There is no way to remove an administrator from this screen yet.
      </p>

      {done ? <Notice tone="good">{done}</Notice> : null}

      <form className="form" onSubmit={submit} noValidate style={{ marginTop: 16 }}>
        {error ? <div className="banner bad" role="alert">{error}</div> : null}
        <div className="f-grid">
          <Field label="Full name" error={errors.fullName}>
            <TextInput value={form.fullName} onChange={set('fullName')} error={errors.fullName} autoComplete="off" />
          </Field>
          <Field label="Email" error={errors.email}>
            <TextInput type="email" value={form.email} onChange={set('email')} error={errors.email} autoComplete="off" />
          </Field>
          <Field label="Mobile number" error={errors.mobileNumber}>
            <TextInput inputMode="numeric" value={form.mobileNumber} onChange={set('mobileNumber')} error={errors.mobileNumber} autoComplete="off" />
          </Field>
          <Field label="Date of birth" error={errors.dob}>
            <TextInput type="date" value={form.dob} onChange={set('dob')} error={errors.dob} />
          </Field>
          <Field label="Password" error={errors.password} wide>
            <TextInput type="password" value={form.password} onChange={set('password')} error={errors.password} autoComplete="new-password" />
            <span className="help">
              At least 8 characters, with an uppercase letter, a lowercase letter, a number and one of @ $ ! % * ? &amp;.
            </span>
          </Field>
        </div>
        <div className="acts">
          <button type="submit" className="btn primary" disabled={busy}>
            <Icon name="plus" size={16} /> {busy ? 'Adding…' : 'Add administrator'}
          </button>
        </div>
      </form>
    </section>
  );
}
