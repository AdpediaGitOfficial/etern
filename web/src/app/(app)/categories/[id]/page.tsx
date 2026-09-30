import { Breadcrumb } from '@/components/ui';
import CatalogueDetail from '@/components/CatalogueDetail';
import { assetBaseUrl } from '@/lib/config';
import { firstOf, LoadProblem } from '@/lib/entityPage';
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
      <CatalogueDetail<CategoryRow> initial={c} kind="category" noun="category" base="/categories" endpoint="category" name={c.categoryName}
        subtitle={c.packageId?.packageName ? `In package ${c.packageId.packageName}` : 'Category'} parentLabel="Package" parentName={c.packageId?.packageName ?? ''} assetBase={assetBaseUrl()} />
    </div>
  );
}
