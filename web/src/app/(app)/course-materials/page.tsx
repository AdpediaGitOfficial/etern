import Link from 'next/link';
import { Breadcrumb, PageHead } from '@/components/ui';
import { listOf, totalOf } from '@/lib/api';
import { authedGet } from '@/lib/server';
import type { CourseMaterialRow } from '@/lib/types';
import CourseMaterialsList from './CourseMaterialsList';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const r = await authedGet<unknown>('coursematerial/all?page=1&limit=10');
  return (
    <div className="dash">
      <Breadcrumb items={[{ label: 'Course materials' }]} />
      <PageHead title="Course materials"><Link className="btn primary" href="/course-materials/new">+ Add course material</Link></PageHead>
      <CourseMaterialsList initial={r.ok ? { rows: listOf<CourseMaterialRow>(r.data), total: totalOf(r.data) } : null} />
    </div>
  );
}
