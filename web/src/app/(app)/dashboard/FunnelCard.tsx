'use client';

import Link from 'next/link';
import type { Result } from '@/lib/backend';
import Icon from '@/components/icons';
import { PanelError } from '@/components/ui';
import { monthRange, usersLink } from '@/lib/dates';
import { num } from '@/lib/format';
import type { Stats } from '@/lib/types';

export default function FunnelCard({ stats, retry, busy }: { stats: Result<Stats>; retry: () => void; busy: boolean }) {
  const s = stats.ok ? stats.data : null;
  const { from, to } = monthRange();
  const pct = (v: number) => (s && s.registeredThisMonth > 0 ? Math.min(100, (v / s.registeredThisMonth) * 100) : 0);
  const rows = s ? [
    { l: 'Registered', v: s.registeredThisMonth, p: s.registeredThisMonth ? 100 : 0, cls: 'blue', href: usersLink({ from, to }) },
    { l: 'Subscribed', v: s.subscribedThisMonth, p: pct(s.subscribedThisMonth), cls: '', href: usersLink({ from, to, subscription: 'true' }) },
    { l: 'Not subscribed', v: s.freeUsersThisMonth, p: pct(s.freeUsersThisMonth), cls: 'amber', href: usersLink({ from, to, subscription: 'false' }) },
  ] : [];
  return (
    <div className="card">
      <h2>New students this month</h2>
      <p className="muted">Select a row to open those students</p>
      {!s ? <PanelError onRetry={retry} busy={busy} /> : (
        <div className="fn">
          {rows.map(r => (
            <Link key={r.l} href={r.href} className="fn-row" aria-label={`${r.l}: ${num(r.v)} students. Open list`}>
              <div className="fn-top"><span>{r.l}<Icon name="arrowRight" size={14} className="fn-go" /></span><strong>{num(r.v)}</strong></div>
              <div className="bar"><i className={r.cls} style={{ width: `${r.p}%` }} /></div>
              <small className="muted">{r.p.toLocaleString('en-IN', { maximumFractionDigits: 1 })}% of registered</small>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
