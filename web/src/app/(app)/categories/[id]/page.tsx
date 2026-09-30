import Link from 'next/link';
import { Breadcrumb, DetailList, PageHead, Pill } from '@/components/ui';
import { assetBaseUrl } from '@/lib/config';
import { EntityImage, firstOf, LoadProblem } from '@/lib/entityPage';
import { kindLabel } from '@/lib/kind';
import { authedGet } from '@/lib/server';
import type { CategoryRow } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function Detail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const r = await authedGet<unknown>(`category/${id}`);
  const c = r.ok ? firstOf<CategoryRow>(r.data) : null;
  if (!c) return <LoadProblem result={r} plural="Categories" base="/categories" noun="Category" />;

  return (
    <div className="dash">
      <Breadcrumb items={[{ label: 'Categories', href: '/categories' }, { label: c.categoryName }]} />
      <PageHead title={c.categoryName}><Link className="btn primary" href={`/categories/${c._id}/edit`}>Edit</Link></PageHead>
      <div className="card">
        <DetailList items={[
          ['Package', c.packageId?.packageName],
          ['Type', kindLabel(c.type)],
          ['Sort order', String(c.sorting)],
          ['Status', <Pill key="s" tone={c.isActive ? 'good' : 'off'}>{c.isActive ? 'Active' : 'Inactive'}</Pill>],
          ['Description', c.description || 'N/A'],
        ]} />
        <EntityImage src={c.imageUrl ? assetBaseUrl() + c.imageUrl : null} alt={`${c.categoryName} image`} />
      </div>
    </div>
  );
}
