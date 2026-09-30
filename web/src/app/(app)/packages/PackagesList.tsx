'use client';

import CatalogueList from '@/components/CatalogueList';
import type { PackageRow } from '@/lib/types';

export default function PackagesList({ initial }: { initial: { rows: PackageRow[]; total: number } | null }) {
  return (
    <CatalogueList<PackageRow>
      noun="package" base="/packages" endpoint="package" listPath="package/allAdmin" serverPaged={false}
      nameOf={r => r.packageName} initial={initial}
      columns={[
        { header: 'Package', cell: r => <strong>{r.packageName}</strong> },
        { header: 'Age', cell: r => `${r.ageFrom}–${r.ageTo} years` },
        { header: 'Description', cell: r => r.description || '—' },
      ]}
    />
  );
}
