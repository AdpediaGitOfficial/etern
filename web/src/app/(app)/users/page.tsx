import { Breadcrumb, PageHead } from '@/components/ui';
import { isIsoDay } from '@/lib/dates';
import { authedGet } from '@/lib/server';
import type { Paged, Student } from '@/lib/types';
import UsersList, { type InitialFilters } from './UsersList';

export const dynamic = 'force-dynamic';

const triState = (v: string | string[] | undefined): 'true' | 'false' | undefined => (v === 'true' || v === 'false' ? v : undefined);
const one = (v: string | string[] | undefined): string | undefined => (Array.isArray(v) ? v[0] : v);

/** Filters arrive in the address (dashboard drill-downs, shared links). Anything unexpected is ignored. */
function filtersFrom(sp: Record<string, string | string[] | undefined>): InitialFilters {
  const from = one(sp.from);
  const to = one(sp.to);
  const dates = isIsoDay(from) && isIsoDay(to) ? { from, to } : {};
  return { q: one(sp.q)?.slice(0, 80) || undefined, subscription: triState(sp.subscription), status: triState(sp.status), ...dates };
}

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const f = filtersFrom(await searchParams);
  const q = new URLSearchParams({ page: '1', limit: '10' });
  if (f.q) q.set('fullName', f.q);
  if (f.subscription) q.set('subscribed', f.subscription);
  if (f.status) q.set('isActive', f.status);
  if (f.from && f.to) { q.set('startDate', f.from); q.set('endDate', f.to); }
  const r = await authedGet<Paged<Student>>(`student/allAdmin?${q}`);
  return (
    <div className="dash">
      <Breadcrumb items={[{ label: 'Users' }]} />
      <PageHead title="Users" />
      <UsersList filter="all" initial={r.ok ? r.data : null} initialFilters={f} />
    </div>
  );
}
