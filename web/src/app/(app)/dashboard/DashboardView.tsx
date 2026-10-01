'use client';

import { useCallback, useState } from 'react';
import Icon from '@/components/icons';
import { downloadCsv } from '@/lib/csv';
import { PRESETS, presetRange, type Preset } from '@/lib/dates';
import { fmtDate, inr } from '@/lib/format';
import type { DashboardData } from '@/lib/dashboardData';
import AttentionCard from './AttentionCard';
import FunnelCard from './FunnelCard';
import KpiStrip from './KpiStrip';
import MetricDrawer, { type Metric } from './MetricDrawer';
import QuickActions from './QuickActions';
import TrendCard from './TrendCard';
import TrendingCard from './TrendingCard';
import VideosCard from './VideosCard';

interface Props {
  initial: DashboardData;
  assetBase: string;
}

export default function DashboardView({ initial, assetBase }: Props) {
  const [data, setData] = useState<DashboardData>(initial);
  const [busy, setBusy] = useState(false);
  const [metric, setMetric] = useState<Metric | null>(null);
  const [preset, setPreset] = useState<Preset>('month');
  const [compare, setCompare] = useState(false);
  const { stats, revenue, chart, videos, trending, expiring, expired, updatedAt } = data;
  const info = PRESETS.find(p => p.key === preset) ?? PRESETS[0];
  // The days the figures cover. Before a period is picked the backend's own default (this month) applies.
  const range = data.range ?? presetRange('month');

  // Plain fetch instead of router.refresh(): refresh inside a transition could stay pending forever.
  const load = useCallback(async (p: Preset, cmp: boolean) => {
    setBusy(true);
    try {
      const r = presetRange(p);
      const res = await fetch(`/api/dashboard?from=${r.from}&to=${r.to}${cmp ? '&compare=1' : ''}`, { cache: 'no-store' });
      if (res.status === 401) { window.location.assign('/api/auth/logout'); return; }
      if (res.ok) setData(await res.json());
      else setData(d => ({ ...d, stats: { ok: false, status: res.status }, revenue: { ok: false, status: res.status }, chart: { ok: false, status: res.status }, videos: { ok: false, status: res.status }, trending: { ok: false, status: res.status } }));
    } catch {
      setData(d => ({ ...d, stats: { ok: false, status: 0 }, revenue: { ok: false, status: 0 }, chart: { ok: false, status: 0 }, videos: { ok: false, status: 0 }, trending: { ok: false, status: 0 } }));
    } finally {
      setBusy(false);
    }
  }, []);
  const refresh = useCallback(() => load(preset, compare), [load, preset, compare]);
  const pending = busy;

  const pickPreset = (p: Preset) => { setPreset(p); load(p, compare); };
  const toggleCompare = (v: boolean) => { setCompare(v); load(preset, v); };

  /** One CSV with every panel that loaded, so a report can be shared without screenshots. */
  function exportSummary() {
    const rows: unknown[][] = [['Etern dashboard summary', new Date(updatedAt).toISOString()], []];
    rows.push(['Period', `${range.from} to ${range.to}`]);
    if (revenue.ok) rows.push(['Revenue', inr(revenue.data.currentMonthRevenue)], ['Growth vs previous period (%)', revenue.data.growthPercentage ?? 'n/a']);
    if (stats.ok) {
      const t = stats.data;
      rows.push(['Registered students', t.totalUsers], ['Subscribed students', t.totalStudents], ['New registrations', t.registeredThisMonth],
        ['Students who bought or renewed a plan', t.subscribedThisMonth],
        ['New students with a plan now', t.newStudentsSubscribed ?? (t.registeredThisMonth - t.freeUsersThisMonth)],
        ['New students still on the free version', t.freeUsersThisMonth]);
    }
    if (expiring.ok) rows.push(['Subscriptions expiring within 7 days', expiring.data]);
    if (expired.ok) rows.push(['Subscriptions expired', expired.data]);
    if (chart.ok) rows.push([], ['Day', 'Plans bought'], ...(chart.data ?? []).map(p => [p.date ?? p.subscription_date, p.total_subscriptions]));
    if (videos.ok) rows.push([], ['Sub category', 'Category', 'Videos', 'Duration', 'Completed 100% (%)'], ...(videos.data ?? []).map(v => [v.subCategoryName, v.categoryName, v.totalCourseMaterials, v.totalDuration, v.studentsCompletedPercentage]));
    if (trending.ok) rows.push([], ['Trending video', 'Sub category', 'Repeat views', 'Students'], ...(trending.data ?? []).map(t => [t.courseMaterialName, t.subCategoryName, t.repeatedViews, t.distinctStudents]));
    downloadCsv('etern-dashboard-summary.csv', rows);
  }

  return (
    <div className="dash">
      <div className="dash-head">
        <div>
          <div className="eyebrow">Dashboard</div>
          <h1>Overview</h1>
          <p className="muted" suppressHydrationWarning>
            Updated {new Date(updatedAt).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}
          </p>
        </div>
        <div className="head-actions">
          <button type="button" className="btn" onClick={exportSummary}><Icon name="download" size={16} />Export summary</button>
          <button type="button" className="btn" onClick={refresh} disabled={pending} aria-label="Refresh dashboard data">
            <Icon name="refresh" size={16} />{pending ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </div>

      <div className="period" role="group" aria-label="Time period">
        <div className="tabs">
          {PRESETS.map(p => <button key={p.key} type="button" aria-pressed={preset === p.key} className={preset === p.key ? 'on' : ''} onClick={() => pickPreset(p.key)} disabled={pending}>{p.label}</button>)}
        </div>
        <label className="tg"><input type="checkbox" checked={compare} onChange={e => toggleCompare(e.target.checked)} disabled={pending} /> Compare with {info.previous}</label>
        <span className="muted" suppressHydrationWarning>{fmtDate(range.from, 'medium')} to {fmtDate(range.to, 'medium')}</span>
      </div>

      <KpiStrip stats={stats} revenue={revenue} chart={chart} phrase={info.phrase} label={info.label} previous={compare ? data.previous : null} onOpen={setMetric} retry={refresh} busy={pending} />
      <MetricDrawer metric={metric} data={data} phrase={info.phrase} label={info.label} onClose={() => setMetric(null)} />

      <QuickActions />

      <div className="grid">
        <TrendCard chart={chart} retry={refresh} busy={pending} />
        <FunnelCard stats={stats} range={range} phrase={info.phrase} retry={refresh} busy={pending} />
      </div>

      <div className="grid">
        <VideosCard videos={videos} assetBase={assetBase} retry={refresh} busy={pending} />
        <AttentionCard expiring={expiring} expired={expired} videos={videos} retry={refresh} busy={pending} />
      </div>
      <TrendingCard trending={trending} retry={refresh} busy={pending} />
    </div>
  );
}

