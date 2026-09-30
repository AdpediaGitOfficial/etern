import Link from 'next/link';
import { Breadcrumb } from '@/components/ui';
import { authedGet } from '@/lib/server';
import type { Journey } from '@/lib/types';
import UserJourney from './UserJourney';

export const dynamic = 'force-dynamic';

export default async function UserDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const r = await authedGet<Journey>(`student/${id}/journey`);

  if (!r.ok || !r.data) {
    const missing = r.ok || r.status === 404;
    return (
      <div className="dash">
        <Breadcrumb items={[{ label: 'Users', href: '/users' }, { label: 'Student' }]} />
        <div className="card"><div className="err" role="alert">
          <strong>{missing ? 'Student not found' : 'We couldn’t load this student.'}</strong>
          <span>{missing ? 'They may have been deleted.' : 'The server didn’t respond. Your data is safe.'}</span>
          <Link className="btn" href="/users">Back to users</Link>
        </div></div>
      </div>
    );
  }
  return (
    <div className="dash">
      <Breadcrumb items={[{ label: 'Users', href: '/users' }, { label: r.data.student.fullName }]} />
      <UserJourney j={r.data} />
    </div>
  );
}
