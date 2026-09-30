import { Breadcrumb, PageHead } from '@/components/ui';
import { assetBaseUrl } from '@/lib/config';
import CatalogueForm from '@/components/CatalogueForm';

export default function Page() {
  return (
    <div className="dash">
      <Breadcrumb items={[{ label: 'Categories', href: '/categories' }, { label: 'Add category' }]} />
      <PageHead title="Add category" />
      <CatalogueForm kind="category" assetBase={assetBaseUrl()} />
    </div>
  );
}
