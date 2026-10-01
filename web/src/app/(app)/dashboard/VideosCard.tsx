'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import Icon from '@/components/icons';
import SidePanel from '@/components/SidePanel';
import type { Result } from '@/lib/backend';
import { Empty, PanelError } from '@/components/ui';
import { downloadCsv } from '@/lib/csv';
import { completionClass, durationSeconds, num } from '@/lib/format';
import type { VideoRow } from '@/lib/types';

type SortKey = 'name' | 'videos' | 'duration' | 'completed';

export default function VideosCard({ videos, assetBase, retry, busy }: { videos: Result<VideoRow[]>; assetBase: string; retry: () => void; busy: boolean }) {
  const [q, setQ] = useState('');
  const [sort, setSort] = useState<SortKey>('completed');
  const [dir, setDir] = useState<1 | -1>(-1);
  const [pageIdx, setPageIdx] = useState(0);
  const [detail, setDetail] = useState<VideoRow | null>(null);
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
    downloadCsv('video-performance.csv', [
      ['Sub Category', 'Category', 'Total Videos', 'Total Duration', 'Students Viewed 100% (%)'],
      ...rows.map(v => [v.subCategoryName, v.categoryName, v.totalCourseMaterials, v.totalDuration, v.studentsCompletedPercentage]),
    ]);
  }

  return (
    <div className="card">
      <div className="ch">
        <div><h2>Video performance</h2><p className="muted">Completion by sub category</p></div>
        <button type="button" className="btn" onClick={exportCsv} disabled={!rows.length}><Icon name="download" size={16} />Export CSV</button>
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
                    <tr key={key} className="clickable" onClick={() => setDetail(v)}>
                      <td>
                        <div className="nm">
                          {src ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img className="thumb" src={src} alt="" onError={() => setFailed(s => new Set(s).add(key))} />
                          ) : <span className="thumb ph" aria-hidden="true">{(v.subCategoryName || '?').charAt(0).toUpperCase()}</span>}
                          <span><button type="button" className="strong-link linkbtn" onClick={() => setDetail(v)}>{v.subCategoryName}</button><small className="muted">{v.categoryName}</small></span>
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
      <VideoPanel video={detail} onClose={() => setDetail(null)} />
    </div>
  );
}

function VideoPanel({ video, onClose }: { video: VideoRow | null; onClose: () => void }) {
  const pct = video ? Number(video.studentsCompletedPercentage) || 0 : 0;
  const cls = completionClass(pct);
  const verdict = cls === 'good' ? 'Students are finishing this content.' : cls === 'mid' ? 'About half of the students finish. Watch this one.' : 'Few students finish this content. Check the videos and their order.';
  return (
    <SidePanel open={Boolean(video)} title={video?.subCategoryName ?? ''} subtitle={video?.categoryName} onClose={onClose}
               icon={<span className="kpi-ic teal"><Icon name="video" /></span>}
               footer={<><Link className="btn primary" href="/course-materials">Course materials</Link><Link className="btn" href="/sub-categories">Sub categories</Link></>}>
      {video ? (
        <>
          <div className="hero"><span className="big">{pct.toLocaleString('en-IN', { maximumFractionDigits: 1 })}%</span><span className="muted">of students viewed 100%</span></div>
          <div className="bar"><i className={cls} style={{ width: `${Math.min(100, pct)}%` }} /></div>
          <p className="muted">{verdict}</p>
          <div className="stat-grid">
            <div className="stat"><b>{num(video.totalCourseMaterials)}</b><span>Videos</span></div>
            <div className="stat"><b>{video.totalDuration}</b><span>Total duration</span></div>
          </div>
        </>
      ) : null}
    </SidePanel>
  );
}
