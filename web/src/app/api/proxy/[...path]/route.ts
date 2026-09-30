import { cookies } from 'next/headers';
import { backendUrl, sessionCookieName } from '@/lib/config';
import { HAS_BODY, isAllowed } from '@/lib/proxy';
import { forbidden, isSameSiteRequest } from '@/lib/security';

export const dynamic = 'force-dynamic';
const MAX_BODY = 3 * 1024 * 1024; // 2 MB image plus form fields
const PASS_THROUGH = ['content-type', 'content-disposition'];

async function handle(req: Request, ctx: { params: Promise<{ path: string[] }> }) {
  if (!isSameSiteRequest(req)) return forbidden();

  const token = (await cookies()).get(sessionCookieName())?.value;
  if (!token) return Response.json({ message: 'Not signed in' }, { status: 401 });

  const path = (await ctx.params).path.join('/');
  if (!isAllowed(req.method, path)) return Response.json({ message: 'Not found' }, { status: 404 });

  const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
  const init: RequestInit & { duplex?: 'half' } = { method: req.method, headers, cache: 'no-store', signal: AbortSignal.timeout(30_000) };

  if (HAS_BODY.has(req.method)) {
    // A missing or bad length is refused too, so a client cannot stream an unbounded body.
    const length = Number(req.headers.get('content-length'));
    if (!Number.isFinite(length) || length < 0 || length > MAX_BODY) {
      return Response.json({ message: 'The upload is too large.' }, { status: 413 });
    }
    const ct = req.headers.get('content-type');
    if (ct) headers['Content-Type'] = ct;
    init.body = req.body;
    init.duplex = 'half';
  }

  let res: Response;
  try {
    res = await fetch(`${backendUrl()}/api/${path}${new URL(req.url).search}`, init);
  } catch {
    return Response.json({ message: 'The server is unreachable.' }, { status: 502 });
  }

  const out = new Headers({ 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
  for (const h of PASS_THROUGH) {
    const v = res.headers.get(h);
    if (v) out.set(h, v);
  }
  return new Response(res.body, { status: res.status, headers: out });
}

export { handle as GET, handle as POST, handle as PUT, handle as DELETE };
