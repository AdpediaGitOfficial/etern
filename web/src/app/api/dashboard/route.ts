import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { sessionCookieName } from '@/lib/config';
import { isUnauthorised, loadDashboard } from '@/lib/dashboardData';
import { validRange } from '@/lib/dates';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const token = (await cookies()).get(sessionCookieName())?.value;
  if (!token) return NextResponse.json({ message: 'Not signed in' }, { status: 401 });
  // A period is optional. Anything that is not two real days in order (at most 366 apart) is refused, never passed on.
  const sp = new URL(req.url).searchParams;
  const from = sp.get('from');
  const to = sp.get('to');
  if ((from || to) && !validRange(from, to)) return NextResponse.json({ message: 'Invalid date range' }, { status: 400 });
  const data = await loadDashboard(token, { range: from && to ? { from, to } : undefined, compare: sp.get('compare') === '1' });
  if (isUnauthorised(data)) return NextResponse.json({ message: 'Session expired' }, { status: 401 });
  return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store' } });
}
