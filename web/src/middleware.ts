import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE } from '@/lib/config';

export function middleware(req: NextRequest) {
  const hasSession = Boolean(req.cookies.get(SESSION_COOKIE)?.value);
  const { pathname } = req.nextUrl;

  // API calls get a JSON 401 (clients handle it) instead of a redirect to an HTML page.
  if (!hasSession && pathname.startsWith('/api/')) {
    return NextResponse.json({ message: 'Not signed in' }, { status: 401 });
  }
  if (!hasSession && pathname !== '/login') {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.search = '';
    return NextResponse.redirect(url);
  }
  if (hasSession && pathname === '/login') {
    const url = req.nextUrl.clone();
    url.pathname = '/dashboard';
    url.search = '';
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|logo.png|api/auth).*)'],
};
