'use client';

import CatalogueBrowser from '@/components/CatalogueBrowser';
import { courseMaterialStatusForm } from '@/lib/catalogue';
import { kindLabel } from '@/lib/kind';
import type { CourseMaterialRow } from '@/lib/types';

export default function CourseMaterialsList({ initial, notice, assetBase }: { initial: { rows: CourseMaterialRow[]; total: number } | null; notice?: string; assetBase: string }) {
  const where = (r: CourseMaterialRow) => [r.subCategoryId?.categoryId?.categoryName, r.subCategoryId?.subCategoryName].filter(Boolean).join(' › ');
  return (
    <CatalogueBrowser<CourseMaterialRow>
      noun="course material" plural="course materials" base="/course-materials" endpoint="coursematerial" listPath="coursematerial/all" nameParam="courseMaterialName"
      typeFilter={false} searchable={false}
      nameOf={r => r.courseMaterialName} subOf={r => kindLabel(r.type)}
      parentHeader="Category › Sub category" parentOf={where}
      media={{ linkHeader: 'Video link', linkOf: r => r.courseMaterialUrl }}
      statusForm={courseMaterialStatusForm} assetBase={assetBase} initial={initial} notice={notice}
      panelExtra={r => [['Category', r.subCategoryId?.categoryId?.categoryName ?? '—'], ['Sub category', r.subCategoryId?.subCategoryName ?? '—']]}
    />
  );
}
