'use client';

import { useMemo, useRef, useState } from 'react';
import type { Result } from '@/lib/backend';
import { Empty, PanelError } from '@/components/ui';
import { num } from '@/lib/format';
import type { SubscriptionPoint } from '@/lib/types';

const W = 720, H = 280, PAD = { left: 44, right: 14, top: 12, bottom: 30 };

export default function TrendCard({ chart, retry, busy }: { chart: Result<SubscriptionPoint[]>; retry: () => void; busy: boolean }) {
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
            {points.map((p, i) => i % step === 0 ? <text key={i} x={x(i)} y={H - 8} textAnchor="middle">{p.label}</text> : null)}
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
