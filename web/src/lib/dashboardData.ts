import { backendGet, Result } from './backend';
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
  updatedAt: string;
}

/** Counts students for a filter by asking for one row and reading the total. */
async function studentCount(filter: string, token: string): Promise<Result<number>> {
  const r = await backendGet<Paged<unknown>>(`student/allAdmin?page=1&limit=1&${filter}`, token);
  return r.ok ? { ok: true, data: r.data?.totalCount ?? 0 } : r;
}

/** Loads every dashboard panel in parallel. A failing panel never fails the others. */
export async function loadDashboard(token: string): Promise<DashboardData> {
  const [stats, revenue, chart, videos, trending, expiring, expired] = await Promise.all([
    backendGet<Stats>('user/userCount', token),
    backendGet<Revenue>('subscription/revenueDetails', token),
    backendGet<SubscriptionPoint[]>('student/dashboard/subscriptions', token),
    backendGet<VideoRow[]>('courseMaterial/videoDetails', token),
    backendGet<TrendingRow[]>('courseMaterial/dashboard/trendingVideoDetails', token),
    studentCount('segment=expiring', token),
    studentCount('segment=lapsed', token),
  ]);
  const revenueFixed: Result<Revenue> = revenue.ok
    ? { ok: true, data: { ...revenue.data, growthPercentage: normaliseGrowth(revenue.data?.growthPercentage) } }
    : revenue;
  return { stats, revenue: revenueFixed, chart, videos, trending, expiring, expired, updatedAt: new Date().toISOString() };
}

/** True when the API rejected the token (expired or revoked). */
export function isUnauthorised(d: DashboardData): boolean {
  return [d.stats, d.revenue, d.chart, d.videos, d.trending, d.expiring, d.expired].some(r => !r.ok && (r.status === 401 || r.status === 403));
}
