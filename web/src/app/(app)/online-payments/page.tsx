import { Breadcrumb, PageHead } from '@/components/ui';
import { authedGet } from '@/lib/server';
import type { Paged, Payment } from '@/lib/types';
import PaymentsList from '../offline-payments/PaymentsList';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const r = await authedGet<Paged<Payment>>('subscription/offlinepayments?mode=online&page=1&limit=10');
  return (
    <div className="dash">
      <Breadcrumb items={[{ label: 'Online payments' }]} />
      <PageHead title="Online payments"></PageHead>
      <PaymentsList mode="online" initial={r.ok ? r.data : null} />
    </div>
  );
}
