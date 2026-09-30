import Link from 'next/link';
import { Breadcrumb, PageHead } from '@/components/ui';
import { authedGet } from '@/lib/server';
import type { Paged, Payment } from '@/lib/types';
import { Suspense } from 'react';
import AddedBanner from './AddedBanner';
import PaymentsList from './PaymentsList';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const r = await authedGet<Paged<Payment>>('subscription/offlinepayments?mode=offline&page=1&limit=10');
  return (
    <div className="dash">
      <Breadcrumb items={[{ label: 'Offline payments' }]} />
      <PageHead title="Offline payments"><Link className="btn" href="/users">Find a student to add a payment</Link></PageHead>
      <Suspense><AddedBanner /></Suspense>
      <PaymentsList mode="offline" initial={r.ok ? r.data : null} />
    </div>
  );
}
