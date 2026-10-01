import { NextResponse } from 'next/server';
import { backendUrl, cookieSecure, sessionCookieName, sessionMaxAgeSeconds } from '@/lib/config';
import { forbidden, isSameSiteRequest } from '@/lib/security';

/**
 * Changing the signed-in admin's password.
 *
 * This does not go through /api/proxy for two reasons: the body carries
 * credentials, so it stays off the general-purpose path; and a successful change
 * returns a new token that has to be written into the httpOnly session cookie,
 * which the proxy cannot do.
 *
 * The backend refuses every token issued before the change, so without swapping
 * the cookie here the admin would be signed out by their own action.
 */
export async function POST(req: Request) {
  if (!isSameSiteRequest(req)) return forbidden();

  const token = req.headers.get('cookie')?.match(new RegExp(`${sessionCookieName()}=([^;]+)`))?.[1];
  if (!token) return NextResponse.json({ message: 'Your session ended.' }, { status: 401 });

  let body: { currentPassword?: unknown; newPassword?: unknown };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ message: 'Could not read the request.' }, { status: 400 });
  }
  const currentPassword = typeof body.currentPassword === 'string' ? body.currentPassword.slice(0, 256) : '';
  const newPassword = typeof body.newPassword === 'string' ? body.newPassword.slice(0, 256) : '';
  if (!currentPassword || !newPassword) {
    return NextResponse.json({ message: 'Enter your current and new password.' }, { status: 400 });
  }

  let res: Response;
  try {
    res = await fetch(`${backendUrl()}/api/user/change-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${decodeURIComponent(token)}` },
      body: JSON.stringify({ currentPassword, newPassword }),
      cache: 'no-store',
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    return NextResponse.json({ message: 'The server is unreachable. Try again in a moment.' }, { status: 502 });
  }

  const data = (await res.json().catch(() => ({}))) as {
    message?: string;
    errors?: { msg?: string }[];
    result?: { token?: unknown };
  };

  if (!res.ok) {
    // The backend names the exact problem ("Your current password is incorrect",
    // or which password rule failed); pass that through rather than flattening it.
    const message = data?.errors?.[0]?.msg || data?.message || 'Could not change the password.';
    return NextResponse.json({ message }, { status: res.status === 401 ? 401 : 400 });
  }

  const out = NextResponse.json({ ok: true, message: data?.message ?? 'Password changed.' });
  const fresh = data?.result?.token;
  if (typeof fresh === 'string' && fresh) {
    out.cookies.set(sessionCookieName(), fresh, {
      httpOnly: true,
      secure: cookieSecure(),
      sameSite: 'lax',
      path: '/',
      maxAge: sessionMaxAgeSeconds(),
    });
  }
  return out;
}
