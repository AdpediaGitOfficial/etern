import { Breadcrumb, PageHead } from '@/components/ui';
import PackageForm from '../PackageForm';

export default function Page() {
  return (
    <div className="dash">
      <Breadcrumb items={[{ label: 'Packages', href: '/packages' }, { label: 'Add package' }]} />
      <PageHead title="Add package" />
      <PackageForm />
    </div>
  );
}
