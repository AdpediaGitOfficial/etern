import { Breadcrumb, PageHead } from '@/components/ui';
import { assetBaseUrl } from '@/lib/config';
import CatalogueForm from '@/components/CatalogueForm';

export default function Page() {
  return (
    <div className="dash">
      <Breadcrumb items={[{ label: 'Sub categories', href: '/sub-categories' }, { label: 'Add sub category' }]} />
      <PageHead title="Add sub category" />
      <CatalogueForm kind="subcategory" assetBase={assetBaseUrl()} />
    </div>
  );
}
