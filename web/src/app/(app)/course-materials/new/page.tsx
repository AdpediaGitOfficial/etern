import { Breadcrumb, PageHead } from '@/components/ui';
import { assetBaseUrl } from '@/lib/config';
import CourseMaterialForm from '../CourseMaterialForm';

export default function Page() {
  return (
    <div className="dash">
      <Breadcrumb items={[{ label: 'Course materials', href: '/course-materials' }, { label: 'Add course material' }]} />
      <PageHead title="Add course material" />
      <CourseMaterialForm assetBase={assetBaseUrl()} />
    </div>
  );
}
