import { Breadcrumb } from '@/components/ui';
import CatalogueDetail from '@/components/CatalogueDetail';
import { assetBaseUrl } from '@/lib/config';
import { firstOf, LoadProblem } from '@/lib/entityPage';
import { authedGet } from '@/lib/server';
import type { SubCategoryRow } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function Detail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const r = await authedGet<unknown>(`subcategory/${id}`);
  const s = r.ok ? firstOf<SubCategoryRow>(r.data) : null;
  if (!s) return <LoadProblem result={r} plural="Sub categories" base="/sub-categories" noun="Sub category" />;

  const pkg = s.categoryId?.packageId?.packageName;
  return (
    <div className="dash">
      <Breadcrumb items={[{ label: 'Sub categories', href: '/sub-categories' }, { label: s.subCategoryName }]} />
      <CatalogueDetail<SubCategoryRow> initial={s} kind="subcategory" noun="sub category" base="/sub-categories" endpoint="subcategory" name={s.subCategoryName}
        subtitle={[s.categoryId?.categoryName, pkg].filter(Boolean).join(' · ') || 'Sub category'} parentLabel="Category" parentName={s.categoryId?.categoryName ?? ''} assetBase={assetBaseUrl()} />
    </div>
  );
}
