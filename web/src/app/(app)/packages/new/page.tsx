import { Breadcrumb, PageHead } from '@/components/ui';
import { firstOf } from '@/lib/entityPage';
import { authedGet } from '@/lib/server';
import type { PackageRow } from '@/lib/types';
import PackageForm from '../PackageForm';

export const dynamic = 'force-dynamic';

export default async function Page({ searchParams }: { searchParams: Promise<{ copy?: string }> }) {
  const { copy } = await searchParams;
  // "Duplicate" arrives as ?copy=<id>. Anything that is not a real id is ignored and the form starts empty.
  const source = copy && /^[0-9a-f]{24}$/i.test(copy) ? await authedGet<unknown>(`package/${copy}`) : null;
  const copyOf = source?.ok ? firstOf<PackageRow>(source.data) ?? undefined : undefined;
  return (
    <div className="dash">
      <Breadcrumb items={[{ label: 'Packages', href: '/packages' }, { label: copyOf ? 'Duplicate package' : 'Add package' }]} />
      <PageHead title={copyOf ? 'Duplicate package' : 'Create a package'} subtitle="Three quick steps. Nothing is shown to students until you switch it on." />
      <PackageForm copyOf={copyOf} />
    </div>
  );
}
