import { Breadcrumb, PageHead } from '@/components/ui';
import { isIsoDay, validRange } from '@/lib/dates';
import { authedGet } from '@/lib/server';
import type { Paged, SegmentCounts, Student } from '@/lib/types';
import { SEGMENTS, type Segment } from '@/lib/access';
import UsersList, { type InitialFilters } from './UsersList';

export const dynamic = 'force-dynamic';

const triState = (v: string | string[] | undefined): 'true' | 'false' | undefined => (v === 'true' || v === 'false' ? v : undefined);
const one = (v: string | string[] | undefined): string | undefined => (Array.isArray(v) ? v[0] : v);

/** Filters arrive in the address (dashboard drill-downs, shared links). Anything unexpected is ignored. */
function filtersFrom(sp: Record<string, string | string[] | undefined>): InitialFilters {
  const from = one(sp.from);
  const to = one(sp.to);
  const dates = isIsoDay(from) && isIsoDay(to) ? { from, to } : {};
  // Older links use ?subscription=true|false. They map to the new groups.
  const legacy = sp.subscription === 'true' ? 'active' : sp.subscription === 'false' ? 'free' : undefined;
  const asked = one(sp.segment) ?? legacy;
  const segment = SEGMENTS.includes(asked as Segment) ? (asked as Segment) : undefined;
  // Students who bought or renewed a plan in a period (dashboard drill-down). Needs a valid pair.
  const bf = one(sp.subscribedFrom);
  const bt = one(sp.subscribedTo);
  const bought = validRange(bf, bt) ? { subscribedFrom: bf, subscribedTo: bt } : {};
  return { q: one(sp.q)?.slice(0, 80) || undefined, segment, status: triState(sp.status), ...dates, ...bought };
}

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const f = filtersFrom(await searchParams);
  const q = new URLSearchParams({ page: '1', limit: '10' });
  if (f.q) q.set('fullName', f.q);
  if (f.segment) q.set('segment', f.segment);
  if (f.status) q.set('isActive', f.status);
  if (f.from && f.to) { q.set('startDate', f.from); q.set('endDate', f.to); }
  if (f.subscribedFrom && f.subscribedTo) { q.set('subscribedFrom', f.subscribedFrom); q.set('subscribedTo', f.subscribedTo); }
  const [r, c] = await Promise.all([authedGet<Paged<Student>>(`student/allAdmin?${q}`), authedGet<SegmentCounts>('student/segments')]);
  return (
    <div className="dash">
      <Breadcrumb items={[{ label: 'Users' }]} />
      <PageHead title="Users" />
      <UsersList filter="all" initial={r.ok ? r.data : null} initialFilters={f} initialCounts={c.ok ? c.data : null} />
    </div>
  );
}
