import { Breadcrumb } from '@/components/ui';
import { firstOf, LoadProblem } from '@/lib/entityPage';
import { authedGet } from '@/lib/server';
import type { PackageRow } from '@/lib/types';
import PackageDetail from './PackageDetail';

export const dynamic = 'force-dynamic';

export default async function Detail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const r = await authedGet<unknown>(`package/${id}`);
  const p = r.ok ? firstOf<PackageRow>(r.data) : null;
  if (!p) return <LoadProblem result={r} plural="Packages" base="/packages" noun="Package" />;

  return (
    <div className="dash">
      <Breadcrumb items={[{ label: 'Packages', href: '/packages' }, { label: p.packageName }]} />
      <PackageDetail initial={p} />
    </div>
  );
}
