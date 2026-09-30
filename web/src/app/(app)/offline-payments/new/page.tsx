import Link from 'next/link';
import { Breadcrumb, PageHead } from '@/components/ui';
import PaymentForm from './PaymentForm';

export default async function NewOfflinePayment({ searchParams }: { searchParams: Promise<{ studentId?: string; name?: string }> }) {
  const { studentId, name } = await searchParams;
  const valid = Boolean(studentId && /^[0-9a-fA-F]{24}$/.test(studentId));
  return (
    <div className="dash">
      <Breadcrumb items={[{ label: 'Offline payments', href: '/offline-payments' }, { label: 'Add payment' }]} />
      <PageHead title="Add offline payment" />
      {valid ? (
        <PaymentForm studentId={studentId as string} studentName={name || 'Student'} />
      ) : (
        <div className="card"><div className="empty">
          <strong>Choose a student first</strong>
          <span>Offline payments are added from a student’s row in Users.</span>
          <Link className="btn primary" href="/users">Go to users</Link>
        </div></div>
      )}
    </div>
  );
}
