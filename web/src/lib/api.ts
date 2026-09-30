/** Browser-side helper for calls through /api/proxy. Sends the user to sign-in when the session has ended. */
export interface ApiResult<T = unknown> {
  ok: boolean;
  status: number;
  body: T | null;
  /** Best message to show the user when !ok. */
  message: string;
}

type BackendError = { message?: string; errors?: { msg?: string }[] };

export async function api<T = unknown>(path: string, init: RequestInit = {}, fallbackMessage = 'Something went wrong. Try again.'): Promise<ApiResult<T>> {
  try {
    const res = await fetch(`/api/proxy/${path}`, init);
    if (res.status === 401) {
      window.location.assign('/api/auth/logout');
      return { ok: false, status: 401, body: null, message: 'Your session ended.' };
    }
    const body = (await res.json().catch(() => null)) as (T & BackendError) | null;
    const message = res.ok ? '' : body?.errors?.[0]?.msg || body?.message || fallbackMessage;
    return { ok: res.ok, status: res.status, body, message };
  } catch (e) {
    if ((e as Error).name === 'AbortError') throw e;
    return { ok: false, status: 0, body: null, message: 'The server is unreachable. Try again.' };
  }
}

/** Downloads a file response (e.g. an Excel export) using the name from `filename`. */
export async function download(path: string, filename: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/proxy/${path}`);
    if (res.status === 401) { window.location.assign('/api/auth/logout'); return false; }
    if (!res.ok) return false;
    const blob = await res.blob();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
    return true;
  } catch {
    return false;
  }
}

/** Backend list endpoints return `{ data, totalCount }` when paged and a bare array otherwise. */
export function listOf<T>(result: unknown): T[] {
  if (Array.isArray(result)) return result as T[];
  const data = (result as { data?: unknown } | null)?.data;
  return Array.isArray(data) ? (data as T[]) : [];
}

export function totalOf(result: unknown): number {
  const total = (result as { totalCount?: unknown } | null)?.totalCount;
  return typeof total === 'number' ? total : listOf(result).length;
}
