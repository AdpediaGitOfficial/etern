import { Breadcrumb, PageHead } from '@/components/ui';
import { firstOf, LoadProblem } from '@/lib/entityPage';
import { authedGet } from '@/lib/server';
import type { PackageRow } from '@/lib/types';
import PackageForm from '../../PackageForm';

export const dynamic = 'force-dynamic';

export default async function Edit({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const r = await authedGet<unknown>(`package/${id}`);
  const p = r.ok ? firstOf<PackageRow>(r.data) : null;
  if (!p) return <LoadProblem result={r} plural="Packages" base="/packages" noun="Package" />;
  return (
    <div className="dash">
      <Breadcrumb items={[{ label: 'Packages', href: '/packages' }, { label: p.packageName, href: `/packages/${p._id}` }, { label: 'Edit' }]} />
      <PageHead title="Edit package" subtitle="Changes apply to new subscriptions. Existing students keep their current plan." />
      <PackageForm initial={p} />
    </div>
  );
}
