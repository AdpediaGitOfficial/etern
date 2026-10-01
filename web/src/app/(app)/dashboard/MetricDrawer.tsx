'use client';

import Link from 'next/link';
import { ReactNode, useCallback, useEffect, useState } from 'react';
import Icon from '@/components/icons';
import SidePanel from '@/components/SidePanel';
import { Pill } from '@/components/ui';
import { api } from '@/lib/api';
import type { DashboardData } from '@/lib/dashboardData';
import { conversion } from '@/lib/access';
import { monthRange, usersLink } from '@/lib/dates';
import { fmtDate, inr, num } from '@/lib/format';
import type { Paged, Payment, Student } from '@/lib/types';

export type Metric = 'revenue' | 'registered' | 'subscribed' | 'conversion';

type Load<T> = { state: 'loading' } | { state: 'error' } | { state: 'ready'; rows: T[]; total: number };

/** Loads a short preview list for the panel. Re-runs when `path` changes. */
function usePreview<T>(path: string | null): [Load<T>, () => void] {
  const [load, setLoad] = useState<Load<T>>({ state: 'loading' });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!path) return;
    const ctl = new AbortController();
    setLoad({ state: 'loading' });
    api<{ result?: Paged<T> }>(path, { signal: ctl.signal })
      .then(r => setLoad(r.ok ? { state: 'ready', rows: r.body?.result?.data ?? [], total: r.body?.result?.totalCount ?? 0 } : { state: 'error' }))
      .catch(() => undefined); // aborted
    return () => ctl.abort();
  }, [path, attempt]);
  return [load, () => setAttempt(a => a + 1)];
}

function Preview<T>({ title, load, retry, empty, render, allHref, allLabel }: {
  title: string; load: Load<T>; retry: () => void; empty: string; render: (row: T) => ReactNode; allHref?: string; allLabel?: string;
}) {
  return (
    <section>
      <div className="sec-title">{title}</div>
      {load.state === 'loading' ? <div className="skel" aria-busy="true"><i /><i /><i /></div> : null}
      {load.state === 'error' ? <div className="err" role="alert"><strong>We couldn’t load this.</strong><button type="button" className="btn sm" onClick={retry}>Try again</button></div> : null}
      {load.state === 'ready' && !load.rows.length ? <p className="muted">{empty}</p> : null}
      {load.state === 'ready' && load.rows.length ? <ul className="rows">{load.rows.map(render)}</ul> : null}
      {allHref && load.state === 'ready' && load.total > load.rows.length ? (
        <p><Link className="link" href={allHref}>{allLabel ?? 'View all'} ({num(load.total)}) →</Link></p>
      ) : null}
    </section>
  );
}

const studentRow = (s: Student) => (
  <li key={s._id}>
    <span className="avatar" aria-hidden="true">{(s.fullName || '?').charAt(0).toUpperCase()}</span>
    <Link className="row-link" href={`/users/${s._id}`}>
      <span className="grow"><strong>{s.fullName}</strong><small className="muted">{s.mobileNumber || 'No mobile number'} · joined {fmtDate(s.createdAt)}</small></span>
      <Pill tone={s.subscribed ? 'good' : 'off'}>{s.subscribed ? 'Subscribed' : 'Free'}</Pill>
    </Link>
  </li>
);

function paymentRow(base: string) {
  return function PaymentRow(p: Payment) {
    return (
      <li key={p._id}>
        <Link className="row-link" href={`${base}/${p._id}`}>
          <span className="grow"><strong>{p.studentId?.fullName ?? '—'}</strong><small className="muted">{p.packageId?.packageName ?? '—'} · {fmtDate(p.createdAt, 'medium')}</small></span>
          <strong>{p.paymentId?.amount === undefined ? '—' : inr(p.paymentId.amount)}</strong>
        </Link>
      </li>
    );
  };
}

const Stat = ({ label, value }: { label: string; value: string }) => <div className="stat"><b>{value}</b><span>{label}</span></div>;

function RevenueBody({ data, phrase }: { data: DashboardData; phrase: string }) {
  const [online, retryOnline] = usePreview<Payment>('subscription/offlinepayments?mode=online&page=1&limit=5');
  const [offline, retryOffline] = usePreview<Payment>('subscription/offlinepayments?mode=offline&page=1&limit=5');
  const g = data.revenue.ok ? data.revenue.data.growthPercentage : null;
  return (
    <>
      <div className="hero">
        <span className="big">{data.revenue.ok ? inr(data.revenue.data.currentMonthRevenue) : '—'}</span>
        {g === null ? <span className="delta flat">No comparison</span> : <span className={'delta ' + (g >= 0 ? 'up' : 'dn')}><Icon name={g >= 0 ? 'trendUp' : 'trendDown'} size={14} /> {Math.abs(g).toLocaleString('en-IN', { maximumFractionDigits: 1 })}% vs previous period</span>}
      </div>
      <p className="muted">Revenue collected {phrase} across online and offline payments.{g === null ? ' The previous period had no revenue, so there is nothing to compare with.' : ''}</p>
      <Preview title="Latest online payments" load={online} retry={retryOnline} empty="No online payments yet." render={paymentRow('/online-payments')} allHref="/online-payments" allLabel="View all online payments" />
      <Preview title="Latest offline payments" load={offline} retry={retryOffline} empty="No offline payments yet." render={paymentRow('/offline-payments')} allHref="/offline-payments" allLabel="View all offline payments" />
    </>
  );
}

