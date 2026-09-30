import { backendUrl } from './config';

export type Result<T> = { ok: true; data: T } | { ok: false; status: number };

/** GET {BACKEND_URL}/api/{path} with the admin bearer token. Never throws: failures become { ok: false }. */
export async function backendGet<T>(path: string, token: string): Promise<Result<T>> {
  try {
    const res = await fetch(`${backendUrl()}/api/${path}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return { ok: false, status: res.status };
    const body = (await res.json()) as { result?: T };
    return { ok: true, data: body.result as T };
  } catch {
    return { ok: false, status: 0 };
  }
}
