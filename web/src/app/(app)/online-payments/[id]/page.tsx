import Link from 'next/link';
import { Breadcrumb, DetailList, PageHead, Pill } from '@/components/ui';
import { assetBaseUrl } from '@/lib/config';
import { fmtDate, inr } from '@/lib/format';
import { authedGet } from '@/lib/server';
import type { Payment } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function Detail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const r = await authedGet<Payment>(`subscription/${id}`);
  const crumbs = [{ label: 'Online payments', href: '/online-payments' }, { label: 'Details' }];

  if (!r.ok || !r.data) {
    return (
      <div className="dash">
        <Breadcrumb items={crumbs} />
        <div className="card"><div className="err" role="alert">
          <strong>{r.ok || r.status === 404 ? 'Payment not found' : 'We couldn’t load this payment.'}</strong>
          <span>{r.ok || r.status === 404 ? 'It may have been removed.' : 'The server didn’t respond. Your data is safe.'}</span>
          <Link className="btn" href="/online-payments">Back to Online payments</Link>
        </div></div>
      </div>
    );
  }

  const p = r.data;
  const status = p.paymentId?.status;
  const img = p.imageUrl ? assetBaseUrl() + p.imageUrl : null;
  return (
    <div className="dash">
      <Breadcrumb items={crumbs} />
      <PageHead title="Online payment details" />
      <div className="card">
        <DetailList items={[
          ['Student', p.studentId?.fullName],
          ['Package', p.packageId?.packageName],
          ['Amount', p.paymentId?.amount === undefined ? '—' : inr(p.paymentId.amount)],
          ['Status', status ? <Pill tone={/success|paid|complete/i.test(status) ? 'good' : /fail|declin/i.test(status) ? 'bad' : 'warn'}>{status}</Pill> : '—'],
          ['Payment reference', p.paymentId?.paymentRef],
          ['Payment date', fmtDate(p.paymentId?.paymentDate, 'medium')],
          ['Entry date', fmtDate(p.createdAt, 'medium')],
          ['Subscription start', fmtDate(p.subscriptionStartDate, 'medium')],
          ['Subscription end', fmtDate(p.subscriptionEndDate, 'medium')],
          ['Remarks', p.comment || 'N/A'],
        ]} />
        {img ? (
          <div className="proof">
            <h2>Payment proof</h2>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img} alt="Uploaded payment proof" />
          </div>
        ) : null}
        <div className="acts"><Link className="btn" href="/online-payments">Back</Link></div>
      </div>
    </div>
  );
}
