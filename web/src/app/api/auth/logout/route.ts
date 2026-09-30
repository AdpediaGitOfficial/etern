import { cookieSecure, sessionCookieName } from '@/lib/config';
import { forbidden, isSameSiteRequest } from '@/lib/security';

function clear(location: string) {
  const headers = new Headers({ Location: location, 'Cache-Control': 'no-store' });
  headers.append(
    'Set-Cookie',
    `${sessionCookieName()}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax${cookieSecure() ? '; Secure' : ''}`,
  );
  return new Response(null, { status: 303, headers });
}

/** Sign-out button. */
export async function POST(req: Request) {
  if (!isSameSiteRequest(req)) return forbidden();
  return clear('/login');
}

/**
 * Used when the API rejects the stored token (expired or revoked). It only clears the cookie and redirects to a
 * fixed page, so it is safe to allow from any origin (a link from another site should still end at the login page).
 */
export async function GET() {
  return clear('/login?expired=1');
}
