import { ShellProvider } from '@/components/ShellProvider';
import Topbar from '@/components/Topbar';
import { authedGet } from '@/lib/server';
import type { Paged } from '@/lib/types';
import Sidebar from './Sidebar';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // Badge on "Upcoming Expiry". If this small call fails, the badge is simply left out.
  const expiring = await authedGet<Paged<unknown>>('student/allAdmin?page=1&limit=1&segment=expiring');
  const expiringCount = expiring.ok ? expiring.data?.totalCount ?? 0 : 0;

  return (
    <ShellProvider>
      <div className="shell">
        <Sidebar expiringCount={expiringCount} />
        <div className="shell-main">
          <Topbar />
          <main className="content">{children}</main>
        </div>
      </div>
    </ShellProvider>
  );
}
