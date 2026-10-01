export const dynamic = 'force-dynamic';

/** Load-balancer / container health check. Public, reveals nothing. */
export function GET() {
  return Response.json({ status: 'ok' }, { headers: { 'Cache-Control': 'no-store' } });
}
