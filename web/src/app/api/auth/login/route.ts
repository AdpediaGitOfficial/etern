import { NextResponse } from 'next/server';
import { SESSION_COOKIE, backendUrl, cookieSecure, sessionMaxAgeSeconds } from '@/lib/config';

export async function POST(req: Request) {
  let email = '';
  let password = '';
  try {
    const body = await req.json();
    email = typeof body.email === 'string' ? body.email.trim() : '';
    password = typeof body.password === 'string' ? body.password : '';
  } catch {
    /* fall through to validation error */
  }
  if (!email || !password) {
    return NextResponse.json({ message: 'Enter your email and password.' }, { status: 400 });
  }

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
  const token: string | undefined = data?.result?.token;
  if (!res.ok || !data?.success || !token) {
    const status = res.status >= 400 && res.status < 500 ? 401 : 502;
    return NextResponse.json(
      { message: status === 401 ? 'Incorrect email or password.' : 'Sign-in is unavailable right now.' },
      { status },
    );
  }

  const out = NextResponse.json({ ok: true });
  out.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: cookieSecure(),
    sameSite: 'lax',
    path: '/',
    maxAge: sessionMaxAgeSeconds(),
  });
  return out;
}
