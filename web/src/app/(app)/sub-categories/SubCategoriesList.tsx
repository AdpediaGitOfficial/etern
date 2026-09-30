'use client';

import CatalogueList from '@/components/CatalogueList';
import { kindLabel } from '@/lib/kind';
import type { SubCategoryRow } from '@/lib/types';

export default function SubCategoriesList({ initial }: { initial: { rows: SubCategoryRow[]; total: number } | null }) {
  return (
    <CatalogueList<SubCategoryRow>
      noun="sub category" base="/sub-categories" endpoint="subcategory" listPath="subcategory/all" serverPaged
      nameOf={r => r.subCategoryName} initial={initial}
      columns={[
        { header: 'Sub category', cell: r => <strong>{r.subCategoryName}</strong> },
        { header: 'Category', cell: r => r.categoryId?.categoryName ?? '—' },
        { header: 'Package', cell: r => r.categoryId?.packageId?.packageName ?? '—' },
        { header: 'Type', cell: r => kindLabel(r.type) },
      ]}
    />
  );
}
