import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { backendGet, Result } from './backend';
import { sessionCookieName } from './config';

/** For server components: fetch with the session token; sign out if the API rejects it. */
export async function authedGet<T>(path: string): Promise<Result<T>> {
  const token = (await cookies()).get(sessionCookieName())?.value;
  if (!token) redirect('/login');
  const r = await backendGet<T>(path, token);
  if (!r.ok && (r.status === 401 || r.status === 403)) redirect('/api/auth/logout');
  return r;
}
