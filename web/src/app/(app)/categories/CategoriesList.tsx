'use client';

import CatalogueBrowser from '@/components/CatalogueBrowser';
import { categoryStatusForm } from '@/lib/catalogue';
import type { CategoryRow } from '@/lib/types';

export default function CategoriesList({ initial, notice, assetBase }: { initial: { rows: CategoryRow[]; total: number } | null; notice?: string; assetBase: string }) {
  return (
    <CatalogueBrowser<CategoryRow>
      noun="category" plural="categories" base="/categories" endpoint="category" listPath="category/all" nameParam="categoryName" typeFilter
      nameOf={r => r.categoryName} subOf={r => r.description?.trim() || 'No description'}
      parentHeader="Package" parentOf={r => r.packageId?.packageName ?? ''}
      statusForm={categoryStatusForm} assetBase={assetBase} initial={initial} notice={notice}
      panelExtra={r => [['Package', r.packageId?.packageName ?? '—']]}
    />
  );
}
