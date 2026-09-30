import Link from 'next/link';
import { Breadcrumb, PageHead } from '@/components/ui';
import { listOf } from '@/lib/api';
import { authedGet } from '@/lib/server';
import type { PackageRow } from '@/lib/types';
import PackagesList from './PackagesList';

export const dynamic = 'force-dynamic';

const NOTICES: Record<string, string> = { created: 'Package created.', saved: 'Changes saved.', deleted: 'Package deleted.' };

export default async function Page({ searchParams }: { searchParams: Promise<{ notice?: string }> }) {
  const { notice } = await searchParams;
  const r = await authedGet<unknown>('package/allAdmin');
  const rows = r.ok ? listOf<PackageRow>(r.data) : null;
  const active = rows?.filter(p => p.isActive).length ?? 0;
  return (
    <div className="dash">
      <Breadcrumb items={[{ label: 'Packages' }]} />
      <PageHead title="Packages" subtitle={rows ? `${rows.length} ${rows.length === 1 ? 'package' : 'packages'} · ${active} active` : undefined}>
        <Link className="btn primary" href="/packages/new"><span aria-hidden="true">+</span> Add package</Link>
      </PageHead>
      <PackagesList initial={rows} notice={notice ? NOTICES[notice] : undefined} />
    </div>
  );
}
