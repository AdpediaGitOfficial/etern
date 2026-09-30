import Link from 'next/link';
import { Breadcrumb, PageHead } from '@/components/ui';
import { listOf } from '@/lib/api';
import { authedGet } from '@/lib/server';
import type { PackageRow } from '@/lib/types';
import PackagesList from './PackagesList';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const r = await authedGet<unknown>('package/allAdmin');
  const rows = r.ok ? listOf<PackageRow>(r.data) : null;
  return (
    <div className="dash">
      <Breadcrumb items={[{ label: 'Packages' }]} />
      <PageHead title="Packages"><Link className="btn primary" href="/packages/new">+ Add package</Link></PageHead>
      <PackagesList initial={rows ? { rows, total: rows.length } : null} />
    </div>
  );
}
