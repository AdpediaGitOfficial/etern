import { cookies } from 'next/headers';
import { SESSION_COOKIE, backendUrl } from '@/lib/config';
import { isAllowed } from '@/lib/proxy';

export const dynamic = 'force-dynamic';
const MAX_BODY = 3 * 1024 * 1024; // 2 MB image plus form fields

async function handle(req: Request, ctx: { params: Promise<{ path: string[] }> }) {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return Response.json({ message: 'Not signed in' }, { status: 401 });

  const path = (await ctx.params).path.join('/');
  if (!isAllowed(req.method, path)) return Response.json({ message: 'Not found' }, { status: 404 });

  const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
  const init: RequestInit & { duplex?: 'half' } = { method: req.method, headers, cache: 'no-store', signal: AbortSignal.timeout(30_000) };

  if (req.method === 'POST') {
    if (Number(req.headers.get('content-length') || 0) > MAX_BODY) {
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

  const out = new Headers();
  for (const h of ['content-type', 'content-disposition']) {
    const v = res.headers.get(h);
    if (v) out.set(h, v);
  }
  out.set('Cache-Control', 'no-store');
  return new Response(res.body, { status: res.status, headers: out });
}

export { handle as GET, handle as POST, handle as DELETE };
