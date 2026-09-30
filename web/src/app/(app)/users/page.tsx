import { Breadcrumb, PageHead } from '@/components/ui';
import { authedGet } from '@/lib/server';
import type { Paged, Student } from '@/lib/types';
import UsersList from './UsersList';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const q = new URLSearchParams({ page: '1', limit: '10' });
  const r = await authedGet<Paged<Student>>(`student/allAdmin?${q}`);
  return (
    <div className="dash">
      <Breadcrumb items={[{ label: 'Users' }]} />
      <PageHead title="Users" />
      <UsersList filter="all" initial={r.ok ? r.data : null} />
    </div>
  );
}
