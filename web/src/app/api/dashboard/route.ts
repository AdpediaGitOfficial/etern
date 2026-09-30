import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { SESSION_COOKIE } from '@/lib/config';
import { isUnauthorised, loadDashboard } from '@/lib/dashboardData';

export const dynamic = 'force-dynamic';

export async function GET() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ message: 'Not signed in' }, { status: 401 });
  const data = await loadDashboard(token);
  if (isUnauthorised(data)) return NextResponse.json({ message: 'Session expired' }, { status: 401 });
  return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store' } });
}
