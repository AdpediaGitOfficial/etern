'use client';

import CatalogueList from '@/components/CatalogueList';
import { kindLabel } from '@/lib/kind';
import type { CategoryRow } from '@/lib/types';

export default function CategoriesList({ initial }: { initial: { rows: CategoryRow[]; total: number } | null }) {
  return (
    <CatalogueList<CategoryRow>
      noun="category" base="/categories" endpoint="category" listPath="category/all" serverPaged
      nameOf={r => r.categoryName} initial={initial}
      columns={[
        { header: 'Category', cell: r => <strong>{r.categoryName}</strong> },
        { header: 'Package', cell: r => r.packageId?.packageName ?? '—' },
        { header: 'Type', cell: r => kindLabel(r.type) },
      ]}
    />
  );
}
