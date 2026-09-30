import { NextRequest, NextResponse } from 'next/server';
import { sessionCookieName } from '@/lib/config';

/** Content-Security-Policy with a per-request nonce, so no inline script runs unless Next.js emitted it. */
function contentSecurityPolicy(nonce: string): string {
  const dev = process.env.NODE_ENV !== 'production';
  let assetOrigin = '';
  try {
    assetOrigin = new URL(process.env.ASSET_BASE_URL || process.env.BACKEND_URL || '').origin;
  } catch {
    /* no asset host configured */
  }
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${dev ? " 'unsafe-eval'" : ''}`,
    "style-src 'self' 'unsafe-inline'", // Next.js injects small inline style blocks
    `img-src 'self' data: blob: ${assetOrigin}`.trim(),
    "font-src 'self'",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(dev ? [] : ['upgrade-insecure-requests']),
  ].join('; ');
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const hasSession = Boolean(req.cookies.get(sessionCookieName())?.value);

  // API calls get a JSON 401 (clients handle it) instead of a redirect to an HTML page.
  if (pathname.startsWith('/api/')) {
    if (!hasSession) return NextResponse.json({ message: 'Not signed in' }, { status: 401 });
    return NextResponse.next();
  }

  const nonce = btoa(crypto.randomUUID());
  const csp = contentSecurityPolicy(nonce);

  let res: NextResponse;
  if (!hasSession && pathname !== '/login') {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.search = '';
    res = NextResponse.redirect(url);
  } else if (hasSession && pathname === '/login') {
    const url = req.nextUrl.clone();
    url.pathname = '/dashboard';
    url.search = '';
    res = NextResponse.redirect(url);
  } else {
    // Next.js reads the nonce from the request's CSP header and stamps it on its own scripts.
    const headers = new Headers(req.headers);
    headers.set('Content-Security-Policy', csp);
    res = NextResponse.next({ request: { headers } });
  }
  res.headers.set('Content-Security-Policy', csp);
  return res;
}

export const config = {
  // Public: static assets, the sign-in/out endpoints (they must work without a session) and the health check.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|logo.png|api/auth|api/health).*)'],
};
