import { cookies } from 'next/headers';
import { parseAccount, UNKNOWN_ACCOUNT } from '@/lib/account';
import { accountCookieName } from '@/lib/config';
import SettingsView from './SettingsView';

export const metadata = { title: 'Settings · Etern Admin' };

export default async function SettingsPage() {
  const account = parseAccount((await cookies()).get(accountCookieName())?.value) ?? UNKNOWN_ACCOUNT;
  return <SettingsView account={account} />;
}
