import Link from 'next/link';
import { Breadcrumb, DetailList, PageHead, Pill } from '@/components/ui';
import { assetBaseUrl } from '@/lib/config';
import { EntityImage, firstOf, LoadProblem } from '@/lib/entityPage';
import { kindLabel } from '@/lib/kind';
import { authedGet } from '@/lib/server';
import type { CourseMaterialRow } from '@/lib/types';

export const dynamic = 'force-dynamic';

/** Only http(s) links become clickable, so a stored javascript: URL can never run. */
const safeHref = (u: string): string | null => (/^https?:\/\//i.test(u) ? u : null);

export default async function Detail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const r = await authedGet<unknown>(`coursematerial/${id}`);
  const m = r.ok ? firstOf<CourseMaterialRow>(r.data) : null;
  if (!m) return <LoadProblem result={r} plural="Course materials" base="/course-materials" noun="Course material" />;
  const href = safeHref(m.courseMaterialUrl);

  return (
    <div className="dash">
      <Breadcrumb items={[{ label: 'Course materials', href: '/course-materials' }, { label: m.courseMaterialName }]} />
      <PageHead title={m.courseMaterialName}><Link className="btn primary" href={`/course-materials/${m._id}/edit`}>Edit</Link></PageHead>
      <div className="card">
        <DetailList items={[
          ['Link', href ? <a key="l" href={href} target="_blank" rel="noopener noreferrer" className="strong-link">{m.courseMaterialUrl}</a> : m.courseMaterialUrl],
          ['Category', m.subCategoryId?.categoryId?.categoryName],
          ['Sub category', m.subCategoryId?.subCategoryName],
          ['Type', kindLabel(m.type)],
          ['Sort order', String(m.sorting)],
          ['Status', <Pill key="s" tone={m.isActive ? 'good' : 'off'}>{m.isActive ? 'Active' : 'Inactive'}</Pill>],
          ['Description', m.description || 'N/A'],
        ]} />
        <EntityImage src={m.imageUrl ? assetBaseUrl() + m.imageUrl : null} alt={`${m.courseMaterialName} image`} />
      </div>
    </div>
  );
}
