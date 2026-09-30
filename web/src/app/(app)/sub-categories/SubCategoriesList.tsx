'use client';

import CatalogueBrowser from '@/components/CatalogueBrowser';
import { subCategoryStatusForm } from '@/lib/catalogue';
import type { SubCategoryRow } from '@/lib/types';

export default function SubCategoriesList({ initial, notice, assetBase }: { initial: { rows: SubCategoryRow[]; total: number } | null; notice?: string; assetBase: string }) {
  return (
    <CatalogueBrowser<SubCategoryRow>
      noun="sub category" plural="sub categories" base="/sub-categories" endpoint="subcategory" listPath="subcategory/all" nameParam="subCategoryName" typeFilter={false}
      nameOf={r => r.subCategoryName} subOf={r => r.categoryId?.packageId?.packageName ? `Package: ${r.categoryId.packageId.packageName}` : (r.description?.trim() || 'No description')}
      parentHeader="Category" parentOf={r => r.categoryId?.categoryName ?? ''}
      statusForm={subCategoryStatusForm} assetBase={assetBase} initial={initial} notice={notice}
      panelExtra={r => [['Category', r.categoryId?.categoryName ?? '—'], ['Package', r.categoryId?.packageId?.packageName ?? '—']]}
    />
  );
}
