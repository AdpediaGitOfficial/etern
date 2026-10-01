'use client';

import { useState } from 'react';
import { Field, TextInput } from '@/components/forms';
import { Notice } from '@/components/ui';

/** The server's rules, checked here so a mistake is named before the round trip. */
const RULES: { test: (v: string) => boolean; message: string }[] = [
  { test: v => v.length >= 8, message: 'at least 8 characters' },
  { test: v => /[A-Z]/.test(v), message: 'an uppercase letter' },
  { test: v => /[a-z]/.test(v), message: 'a lowercase letter' },
  { test: v => /\d/.test(v), message: 'a number' },
  { test: v => /[@$!%*?&]/.test(v), message: 'a special character (@ $ ! % * ? &)' },
];

const EMPTY = { currentPassword: '', newPassword: '', confirmPassword: '' };
type Form = typeof EMPTY;

export default function ChangePassword() {
  const [form, setForm] = useState<Form>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof Form, string>>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState('');

  const set = (k: keyof Form) => (v: string) => {
    setForm(f => ({ ...f, [k]: v }));
    setErrors(e => ({ ...e, [k]: undefined }));
  };

  function validate(): boolean {
    const next: Partial<Record<keyof Form, string>> = {};
    if (!form.currentPassword) next.currentPassword = 'Enter your current password.';
    const missing = RULES.filter(r => !r.test(form.newPassword));
    if (missing.length) next.newPassword = `The new password needs ${missing.map(m => m.message).join(', ')}.`;
    else if (form.newPassword === form.currentPassword) next.newPassword = 'Choose a password different from your current one.';
    if (form.confirmPassword !== form.newPassword) next.confirmPassword = 'The two new passwords do not match.';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setDone('');
    if (!validate()) return;
    setBusy(true);
    let res: Response;
    try {
      res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: form.currentPassword, newPassword: form.newPassword }),
      });
    } catch {
      setBusy(false);
      setError('The server is unreachable. Try again.');
      return;
    }
    const body = (await res.json().catch(() => ({}))) as { message?: string };
    setBusy(false);
    if (res.status === 401) { window.location.assign('/api/auth/logout'); return; }
    if (!res.ok) { setError(body?.message ?? 'Could not change the password.'); return; }
    // The session cookie now holds a fresh token, so this browser stays signed in.
    setDone(body?.message ?? 'Password changed.');
    setForm(EMPTY);
  }

  return (
    <>
      <h2 style={{ marginTop: 26 }}>Change your password</h2>
      <p className="muted">
        Changing it signs out every other device straight away. This browser stays signed in.
      </p>

      {done ? <Notice tone="good">{done}</Notice> : null}

      <form className="form" onSubmit={submit} noValidate style={{ marginTop: 16 }}>
        {error ? <div className="banner bad" role="alert">{error}</div> : null}
        <div className="f-grid">
          <Field label="Current password" error={errors.currentPassword} wide>
            <TextInput type="password" value={form.currentPassword} onChange={set('currentPassword')}
                       error={errors.currentPassword} autoComplete="current-password" />
          </Field>
          <Field label="New password" error={errors.newPassword}>
            <TextInput type="password" value={form.newPassword} onChange={set('newPassword')}
                       error={errors.newPassword} autoComplete="new-password" />
          </Field>
          <Field label="Confirm new password" error={errors.confirmPassword}>
            <TextInput type="password" value={form.confirmPassword} onChange={set('confirmPassword')}
                       error={errors.confirmPassword} autoComplete="new-password" />
          </Field>
        </div>
        <span className="help">
          At least 8 characters, with an uppercase letter, a lowercase letter, a number and one of @ $ ! % * ? &amp;.
        </span>
        <div className="acts">
          <button type="submit" className="btn primary" disabled={busy}>{busy ? 'Changing…' : 'Change password'}</button>
        </div>
      </form>
    </>
  );
}
