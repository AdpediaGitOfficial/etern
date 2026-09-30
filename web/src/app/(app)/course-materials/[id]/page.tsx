import { Breadcrumb } from '@/components/ui';
import { assetBaseUrl } from '@/lib/config';
import { firstOf, LoadProblem } from '@/lib/entityPage';
import { authedGet } from '@/lib/server';
import type { CourseMaterialRow } from '@/lib/types';
import CourseMaterialDetail from '../CourseMaterialDetail';

export const dynamic = 'force-dynamic';

export default async function Detail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const r = await authedGet<unknown>(`coursematerial/${id}`);
  const m = r.ok ? firstOf<CourseMaterialRow>(r.data) : null;
  if (!m) return <LoadProblem result={r} plural="Course materials" base="/course-materials" noun="Course material" />;
  return (
    <div className="dash">
      <Breadcrumb items={[{ label: 'Course materials', href: '/course-materials' }, { label: m.courseMaterialName }]} />
      <CourseMaterialDetail initial={m} assetBase={assetBaseUrl()} />
    </div>
  );
}
