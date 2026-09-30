import Link from 'next/link';
import { Breadcrumb, DetailList, PageHead, Pill } from '@/components/ui';
import { firstOf, LoadProblem } from '@/lib/entityPage';
import { fmtDate, inr } from '@/lib/format';
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
      <PageHead title={p.packageName}><Link className="btn primary" href={`/packages/${p._id}/edit`}>Edit</Link></PageHead>
      <div className="card">
        <DetailList items={[
          ['Age range', `${p.ageFrom}–${p.ageTo} years`],
          ['Status', <Pill key="s" tone={p.isActive ? 'good' : 'off'}>{p.isActive ? 'Active' : 'Inactive'}</Pill>],
          ['Description', p.description || 'N/A'],
        ]} />
      </div>
      <div className="card">
        <h2>Prices</h2>
        {p.packageCosts?.length ? (
          <div className="tw"><table className="tbl narrow">
            <thead><tr><th className="n">Price</th><th className="n">Validity (days)</th><th>Sold from</th><th>Sold until</th></tr></thead>
            <tbody>{p.packageCosts.map((c, i) => (
              <tr key={c._id ?? i}><td className="n">{inr(c.price)}</td><td className="n">{c.validity}</td><td>{fmtDate(c.from, 'medium')}</td><td>{fmtDate(c.to, 'medium')}</td></tr>
            ))}</tbody>
          </table></div>
        ) : <div className="empty"><strong>No prices set</strong><span>Edit the package to add one.</span></div>}
      </div>
    </div>
  );
}
