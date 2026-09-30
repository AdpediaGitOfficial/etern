import Link from 'next/link';
import { Breadcrumb, DetailList, PageHead, Pill } from '@/components/ui';
import { firstOf, LoadProblem } from '@/lib/entityPage';
import { inr } from '@/lib/format';
import { durationLabel } from '@/lib/packages';
import { authedGet } from '@/lib/server';
import type { PackageRow } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function Detail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const r = await authedGet<unknown>(`package/${id}`);
  const p = r.ok ? firstOf<PackageRow>(r.data) : null;
  if (!p) return <LoadProblem result={r} plural="Packages" base="/packages" noun="Package" />;

  return (
    <div className="dash">
      <Breadcrumb items={[{ label: 'Packages', href: '/packages' }, { label: p.packageName }]} />
      <PageHead title={p.packageName}>
        <Link className="btn" href={`/packages/new?copy=${p._id}`}>Duplicate</Link>
        <Link className="btn primary" href={`/packages/${p._id}/edit`}>Edit</Link>
      </PageHead>
      <div className="card">
        <DetailList items={[
          ['Age group', `${p.ageFrom}–${p.ageTo} years`],
          ['Status', <Pill key="s" tone={p.isActive ? 'good' : 'off'}>{p.isActive ? 'Active' : 'Inactive'}</Pill>],
          ['Description', p.description || 'N/A'],
        ]} />
      </div>
      <div className="card">
        <h2>Plans</h2>
        {p.packageCosts?.length ? (
          <div className="tw"><table className="tbl narrow">
            <thead><tr><th>Length</th><th className="n">Price</th></tr></thead>
            <tbody>{p.packageCosts.map((c, i) => <tr key={c._id ?? i}><td>{durationLabel(c.validity)}</td><td className="n">{inr(c.price)}</td></tr>)}</tbody>
          </table></div>
        ) : <div className="empty"><strong>No plans yet</strong><span>Edit the package to add one.</span></div>}
      </div>
    </div>
  );
}
