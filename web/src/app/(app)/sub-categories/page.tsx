import Link from 'next/link';
import { Breadcrumb, PageHead } from '@/components/ui';
import { listOf, totalOf } from '@/lib/api';
import { authedGet } from '@/lib/server';
import type { SubCategoryRow } from '@/lib/types';
import SubCategoriesList from './SubCategoriesList';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const r = await authedGet<unknown>('subcategory/all?page=1&limit=10');
  return (
    <div className="dash">
      <Breadcrumb items={[{ label: 'Sub categories' }]} />
      <PageHead title="Sub categories"><Link className="btn primary" href="/sub-categories/new">+ Add sub category</Link></PageHead>
      <SubCategoriesList initial={r.ok ? { rows: listOf<SubCategoryRow>(r.data), total: totalOf(r.data) } : null} />
    </div>
  );
}
