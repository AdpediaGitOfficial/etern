import { SESSION_COOKIE, cookieSecure } from '@/lib/config';

function clear(location: string) {
  const headers = new Headers({ Location: location });
  headers.append(
    'Set-Cookie',
    `${SESSION_COOKIE}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax${cookieSecure() ? '; Secure' : ''}`,
  );
  return new Response(null, { status: 303, headers });
}

/** Sign out button. */
export async function POST() {
  return clear('/login');
}

/** Used when the API rejects the stored token (expired or revoked). */
export async function GET() {
  return clear('/login?expired=1');
}