function StudentsBody({ metric, data, phrase }: { metric: 'registered' | 'subscribed'; data: DashboardData; phrase: string }) {
  const { from, to } = data.range ?? monthRange();
  const registered = metric === 'registered';
  const path = registered ? `student/allAdmin?page=1&limit=6&startDate=${from}&endDate=${to}` : `student/allAdmin?page=1&limit=6&subscribedFrom=${from}&subscribedTo=${to}`;
  const [list, retry] = usePreview<Student>(path);
  const s = data.stats.ok ? data.stats.data : null;
  return (
    <>
      <div className="hero"><span className="big">{num(registered ? s?.totalUsers : s?.totalStudents)}</span><span className="muted">{registered ? 'registered students' : 'subscribed students'}</span></div>
      <div className="stat-grid">
        <Stat label={`Joined ${phrase}`} value={num(s?.registeredThisMonth)} />
        <Stat label={`Bought a plan ${phrase}`} value={num(s?.subscribedThisMonth)} />
        <Stat label="New students with a plan" value={num(conversion(s)?.withPlan)} />
        <Stat label="Expiring in 7 days" value={data.expiring.ok ? num(data.expiring.data) : '—'} />
        <Stat label="Expired" value={data.expired.ok ? num(data.expired.data) : '—'} />
      </div>
      <Preview title={registered ? `Joined ${phrase}` : `Bought a plan ${phrase}`} load={list} retry={retry} empty="No students match yet." render={studentRow}
               allHref={registered ? usersLink({ from, to }) : usersLink({ subscribedFrom: from, subscribedTo: to })} allLabel="Open in Users" />
    </>
  );
}

function ConversionBody({ data, phrase }: { data: DashboardData; phrase: string }) {
  const { from, to } = data.range ?? monthRange();
  const s = data.stats.ok ? data.stats.data : null;
  const c = conversion(s);
  const rate = c?.percent ?? null;
  const rows = [
    { label: 'Registered', value: c?.registered ?? 0, href: usersLink({ from, to }), cls: 'blue' },
    { label: 'Have a plan', value: c?.withPlan ?? 0, href: usersLink({ from, to, segment: 'active' }), cls: '' },
    { label: 'Still free', value: c?.stillFree ?? 0, href: usersLink({ from, to, segment: 'free' }), cls: 'amber' },
  ];
  return (
    <>
      <div className="hero"><span className="big">{rate === null ? '—' : `${rate.toLocaleString('en-IN', { maximumFractionDigits: 1 })}%`}</span><span className="muted">of new students subscribed</span></div>
      <p className="muted">{c ? `${num(c.withPlan)} of the ${num(c.registered)} students who joined ${phrase} have a plan now.` : 'Numbers are unavailable right now.'}</p>
      <section>
        <div className="sec-title">Where the new students are</div>
        <ul className="rows">
          {rows.map(r => {
            const pct = c && c.registered > 0 ? Math.min(100, (r.value / c.registered) * 100) : 0;
            return (
              <li key={r.label}>
                <Link className="row-link" href={r.href}>
                  <span className="grow"><strong>{r.label}</strong><span className="bar sm"><i className={r.cls} style={{ width: `${r.label === 'Registered' ? (r.value ? 100 : 0) : pct}%` }} /></span></span>
                  <strong>{num(r.value)}</strong><Icon name="chevronRight" size={16} />
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
      <p className="muted">Each row opens the Users list filtered to that group.</p>
    </>
  );
}

const TITLES: Record<Metric, { title: string; subtitle: string; icon: 'rupee' | 'users' | 'sparkles' | 'percent' }> = {
  revenue: { title: 'Revenue', subtitle: 'Money received', icon: 'rupee' },
  registered: { title: 'Registered students', subtitle: 'Everyone with an account', icon: 'users' },
  subscribed: { title: 'Subscribed students', subtitle: 'Students with a paid plan', icon: 'sparkles' },
  conversion: { title: 'Conversion', subtitle: 'New students who bought a plan', icon: 'percent' },
};

/** Details panel opened from a KPI card: the number in context, a preview of the records behind it, and links into the full lists. */
export default function MetricDrawer({ metric, data, phrase, label, onClose }: { metric: Metric | null; data: DashboardData; phrase: string; label: string; onClose: () => void }) {
  const t = metric ? TITLES[metric] : null;
  const { from, to } = data.range ?? monthRange();
  const footer = useCallback((): ReactNode => {
    if (metric === 'revenue') return <><Link className="btn primary" href="/online-payments">Online payments</Link><Link className="btn" href="/offline-payments">Offline payments</Link></>;
    if (metric === 'registered') return <><Link className="btn primary" href="/users">All users</Link><Link className="btn" href={usersLink({ from, to })}>Joined {phrase}</Link></>;
    if (metric === 'subscribed') return <><Link className="btn primary" href={usersLink({ segment: 'active' })}>Subscribed users</Link><Link className="btn" href="/users/upcoming">Upcoming expiry</Link></>;
    return <><Link className="btn primary" href={usersLink({ from, to, segment: 'free' })}>Follow up on free users</Link></>;
  }, [metric, from, to, phrase]);

  return (
    <SidePanel open={Boolean(metric)} title={t?.title ?? ''} subtitle={metric === 'revenue' || metric === 'conversion' ? `${t?.subtitle ?? ''} · ${label}` : t?.subtitle} onClose={onClose} footer={metric ? footer() : null}
               icon={t ? <span className="kpi-ic teal"><Icon name={t.icon} /></span> : null}>
      {metric === 'revenue' ? <RevenueBody data={data} phrase={phrase} /> : null}
      {metric === 'registered' || metric === 'subscribed' ? <StudentsBody metric={metric} data={data} phrase={phrase} /> : null}
      {metric === 'conversion' ? <ConversionBody data={data} phrase={phrase} /> : null}
    </SidePanel>
  );
}
