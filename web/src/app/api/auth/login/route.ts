import { NextResponse } from 'next/server';
import { backendUrl, cookieSecure, sessionCookieName, sessionMaxAgeSeconds } from '@/lib/config';
import { RateLimiter } from '@/lib/rateLimit';
import { clientIp, forbidden, isSameSiteRequest } from '@/lib/security';

const MAX_BODY_BYTES = 4096; // a sign-in form is a few hundred bytes

// 10 attempts per 10 minutes for each address, and 5 per 10 minutes for each email.
const byIp = new RateLimiter(10, 10 * 60_000);
const byEmail = new RateLimiter(5, 10 * 60_000);

const tooMany = () => NextResponse.json({ message: 'Too many attempts. Wait a few minutes and try again.' }, { status: 429, headers: { 'Retry-After': '600' } });

export async function POST(req: Request) {
  if (!isSameSiteRequest(req)) return forbidden();
  if (Number(req.headers.get('content-length') ?? 0) > MAX_BODY_BYTES) {
    return NextResponse.json({ message: 'The request is too large.' }, { status: 413 });
  }

  let email = '';
  let password = '';
  try {
    const body = await req.json();
    email = typeof body.email === 'string' ? body.email.trim().slice(0, 254) : '';
    password = typeof body.password === 'string' ? body.password.slice(0, 256) : '';
  } catch {
    /* fall through to validation error */
  }
  if (!email || !password) {
    return NextResponse.json({ message: 'Enter your email and password.' }, { status: 400 });
  }

  const ip = clientIp(req);
  const emailKey = email.toLowerCase();
  if (!byIp.allow(ip) || !byEmail.allow(emailKey)) return tooMany();

  let res: Response;
  try {
    res = await fetch(`${backendUrl()}/api/user/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      cache: 'no-store',
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    return NextResponse.json({ message: 'The server is unreachable. Try again in a moment.' }, { status: 502 });
  }

  const data = await res.json().catch(() => ({}));
  const token: unknown = data?.result?.token;
  if (!res.ok || !data?.success || typeof token !== 'string' || !token) {
    const status = res.status >= 400 && res.status < 500 ? 401 : 502;
    return NextResponse.json(
      { message: status === 401 ? 'Incorrect email or password.' : 'Sign-in is unavailable right now.' },
      { status },
    );
  }

  byEmail.reset(emailKey);
  const out = NextResponse.json({ ok: true });
  out.cookies.set(sessionCookieName(), token, {
    httpOnly: true,
    secure: cookieSecure(),
    sameSite: 'lax',
    path: '/',
    maxAge: sessionMaxAgeSeconds(),
  });
  return out;
}
