import Link from 'next/link';
import { Breadcrumb, DetailList, PageHead, Pill } from '@/components/ui';
import { ageFrom, fmtDate, inr, isExpired } from '@/lib/format';
import { authedGet } from '@/lib/server';
import type { StudentDetail } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function UserDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const r = await authedGet<StudentDetail>(`student/${id}`);

  if (!r.ok || !r.data) {
    return (
      <div className="dash">
        <Breadcrumb items={[{ label: 'Users', href: '/users' }, { label: 'Student' }]} />
        <div className="card"><div className="err" role="alert">
          <strong>{r.ok || r.status === 404 ? 'Student not found' : 'We couldn’t load this student.'}</strong>
          <span>{r.ok || r.status === 404 ? 'They may have been deleted.' : 'The server didn’t respond. Your data is safe.'}</span>
          <Link className="btn" href="/users">Back to users</Link>
        </div></div>
      </div>
    );
  }

  const s = r.data;
  const exp = isExpired(s.subscriptionEndDate);
  const canPay = !s.subscribed || exp;
  const age = ageFrom(s.dob);

  return (
    <div className="dash">
      <Breadcrumb items={[{ label: 'Users', href: '/users' }, { label: s.fullName }]} />
      <PageHead title={s.fullName}>
        {canPay ? <Link className="btn primary" href={`/offline-payments/new?studentId=${s._id}&name=${encodeURIComponent(s.fullName)}`}>Add offline payment</Link> : null}
      </PageHead>
      <div className="card">
        <div className="pills">
          <Pill tone={s.subscribed && !exp ? 'good' : 'off'}>{s.subscribed ? (exp ? 'Subscription expired' : 'Subscribed') : 'Free user'}</Pill>
          <Pill tone={s.isActive ? 'good' : 'bad'}>{s.isActive ? 'Active' : 'Inactive'}</Pill>
        </div>
        <DetailList items={[
          ['Age', age === null ? '—' : String(age)],
          ['Date of birth', fmtDate(s.dob)],
          ['Mobile', s.userId?.mobileNumber],
          ['Email', s.userId?.email],
          ['Parent name', s.userId?.fullName],
          ['Subscription start', fmtDate(s.subscriptionStartDate)],
          ['Subscription end', fmtDate(s.subscriptionEndDate)],
          ['Joined', fmtDate(s.createdAt)],
        ]} />
      </div>
      <div className="card">
        <h2>Payment history</h2>
        {s.payments?.length ? (
          <div className="tw"><table className="tbl narrow">
            <thead><tr><th>#</th><th className="n">Amount</th><th>Payment date</th></tr></thead>
            <tbody>{s.payments.map((p, i) => (<tr key={i}><td>{i + 1}</td><td className="n">{inr(p.amount)}</td><td>{fmtDate(p.paymentDate)}</td></tr>))}</tbody>
          </table></div>
        ) : <div className="empty"><strong>No payments yet</strong><span>Payments made by this student will appear here.</span></div>}
      </div>
    </div>
  );
}
