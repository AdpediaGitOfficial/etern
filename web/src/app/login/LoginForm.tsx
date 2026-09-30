'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [show, setShow] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const form = new FormData(e.currentTarget);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.get('email'), password: form.get('password') }),
      });
      if (res.ok) {
        // The dashboard is dynamic, so navigating fetches fresh data. No extra router.refresh() here:
        // an overlapping refresh can leave the dashboard's Refresh button stuck on "Refreshing…".
        router.replace('/dashboard');
        return;
      }
      const data = await res.json().catch(() => ({}));
      setError(data.message || 'Sign-in failed. Try again.');
    } catch {
      setError('Could not reach the server. Check your connection.');
    }
    setBusy(false);
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <label htmlFor="email">Email</label>
      <input id="email" name="email" type="email" autoComplete="username" required autoFocus />
      <label htmlFor="password">Password</label>
      <div className="pw">
        <input id="password" name="password" type={show ? 'text' : 'password'} autoComplete="current-password" required />
        <button type="button" className="link" onClick={() => setShow(s => !s)} aria-pressed={show}>
          {show ? 'Hide' : 'Show'}
        </button>
      </div>
      {error ? <p className="error" role="alert">{error}</p> : null}
      <button type="submit" className="btn primary block" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
    </form>
  );
}
