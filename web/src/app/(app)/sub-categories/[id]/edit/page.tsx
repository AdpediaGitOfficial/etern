import { Breadcrumb, PageHead } from '@/components/ui';
import { assetBaseUrl } from '@/lib/config';
import { firstOf, LoadProblem } from '@/lib/entityPage';
import { authedGet } from '@/lib/server';
import type { SubCategoryRow } from '@/lib/types';
import SubCategoryForm from '../../SubCategoryForm';

export const dynamic = 'force-dynamic';

export default async function Edit({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const r = await authedGet<unknown>(`subcategory/${id}`);
  const s = r.ok ? firstOf<SubCategoryRow>(r.data) : null;
  if (!s) return <LoadProblem result={r} plural="Sub categories" base="/sub-categories" noun="Sub category" />;
  return (
    <div className="dash">
      <Breadcrumb items={[{ label: 'Sub categories', href: '/sub-categories' }, { label: s.subCategoryName, href: `/sub-categories/${s._id}` }, { label: 'Edit' }]} />
      <PageHead title="Edit sub category" />
      <SubCategoryForm initial={s} assetBase={assetBaseUrl()} />
    </div>
  );
}
