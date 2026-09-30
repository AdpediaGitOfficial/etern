'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import type { Result } from '@/lib/backend';
import type { DashboardData } from '@/lib/dashboardData';
import { completionClass, durationSeconds, inr, num } from '@/lib/format';
import type { Revenue, Stats, SubscriptionPoint, TrendingRow, VideoRow } from '@/lib/types';

interface Props {
  initial: DashboardData;
  assetBase: string;
}

type SortKey = 'name' | 'videos' | 'duration' | 'completed';
const W = 720, H = 280, PAD = { left: 44, right: 14, top: 12, bottom: 30 };

function PanelError({ onRetry, busy }: { onRetry: () => void; busy: boolean }) {
  return (
    <div className="err" role="alert">
      <strong>We couldn’t load this.</strong>
      <span>The server didn’t respond. Your data is safe.</span>
      <button type="button" className="btn" onClick={onRetry} disabled={busy}>{busy ? 'Retrying…' : 'Try again'}</button>
    </div>
  );
}

function Empty({ title, hint }: { title: string; hint: string }) {
  return <div className="empty"><strong>{title}</strong><span>{hint}</span></div>;
}

export default function DashboardView({ initial, assetBase }: Props) {
  const [data, setData] = useState<DashboardData>(initial);
  const [busy, setBusy] = useState(false);
  const { stats, revenue, chart, videos, trending, updatedAt } = data;

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

  return (
    <div className="dash">
      <div className="dash-head">
        <div>
          <h1>Overview</h1>
          <p className="muted" suppressHydrationWarning>
            Updated {new Date(updatedAt).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}
          </p>
        </div>
        <button type="button" className="btn" onClick={refresh} disabled={pending} aria-label="Refresh dashboard data">
          {pending ? 'Refreshing…' : '↻ Refresh'}
        </button>
      </div>

      <Kpis stats={stats} revenue={revenue} retry={refresh} busy={pending} />

      <div className="grid">
        <TrendCard chart={chart} retry={refresh} busy={pending} />
        <FunnelCard stats={stats} retry={refresh} busy={pending} />
      </div>

      <VideosCard videos={videos} assetBase={assetBase} retry={refresh} busy={pending} />
      <TrendingCard trending={trending} retry={refresh} busy={pending} />
    </div>
  );
}

function Kpis({ stats, revenue, retry, busy }: { stats: Result<Stats>; revenue: Result<Revenue>; retry: () => void; busy: boolean }) {
  const s = stats.ok ? stats.data : null;
  const conv = s && s.registeredThisMonth > 0 ? (s.subscribedThisMonth / s.registeredThisMonth) * 100 : null;
  const g = revenue.ok ? revenue.data.growthPercentage : null;

  const StatCard = ({ label, value, foot }: { label: string; value: string; foot: string }) => (
    <div className="card kpi">
      <div className="kpi-l">{label}</div>
      {s ? (<><div className="kpi-v">{value}</div><div className="kpi-f"><span className="muted">{foot}</span></div></>) : <PanelError onRetry={retry} busy={busy} />}
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
      <StatCard label="Subscribed students" value={num(s?.totalStudents)} foot={`${num(s?.subscribedThisMonth)} subscribed this month`} />
      <StatCard label="Conversion this month" value={conv === null ? '—' : conv.toLocaleString('en-IN', { maximumFractionDigits: 1 }) + '%'} foot={`${num(s?.subscribedThisMonth)} of ${num(s?.registeredThisMonth)} new students`} />
    </div>
  );
}

