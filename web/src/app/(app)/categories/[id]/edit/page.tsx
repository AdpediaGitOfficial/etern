import { Breadcrumb, PageHead } from '@/components/ui';
import { assetBaseUrl } from '@/lib/config';
import { firstOf, LoadProblem } from '@/lib/entityPage';
import { authedGet } from '@/lib/server';
import type { CategoryRow } from '@/lib/types';
import CatalogueForm from '@/components/CatalogueForm';

export const dynamic = 'force-dynamic';

export default async function Edit({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const r = await authedGet<unknown>(`category/${id}`);
  const c = r.ok ? firstOf<CategoryRow>(r.data) : null;
  if (!c) return <LoadProblem result={r} plural="Categories" base="/categories" noun="Category" />;
  return (
    <div className="dash">
      <Breadcrumb items={[{ label: 'Categories', href: '/categories' }, { label: c.categoryName, href: `/categories/${c._id}` }, { label: 'Edit' }]} />
      <PageHead title="Edit category" />
      <CatalogueForm kind="category" initial={c} assetBase={assetBaseUrl()} />
    </div>
  );
}
