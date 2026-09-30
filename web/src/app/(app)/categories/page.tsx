import Link from 'next/link';
import { Breadcrumb, PageHead } from '@/components/ui';
import { listOf, totalOf } from '@/lib/api';
import { noticeFor } from '@/lib/catalogue';
import { assetBaseUrl } from '@/lib/config';
import { authedGet } from '@/lib/server';
import type { CategoryRow } from '@/lib/types';
import CategoriesList from './CategoriesList';

export const dynamic = 'force-dynamic';

export default async function Page({ searchParams }: { searchParams: Promise<{ notice?: string }> }) {
  const { notice } = await searchParams;
  const r = await authedGet<unknown>('category/all?page=1&limit=10');
  return (
    <div className="dash">
      <Breadcrumb items={[{ label: 'Categories' }]} />
      <PageHead title="Categories"><Link className="btn primary" href="/categories/new">+ Add category</Link></PageHead>
      <CategoriesList initial={r.ok ? { rows: listOf<CategoryRow>(r.data), total: totalOf(r.data) } : null} notice={noticeFor(notice, 'Category')} assetBase={assetBaseUrl()} />
    </div>
  );
}
