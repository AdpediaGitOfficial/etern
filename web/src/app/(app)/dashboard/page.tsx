import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SESSION_COOKIE, assetBaseUrl } from '@/lib/config';
import { isUnauthorised, loadDashboard } from '@/lib/dashboardData';
import DashboardView from './DashboardView';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) redirect('/login');

  const data = await loadDashboard(token);
  // The API rejected the stored token: sign out instead of showing five error panels.
  if (isUnauthorised(data)) redirect('/api/auth/logout');

  return <DashboardView initial={data} assetBase={assetBaseUrl()} />;
}
