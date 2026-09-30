import { backendGet, Result } from './backend';
import { normaliseGrowth } from './format';
import type { Revenue, Stats, SubscriptionPoint, TrendingRow, VideoRow } from './types';

export interface DashboardData {
  stats: Result<Stats>;
  revenue: Result<Revenue>;
  chart: Result<SubscriptionPoint[]>;
  videos: Result<VideoRow[]>;
  trending: Result<TrendingRow[]>;
  updatedAt: string;
}

/** Loads every dashboard panel in parallel. A failing panel never fails the others. */
export async function loadDashboard(token: string): Promise<DashboardData> {
  const [stats, revenue, chart, videos, trending] = await Promise.all([
    backendGet<Stats>('user/userCount', token),
    backendGet<Revenue>('subscription/revenueDetails', token),
    backendGet<SubscriptionPoint[]>('student/dashboard/subscriptions', token),
    backendGet<VideoRow[]>('courseMaterial/videoDetails', token),
    backendGet<TrendingRow[]>('courseMaterial/dashboard/trendingVideoDetails', token),
  ]);
  const revenueFixed: Result<Revenue> = revenue.ok
    ? { ok: true, data: { ...revenue.data, growthPercentage: normaliseGrowth(revenue.data?.growthPercentage) } }
    : revenue;
  return { stats, revenue: revenueFixed, chart, videos, trending, updatedAt: new Date().toISOString() };
}

/** True when the API rejected the token (expired or revoked). */
export function isUnauthorised(d: DashboardData): boolean {
  return [d.stats, d.revenue, d.chart, d.videos, d.trending].some(r => !r.ok && (r.status === 401 || r.status === 403));
}
