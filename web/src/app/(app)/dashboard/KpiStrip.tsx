'use client';

import type { ReactNode } from 'react';
import type { Result } from '@/lib/backend';
import Icon, { type IconName } from '@/components/icons';
import { PanelError } from '@/components/ui';
import { inr, num } from '@/lib/format';
import type { Revenue, Stats, SubscriptionPoint } from '@/lib/types';
import type { Metric } from './MetricDrawer';
import Delta from './Delta';
import Sparkline from './Sparkline';

interface Props {
  stats: Result<Stats>;
  revenue: Result<Revenue>;
  chart: Result<SubscriptionPoint[]>;
  /** "this month", "in the last 7 days" ... */
  phrase: string;
  label: string;
  /** The same figures for the previous period, when Compare is on. */
  previous: { stats: Result<Stats>; revenue: Result<Revenue> } | null;
  onOpen: (metric: Metric) => void;
  retry: () => void;
  busy: boolean;
}

interface CardProps { metric: Metric; label: string; icon: IconName; tone: 'teal' | 'blue' | 'violet' | 'amber'; ok: boolean; value: string; foot: ReactNode; onOpen: (m: Metric) => void; retry: () => void; busy: boolean }

/** One KPI. When its data loaded, the whole card is a button that opens the details panel. */
function Kpi({ metric, label, icon, tone, ok, value, foot, onOpen, retry, busy }: CardProps) {
  const head = (
    <div className="kpi-top">
      <span className={`kpi-ic ${tone}`}><Icon name={icon} /></span>
      <span className="kpi-l">{label}</span>
      {ok ? <Icon name="arrowRight" size={16} className="kpi-go" /> : null}
    </div>
  );
  if (!ok) return <div className="card kpi" style={{ cursor: 'default' }}>{head}<PanelError onRetry={retry} busy={busy} /></div>;
  return (
    <button type="button" className="card kpi" onClick={() => onOpen(metric)} aria-label={`${label}: ${value}. Open details`}>
      {head}
      <div className="kpi-v">{value}</div>
      <div className="kpi-f">{foot}</div>
    </button>
  );
}

export default function KpiStrip({ stats, revenue, chart, phrase, label: periodLabel, previous, onOpen, retry, busy }: Props) {
  const s = stats.ok ? stats.data : null;
  const daily = chart.ok ? (chart.data ?? []).map(p => Number(p.total_subscriptions) || 0) : [];
  const conv = s && s.registeredThisMonth > 0 ? (s.subscribedThisMonth / s.registeredThisMonth) * 100 : null;
  const g = revenue.ok ? revenue.data.growthPercentage : null;
  const common = { onOpen, retry, busy };
  const ps = previous?.stats.ok ? previous.stats.data : null;
  const prevRate = ps && ps.registeredThisMonth > 0 ? (ps.subscribedThisMonth / ps.registeredThisMonth) * 100 : null;

  return (
    <div className="kpis">
      <Kpi {...common} metric="revenue" label={`Revenue · ${periodLabel}`} icon="rupee" tone="teal" ok={revenue.ok} value={revenue.ok ? inr(revenue.data.currentMonthRevenue) : ''}
           foot={g === null ? <><span className="delta flat">No comparison</span><span className="muted">the previous period had no revenue</span></> : (
             <><span className={'delta ' + (g >= 0 ? 'up' : 'dn')}><Icon name={g >= 0 ? 'trendUp' : 'trendDown'} size={13} />{Math.abs(g).toLocaleString('en-IN', { maximumFractionDigits: 1 })}%</span><span className="muted">vs previous period</span></>
           )} />
      <Kpi {...common} metric="registered" label="Registered students" icon="users" tone="blue" ok={stats.ok} value={num(s?.totalUsers)}
           foot={<><span className="muted">{num(s?.registeredThisMonth)} joined {phrase}</span>{previous ? <Delta cur={s?.registeredThisMonth ?? 0} prev={ps?.registeredThisMonth} /> : null}</>} />
      <Kpi {...common} metric="subscribed" label="Subscribed students" icon="sparkles" tone="violet" ok={stats.ok} value={num(s?.totalStudents)}
           foot={<><span className="muted">{num(s?.subscribedThisMonth)} bought a plan {phrase}</span>{previous ? <Delta cur={s?.subscribedThisMonth ?? 0} prev={ps?.subscribedThisMonth} /> : null}<Sparkline values={daily} label={`New subscriptions per day, last ${daily.length} days`} /></>} />
      <Kpi {...common} metric="conversion" label={`Conversion · ${periodLabel}`} icon="percent" tone="amber" ok={stats.ok} value={conv === null ? '—' : `${conv.toLocaleString('en-IN', { maximumFractionDigits: 1 })}%`}
           foot={<><span className="muted">{num(s?.subscribedThisMonth)} of {num(s?.registeredThisMonth)} new students</span>{previous && conv !== null && prevRate !== null ? <Delta cur={conv} prev={prevRate} /> : null}</>} />
    </div>
  );
}
