'use client';

import type { Result } from '@/lib/backend';
import { Empty, PanelError } from '@/components/ui';
import { num } from '@/lib/format';
import type { TrendingRow } from '@/lib/types';

export default function TrendingCard({ trending, retry, busy }: { trending: Result<TrendingRow[]>; retry: () => void; busy: boolean }) {
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
