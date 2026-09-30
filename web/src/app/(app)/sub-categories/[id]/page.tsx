import Link from 'next/link';
import { Breadcrumb, DetailList, PageHead, Pill } from '@/components/ui';
import { assetBaseUrl } from '@/lib/config';
import { EntityImage, firstOf, LoadProblem } from '@/lib/entityPage';
import { kindLabel } from '@/lib/kind';
import { authedGet } from '@/lib/server';
import type { SubCategoryRow } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function Detail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const r = await authedGet<unknown>(`subcategory/${id}`);
  const s = r.ok ? firstOf<SubCategoryRow>(r.data) : null;
  if (!s) return <LoadProblem result={r} plural="Sub categories" base="/sub-categories" noun="Sub category" />;

  return (
    <div className="dash">
      <Breadcrumb items={[{ label: 'Sub categories', href: '/sub-categories' }, { label: s.subCategoryName }]} />
      <PageHead title={s.subCategoryName}><Link className="btn primary" href={`/sub-categories/${s._id}/edit`}>Edit</Link></PageHead>
      <div className="card">
        <DetailList items={[
          ['Category', s.categoryId?.categoryName],
          ['Package', s.categoryId?.packageId?.packageName],
          ['Type', kindLabel(s.type)],
          ['Sort order', String(s.sorting)],
          ['Status', <Pill key="s" tone={s.isActive ? 'good' : 'off'}>{s.isActive ? 'Active' : 'Inactive'}</Pill>],
          ['Description', s.description || 'N/A'],
        ]} />
        <EntityImage src={s.imageUrl ? assetBaseUrl() + s.imageUrl : null} alt={`${s.subCategoryName} image`} />
      </div>
    </div>
  );
}
