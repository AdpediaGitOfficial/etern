/**
 * Request checks shared by the API route handlers.
 *
 * The session cookie is SameSite=Lax, which still travels on cross-site top-level GET navigations.
 * The backend has state-changing GET endpoints (e.g. unsubscribe), so every /api request must prove it
 * comes from this site.
 */
export function isSameSiteRequest(req: Request): boolean {
  const fetchSite = req.headers.get('sec-fetch-site');
  if (fetchSite) return fetchSite === 'same-origin' || fetchSite === 'none'; // 'none' = typed URL or bookmark

  // Older clients without Fetch Metadata: compare Origin (or Referer) with our own host.
  const source = req.headers.get('origin') ?? req.headers.get('referer');
  if (!source) return req.method === 'GET' || req.method === 'HEAD';
  const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host');
  try {
    return new URL(source).host === host;
  } catch {
    return false;
  }
}

/** Rightmost X-Forwarded-For entry: the one appended by our own load balancer, which a client cannot forge. */
export function clientIp(req: Request): string {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) return xff.split(',').map(s => s.trim()).filter(Boolean).pop() ?? 'unknown';
  return req.headers.get('x-real-ip') ?? 'unknown';
}

export const forbidden = () => Response.json({ message: 'Forbidden' }, { status: 403 });
