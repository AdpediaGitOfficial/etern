'use client';

import Link from 'next/link';
import type { Result } from '@/lib/backend';
import Icon from '@/components/icons';
import { PanelError } from '@/components/ui';
import { conversion } from '@/lib/access';
import { usersLink } from '@/lib/dates';
import { num } from '@/lib/format';
import type { Stats } from '@/lib/types';

export default function FunnelCard({ stats, range, phrase, retry, busy }: { stats: Result<Stats>; range: { from: string; to: string }; phrase: string; retry: () => void; busy: boolean }) {
  const s = stats.ok ? stats.data : null;
  const { from, to } = range;
  const c = conversion(s);
  const pct = (v: number) => (c && c.registered > 0 ? Math.min(100, (v / c.registered) * 100) : 0);
  // All three rows describe the same students, so they add up to the registrations.
  const rows = c ? [
    { l: 'Registered', v: c.registered, p: c.registered ? 100 : 0, cls: 'blue', href: usersLink({ from, to }) },
    { l: 'Have a plan', v: c.withPlan, p: pct(c.withPlan), cls: '', href: usersLink({ from, to, segment: 'active' }) },
    { l: 'Still free', v: c.stillFree, p: pct(c.stillFree), cls: 'amber', href: usersLink({ from, to, segment: 'free' }) },
  ] : [];
  return (
    <div className="card">
      <h2>New students {phrase}</h2>
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