function TrendCard({ chart, retry, busy }: { chart: Result<SubscriptionPoint[]>; retry: () => void; busy: boolean }) {
  const points = useMemo(
    () => (chart.ok ? (chart.data || []).map(p => ({ label: p.subscription_date, value: Number(p.total_subscriptions) || 0 })) : []),
    [chart],
  );
  const [table, setTable] = useState(false);
  const [hover, setHover] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const max = Math.max(1, ...points.map(p => p.value));
  const pow = Math.pow(10, Math.floor(Math.log10(max)));
  const f = max / pow;
  const yMax = (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * pow;
  const x = (i: number) => PAD.left + (i * (W - PAD.left - PAD.right)) / Math.max(1, points.length - 1);
  const y = (v: number) => PAD.top + (H - PAD.top - PAD.bottom) * (1 - v / yMax);
  const total = points.reduce((s, p) => s + p.value, 0);
  const line = points.map((p, i) => `${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(' ');
  const step = Math.ceil(points.length / 8) || 1;

  function onMove(ev: React.PointerEvent<SVGSVGElement>) {
    const rect = svgRef.current!.getBoundingClientRect();
    const sx = ((ev.clientX - rect.left) / rect.width) * W;
    let best = 0, bd = Infinity;
    points.forEach((_, i) => { const d = Math.abs(x(i) - sx); if (d < bd) { bd = d; best = i; } });
    setHover(best);
  }

  return (
    <div className="card">
      <div className="ch">
        <div>
          <h2>Students subscribed</h2>
          {chart.ok && points.length ? <p className="muted">Last {points.length} days · {num(total)} total · hover for daily values</p> : null}
        </div>
        {chart.ok && points.length ? (
          <label className="tg"><input type="checkbox" checked={table} onChange={e => setTable(e.target.checked)} /> Table view</label>
        ) : null}
      </div>
      {!chart.ok ? <PanelError onRetry={retry} busy={busy} /> : !points.length ? (
        <Empty title="No subscriptions yet" hint="New subscriptions will appear here as students subscribe." />
      ) : table ? (
        <div className="tw">
          <table className="tbl narrow">
            <thead><tr><th>Date</th><th className="n">Subscriptions</th></tr></thead>
            <tbody>{points.map(p => <tr key={p.label}><td>{p.label}</td><td className="n">{num(p.value)}</td></tr>)}</tbody>
          </table>
        </div>
      ) : (
        <div className="plot">
          <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Students subscribed per day for the last ${points.length} days, ${total} in total`}
               onPointerMove={onMove} onPointerLeave={() => setHover(null)}>
            {[0, 1, 2, 3, 4].map(i => { const t = Math.round((yMax / 4) * i * 100) / 100; return (
              <g key={i}><line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} className="grid-line" /><text x={PAD.left - 8} y={y(t) + 4} textAnchor="end">{t}</text></g>
            ); })}
            {points.map((p, i) => i % step === 0 ? <text key={i} x={x(i)} y={H - 8} textAnchor="middle">{p.label.slice(5)}</text> : null)}
            <polygon points={`${x(0)},${y(0)} ${line} ${x(points.length - 1)},${y(0)}`} className="area" />
            <polyline points={line} className="line" />
            {hover !== null ? (<><line x1={x(hover)} x2={x(hover)} y1={PAD.top} y2={H - PAD.bottom} className="cross" /><circle cx={x(hover)} cy={y(points[hover].value)} r={5} className="dot" /></>) : null}
          </svg>
          {hover !== null ? (
            <div className="tip" style={{ left: `${Math.min(88, Math.max(12, (x(hover) / W) * 100))}%`, top: `${(y(points[hover].value) / H) * 100}%` }}>
              <strong>{points[hover].label}</strong><span>{num(points[hover].value)} subscribed</span>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

function FunnelCard({ stats, retry, busy }: { stats: Result<Stats>; retry: () => void; busy: boolean }) {
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

function VideosCard({ videos, assetBase, retry, busy }: { videos: Result<VideoRow[]>; assetBase: string; retry: () => void; busy: boolean }) {
  const [q, setQ] = useState('');
  const [sort, setSort] = useState<SortKey>('completed');
  const [dir, setDir] = useState<1 | -1>(-1);
  const [pageIdx, setPageIdx] = useState(0);
  const [failed, setFailed] = useState<Set<string>>(new Set());
  const per = 5;

  const rows = useMemo(() => {
    const list = videos.ok ? videos.data || [] : [];
    const term = q.trim().toLowerCase();
    const val = (v: VideoRow): string | number =>
      sort === 'name' ? (v.subCategoryName || '').toLowerCase()
      : sort === 'videos' ? Number(v.totalCourseMaterials) || 0
      : sort === 'duration' ? durationSeconds(v.totalDuration)
      : Number(v.studentsCompletedPercentage) || 0;
    return list
      .filter(v => !term || `${v.subCategoryName} ${v.categoryName}`.toLowerCase().includes(term))
      .sort((a, b) => (val(a) > val(b) ? 1 : val(a) < val(b) ? -1 : 0) * dir);
  }, [videos, q, sort, dir]);

  const pages = Math.max(1, Math.ceil(rows.length / per));
  const idx = Math.min(pageIdx, pages - 1);
  const vis = rows.slice(idx * per, idx * per + per);

  const setSortKey = (k: SortKey) => {
    if (sort === k) setDir(d => (d * -1) as 1 | -1); else { setSort(k); setDir(k === 'name' ? 1 : -1); }
    setPageIdx(0);
  };
  const th = (k: SortKey, label: string, right = false) => (
    <th className={right ? 'n' : ''} aria-sort={sort === k ? (dir === 1 ? 'ascending' : 'descending') : 'none'}>
      <button type="button" onClick={() => setSortKey(k)}>{label} {sort === k ? (dir === 1 ? '↑' : '↓') : ''}</button>
    </th>
  );

  function exportCsv() {
    const esc = (s: unknown) => `"${String(s ?? '').replace(/"/g, '""')}"`;
    const lines = [['Sub Category', 'Category', 'Total Videos', 'Total Duration', 'Students Viewed 100% (%)'],
      ...rows.map(v => [v.subCategoryName, v.categoryName, v.totalCourseMaterials, v.totalDuration, v.studentsCompletedPercentage])];
    const blob = new Blob([lines.map(r => r.map(esc).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = 'video-performance.csv'; a.click(); URL.revokeObjectURL(a.href);
  }

  return (
    <div className="card">
      <div className="ch">
        <div><h2>Video performance</h2><p className="muted">Completion by sub category</p></div>
        <button type="button" className="btn" onClick={exportCsv} disabled={!rows.length}>⤓ Export CSV</button>
      </div>
      {!videos.ok ? <PanelError onRetry={retry} busy={busy} /> : (
        <>
          <input className="search" type="search" placeholder="Search sub category or category" aria-label="Search videos"
                 value={q} onChange={e => { setQ(e.target.value); setPageIdx(0); }} />
          <div className="tw">
            <table className="tbl">
              <thead><tr>{th('name', 'Sub category')}{th('videos', 'Videos', true)}{th('duration', 'Duration', true)}{th('completed', 'Students viewed 100%')}</tr></thead>
              <tbody>
                {vis.map(v => {
                  const key = v.subCategoryName + v.categoryName;
                  const src = v.subCategoryImageUrl && !failed.has(key) ? assetBase + v.subCategoryImageUrl : null;
                  const pct = Number(v.studentsCompletedPercentage) || 0;
                  return (
                    <tr key={key}>
                      <td>
                        <div className="nm">
                          {src ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img className="thumb" src={src} alt="" onError={() => setFailed(s => new Set(s).add(key))} />
                          ) : <span className="thumb ph" aria-hidden="true">{(v.subCategoryName || '?').charAt(0).toUpperCase()}</span>}
                          <span><strong>{v.subCategoryName}</strong><small className="muted">{v.categoryName}</small></span>
                        </div>
                      </td>
                      <td className="n">{num(v.totalCourseMaterials)}</td>
                      <td className="n">{v.totalDuration} min</td>
                      <td><div className="pr"><div className="bar sm"><i className={completionClass(pct)} style={{ width: `${pct}%` }} /></div><span>{pct}%</span></div></td>
                    </tr>
                  );
                })}
                {!vis.length ? (
                  <tr><td colSpan={4}>
                    <Empty title={q ? `No videos match “${q}”` : 'No videos yet'} hint={q ? 'Try a different name or clear the search.' : 'Add course materials to see completion here.'} />
                  </td></tr>
                ) : null}
              </tbody>
            </table>
          </div>
          <div className="pgn">
            <span className="muted">Showing {rows.length ? `${idx * per + 1}–${idx * per + vis.length} of ${rows.length}` : '0 of 0'}</span>
            <span>
              <button type="button" className="btn" onClick={() => setPageIdx(idx - 1)} disabled={idx === 0}>Previous</button>
              <button type="button" className="btn" onClick={() => setPageIdx(idx + 1)} disabled={idx >= pages - 1}>Next</button>
            </span>
          </div>
        </>
      )}
    </div>
  );
}

function TrendingCard({ trending, retry, busy }: { trending: Result<TrendingRow[]>; retry: () => void; busy: boolean }) {
  const list = trending.ok ? trending.data || [] : [];
  const max = Math.max(1, ...list.map(t => Number(t.repeatedViews) || 0));
  return (
    <div className="card">
      <h2>Trending videos</h2>
      <p className="muted">Repeat views and unique students</p>
      {!trending.ok ? <PanelError onRetry={retry} busy={busy} /> : !list.length ? (
        <Empty title="No viewing activity yet" hint="Trending videos appear once students start watching." />
      ) : (
        <ol className="tr">
          {list.map((t, i) => (
            <li key={t.courseMaterialName + i}>
              <span className="rank">{i + 1}</span>
              <div className="tr-b">
                <strong>{t.courseMaterialName}</strong>
                <small className="muted">{t.subCategoryName} · {num(t.distinctStudents)} students</small>
                <div className="bar sm"><i style={{ width: `${((Number(t.repeatedViews) || 0) / max) * 100}%` }} /></div>
              </div>
              <strong className="n">{num(t.repeatedViews)}</strong>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
