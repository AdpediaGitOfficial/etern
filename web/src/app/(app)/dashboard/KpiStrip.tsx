'use client';

import type { Result } from '@/lib/backend';
import { PanelError } from '@/components/ui';
import { inr, num } from '@/lib/format';
import type { Revenue, Stats, SubscriptionPoint } from '@/lib/types';
import Sparkline from './Sparkline';
export default function KpiStrip({ stats, revenue, chart, retry, busy }: { stats: Result<Stats>; revenue: Result<Revenue>; chart: Result<SubscriptionPoint[]>; retry: () => void; busy: boolean }) {
  const daily = chart.ok ? (chart.data ?? []).map(p => Number(p.total_subscriptions) || 0) : [];
  const s = stats.ok ? stats.data : null;
  const conv = s && s.registeredThisMonth > 0 ? (s.subscribedThisMonth / s.registeredThisMonth) * 100 : null;
  const g = revenue.ok ? revenue.data.growthPercentage : null;

  const StatCard = ({ label, value, foot, spark }: { label: string; value: string; foot: string; spark?: React.ReactNode }) => (
    <div className="card kpi">
      <div className="kpi-l">{label}</div>
      {s ? (<><div className="kpi-v">{value}</div><div className="kpi-f"><span className="muted">{foot}</span>{spark}</div></>) : <PanelError onRetry={retry} busy={busy} />}
    </div>
  );

  return (
    <div className="kpis">
      <div className="card kpi">
        <div className="kpi-l">Revenue this month</div>
        {revenue.ok ? (
          <>
            <div className="kpi-v">{inr(revenue.data.currentMonthRevenue)}</div>
            <div className="kpi-f">
              {g === null ? (
                <span className="delta flat">— no comparison</span>
              ) : (
                <span className={'delta ' + (g >= 0 ? 'up' : 'dn')}>{g >= 0 ? '▲' : '▼'} {Math.abs(g).toLocaleString('en-IN', { maximumFractionDigits: 1 })}%</span>
              )}
              <span className="muted">vs last month</span>
            </div>
          </>
        ) : <PanelError onRetry={retry} busy={busy} />}
      </div>
      <StatCard label="Registered students" value={num(s?.totalUsers)} foot={`${num(s?.registeredThisMonth)} joined this month`} />
      <StatCard label="Subscribed students" value={num(s?.totalStudents)} foot={`${num(s?.subscribedThisMonth)} subscribed this month`}
        spark={<Sparkline values={daily} label={`New subscriptions per day, last ${daily.length} days`} />} />
      <StatCard label="Conversion this month" value={conv === null ? '—' : conv.toLocaleString('en-IN', { maximumFractionDigits: 1 }) + '%'} foot={`${num(s?.subscribedThisMonth)} of ${num(s?.registeredThisMonth)} new students`} />
    </div>
  );
}
