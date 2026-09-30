'use client';

import CatalogueList from '@/components/CatalogueList';
import { kindLabel } from '@/lib/kind';
import type { CourseMaterialRow } from '@/lib/types';

export default function CourseMaterialsList({ initial }: { initial: { rows: CourseMaterialRow[]; total: number } | null }) {
  return (
    <CatalogueList<CourseMaterialRow>
      noun="course material" base="/course-materials" endpoint="coursematerial" listPath="coursematerial/all" serverPaged
      nameOf={r => r.courseMaterialName} initial={initial}
      columns={[
        { header: 'Course material', cell: r => <strong>{r.courseMaterialName}</strong> },
        { header: 'Category', cell: r => r.subCategoryId?.categoryId?.categoryName ?? '—' },
        { header: 'Sub category', cell: r => r.subCategoryId?.subCategoryName ?? '—' },
        { header: 'Type', cell: r => kindLabel(r.type) },
      ]}
    />
  );
}
