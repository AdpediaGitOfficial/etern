import { Breadcrumb, PageHead } from '@/components/ui';
import { assetBaseUrl } from '@/lib/config';
import SubCategoryForm from '../SubCategoryForm';

export default function Page() {
  return (
    <div className="dash">
      <Breadcrumb items={[{ label: 'Sub categories', href: '/sub-categories' }, { label: 'Add sub category' }]} />
      <PageHead title="Add sub category" />
      <SubCategoryForm assetBase={assetBaseUrl()} />
    </div>
  );
}
