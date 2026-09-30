'use client';

import { useCallback, useState } from 'react';
import { downloadCsv } from '@/lib/csv';
import { inr } from '@/lib/format';
import type { DashboardData } from '@/lib/dashboardData';
import AttentionCard from './AttentionCard';
import FunnelCard from './FunnelCard';
import KpiStrip from './KpiStrip';
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
  const { stats, revenue, chart, videos, trending, expiring, expired, updatedAt } = data;

  // Plain fetch instead of router.refresh(): refresh inside a transition could stay pending forever.
  const refresh = useCallback(async () => {
    setBusy(true);
    try {
      const res = await fetch('/api/dashboard', { cache: 'no-store' });
      if (res.status === 401) { window.location.assign('/api/auth/logout'); return; }
      if (res.ok) setData(await res.json());
      else setData(d => ({ ...d, stats: { ok: false, status: res.status }, revenue: { ok: false, status: res.status }, chart: { ok: false, status: res.status }, videos: { ok: false, status: res.status }, trending: { ok: false, status: res.status } }));
    } catch {
      setData(d => ({ ...d, stats: { ok: false, status: 0 }, revenue: { ok: false, status: 0 }, chart: { ok: false, status: 0 }, videos: { ok: false, status: 0 }, trending: { ok: false, status: 0 } }));
    } finally {
      setBusy(false);
    }
  }, []);
  const pending = busy;

  /** One CSV with every panel that loaded, so a report can be shared without screenshots. */
  function exportSummary() {
    const rows: unknown[][] = [['Etern dashboard summary', new Date(updatedAt).toISOString()], []];
    if (revenue.ok) rows.push(['Revenue this month', inr(revenue.data.currentMonthRevenue)], ['Growth vs last month (%)', revenue.data.growthPercentage ?? 'n/a']);
    if (stats.ok) {
      const t = stats.data;
      rows.push(['Registered students', t.totalUsers], ['Subscribed students', t.totalStudents], ['New registrations this month', t.registeredThisMonth],
        ['New subscriptions this month', t.subscribedThisMonth], ['Not subscribed this month', t.freeUsersThisMonth]);
    }
    if (expiring.ok) rows.push(['Subscriptions expiring within 7 days', expiring.data]);
    if (expired.ok) rows.push(['Subscriptions expired', expired.data]);
    if (chart.ok) rows.push([], ['Day', 'New subscriptions'], ...(chart.data ?? []).map(p => [p.subscription_date, p.total_subscriptions]));
    if (videos.ok) rows.push([], ['Sub category', 'Category', 'Videos', 'Duration', 'Completed 100% (%)'], ...(videos.data ?? []).map(v => [v.subCategoryName, v.categoryName, v.totalCourseMaterials, v.totalDuration, v.studentsCompletedPercentage]));
    if (trending.ok) rows.push([], ['Trending video', 'Sub category', 'Repeat views', 'Students'], ...(trending.data ?? []).map(t => [t.courseMaterialName, t.subCategoryName, t.repeatedViews, t.distinctStudents]));
    downloadCsv('etern-dashboard-summary.csv', rows);
  }

  return (
    <div className="dash">
      <div className="dash-head">
        <div>
          <h1>Overview</h1>
          <p className="muted" suppressHydrationWarning>
            Updated {new Date(updatedAt).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}
          </p>
        </div>
        <div className="head-actions">
          <button type="button" className="btn" onClick={exportSummary}>⤓ Export summary</button>
          <button type="button" className="btn" onClick={refresh} disabled={pending} aria-label="Refresh dashboard data">
            {pending ? 'Refreshing…' : '↻ Refresh'}
          </button>
        </div>
      </div>

      <KpiStrip stats={stats} revenue={revenue} chart={chart} retry={refresh} busy={pending} />

      <div className="grid">
        <TrendCard chart={chart} retry={refresh} busy={pending} />
        <FunnelCard stats={stats} retry={refresh} busy={pending} />
      </div>

      <div className="grid">
        <VideosCard videos={videos} assetBase={assetBase} retry={refresh} busy={pending} />
        <AttentionCard expiring={expiring} expired={expired} videos={videos} retry={refresh} busy={pending} />
      </div>
      <TrendingCard trending={trending} retry={refresh} busy={pending} />
    </div>
  );
}

