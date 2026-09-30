import { Breadcrumb, PageHead } from '@/components/ui';
import { assetBaseUrl } from '@/lib/config';
import CategoryForm from '../CategoryForm';

export default function Page() {
  return (
    <div className="dash">
      <Breadcrumb items={[{ label: 'Categories', href: '/categories' }, { label: 'Add category' }]} />
      <PageHead title="Add category" />
      <CategoryForm assetBase={assetBaseUrl()} />
    </div>
  );
}
