'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import AddAdmin from './AddAdmin';
import ChangePassword from './ChangePassword';
import ThemePicker from './ThemePicker';
import Icon from '@/components/icons';
import { PageHead } from '@/components/ui';
import type { Account } from '@/lib/account';

const TABS = [
  { id: 'account', label: 'Your account' },
  { id: 'appearance', label: 'Appearance' },
  { id: 'admins', label: 'Administrators' },
] as const;
type Tab = (typeof TABS)[number]['id'];

const isTab = (v: string | null): v is Tab => TABS.some(t => t.id === v);

export default function SettingsView({ account }: { account: Account }) {
  const router = useRouter();
  const params = useSearchParams();

  // The open tab lives in the URL so a reload keeps your place and a section can be linked to.
  const raw = params.get('tab');
  const tab: Tab = isTab(raw) ? raw : 'account';
  const open = (next: Tab) => router.replace(next === 'account' ? '/settings' : `/settings?tab=${next}`, { scroll: false });

  return (
    <div className="dash">
      <PageHead title="Settings" subtitle="Your account, how the panel looks, and who else can sign in." />

      <div className="tabs" role="tablist" aria-label="Settings sections">
        {TABS.map(t => (
          <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} onClick={() => open(t.id)}>{t.label}</button>
        ))}
      </div>

      {tab === 'account' ? (
        <section className="card">
          <h2>Your account</h2>
          <p className="muted">You are signed in as this administrator.</p>
          <dl className="kv">
            <dt>Name</dt><dd>{account.name || '—'}</dd>
            <dt>Email</dt><dd>{account.email || '—'}</dd>
            <dt>Role</dt><dd>Administrator</dd>
          </dl>
          <div className="warn-line settings-note">
            Changing your name or email is still not available — the API only accepts those changes from
            student accounts, not administrators.
          </div>

          <ChangePassword />

          <form action="/api/auth/logout" method="post" className="acts">
            <button type="submit" className="btn"><Icon name="logout" size={16} /> Sign out</button>
          </form>
        </section>
      ) : null}

      {tab === 'appearance' ? <ThemePicker /> : null}
      {tab === 'admins' ? <AddAdmin /> : null}
    </div>
  );
}
