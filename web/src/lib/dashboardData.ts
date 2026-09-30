import { backendGet, Result } from './backend';
import { previousPeriod } from './dates';
import { normaliseGrowth } from './format';
import type { Paged, Revenue, Stats, SubscriptionPoint, TrendingRow, VideoRow } from './types';

export interface DashboardData {
  stats: Result<Stats>;
  revenue: Result<Revenue>;
  chart: Result<SubscriptionPoint[]>;
  videos: Result<VideoRow[]>;
  trending: Result<TrendingRow[]>;
  /** students whose subscription ends within 7 days */
  expiring: Result<number>;
  /** students whose subscription has already ended */
  expired: Result<number>;
  /** The period the stats, revenue and chart cover. Null means the backend's own default (this month, last 10 days). */
  range: { from: string; to: string } | null;
  /** The same figures for the period before, when "Compare" is on. */
  previous: { stats: Result<Stats>; revenue: Result<Revenue> } | null;
  updatedAt: string;
}

export interface LoadOptions { range?: { from: string; to: string }; compare?: boolean }

/** Counts students for a filter by asking for one row and reading the total. */
async function studentCount(filter: string, token: string): Promise<Result<number>> {
  const r = await backendGet<Paged<unknown>>(`student/allAdmin?page=1&limit=1&${filter}`, token);
  return r.ok ? { ok: true, data: r.data?.totalCount ?? 0 } : r;
}

/** Loads every dashboard panel in parallel. A failing panel never fails the others. */
export async function loadDashboard(token: string, opts: LoadOptions = {}): Promise<DashboardData> {
  const { range } = opts;
  const q = (r?: { from: string; to: string }) => (r ? `?from=${r.from}&to=${r.to}` : '');
  const before = range && opts.compare ? previousPeriod(range) : null;
  const [stats, revenue, chart, videos, trending, expiring, expired, prevStats, prevRevenue] = await Promise.all([
    backendGet<Stats>(`user/userCount${q(range)}`, token),
    backendGet<Revenue>(`subscription/revenueDetails${q(range)}`, token),
    backendGet<SubscriptionPoint[]>(`student/dashboard/subscriptions${q(range)}`, token),
    backendGet<VideoRow[]>('courseMaterial/videoDetails', token),
    backendGet<TrendingRow[]>('courseMaterial/dashboard/trendingVideoDetails', token),
    studentCount('segment=expiring', token),
    studentCount('segment=lapsed', token),
    before ? backendGet<Stats>(`user/userCount${q(before)}`, token) : Promise.resolve(null),
    before ? backendGet<Revenue>(`subscription/revenueDetails${q(before)}`, token) : Promise.resolve(null),
  ]);
  const revenueFixed: Result<Revenue> = revenue.ok
    ? { ok: true, data: { ...revenue.data, growthPercentage: normaliseGrowth(revenue.data?.growthPercentage) } }
    : revenue;
  const previous = prevStats && prevRevenue ? { stats: prevStats, revenue: prevRevenue } : null;
  return { stats, revenue: revenueFixed, chart, videos, trending, expiring, expired, range: range ?? null, previous, updatedAt: new Date().toISOString() };
}

/** True when the API rejected the token (expired or revoked). */
export function isUnauthorised(d: DashboardData): boolean {
  return [d.stats, d.revenue, d.chart, d.videos, d.trending, d.expiring, d.expired].some(r => !r.ok && (r.status === 401 || r.status === 403));
}
