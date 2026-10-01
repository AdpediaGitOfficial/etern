import { cookies } from 'next/headers';
import { ShellProvider } from '@/components/ShellProvider';
import Topbar from '@/components/Topbar';
import { parseAccount, UNKNOWN_ACCOUNT } from '@/lib/account';
import { accountCookieName } from '@/lib/config';
import { authedGet } from '@/lib/server';
import type { Paged } from '@/lib/types';
import Sidebar from './Sidebar';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // Badge on "Upcoming Expiry". If this small call fails, the badge is simply left out.
  const expiring = await authedGet<Paged<unknown>>('student/allAdmin?page=1&limit=1&segment=expiring');
  const expiringCount = expiring.ok ? expiring.data?.totalCount ?? 0 : 0;

  // Sessions that began before this cookie existed still work; they just show a generic label.
  const account = parseAccount((await cookies()).get(accountCookieName())?.value) ?? UNKNOWN_ACCOUNT;

  return (
    <ShellProvider>
      <div className="shell">
        <Sidebar expiringCount={expiringCount} account={account} />
        <div className="shell-main">
          <Topbar />
          <main className="content">{children}</main>
        </div>
      </div>
    </ShellProvider>
  );
}
