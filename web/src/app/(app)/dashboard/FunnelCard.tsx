'use client';

import type { Result } from '@/lib/backend';
import { PanelError } from '@/components/ui';
import { num } from '@/lib/format';
import type { Stats } from '@/lib/types';

export default function FunnelCard({ stats, retry, busy }: { stats: Result<Stats>; retry: () => void; busy: boolean }) {
  const s = stats.ok ? stats.data : null;
  const pct = (v: number) => (s && s.registeredThisMonth > 0 ? Math.min(100, (v / s.registeredThisMonth) * 100) : 0);
  const rows = s ? [
    { l: 'Registered', v: s.registeredThisMonth, p: s.registeredThisMonth ? 100 : 0 },
    { l: 'Subscribed', v: s.subscribedThisMonth, p: pct(s.subscribedThisMonth) },
    { l: 'Not subscribed', v: s.freeUsersThisMonth, p: pct(s.freeUsersThisMonth) },
  ] : [];
  return (
    <div className="card">
      <h2>New students this month</h2>
      <p className="muted">Share of students registered this month</p>
      {!s ? <PanelError onRetry={retry} busy={busy} /> : (
        <div className="fn">
          {rows.map(r => (
            <div key={r.l} className="fn-row">
              <div className="fn-top"><span>{r.l}</span><strong>{num(r.v)}</strong></div>
              <div className="bar"><i style={{ width: `${r.p}%` }} /></div>
              <small className="muted">{r.p.toLocaleString('en-IN', { maximumFractionDigits: 1 })}% of registered</small>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
