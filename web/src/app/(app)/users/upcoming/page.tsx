import { Breadcrumb, PageHead } from '@/components/ui';
import { authedGet } from '@/lib/server';
import type { Paged, Student } from '@/lib/types';
import UsersList from '../UsersList';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const q = new URLSearchParams({ page: '1', limit: '10', segment: 'expiring' });
  const r = await authedGet<Paged<Student>>(`student/allAdmin?${q}`);
  return (
    <div className="dash">
      <Breadcrumb items={[{ label: 'Users', href: '/users' }, { label: 'Upcoming expiry' }]} />
      <PageHead title="Upcoming expiry" />
      <UsersList filter="upcoming" initial={r.ok ? r.data : null} />
    </div>
  );
}
