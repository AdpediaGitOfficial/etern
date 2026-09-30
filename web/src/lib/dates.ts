const pad = (n: number) => String(n).padStart(2, '0');

/** yyyy-mm-dd in the browser's local time. */
export const isoDay = (d: Date): string => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** From the 1st of this month to today, the window behind the dashboard's "this month" figures. */
export function monthRange(now = new Date()): { from: string; to: string } {
  return { from: isoDay(new Date(now.getFullYear(), now.getMonth(), 1)), to: isoDay(now) };
}

export const isIsoDay = (v: unknown): v is string => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v));

/** Link into the Users list with filters applied. Empty values are left out. */
export function usersLink(filters: { subscription?: 'true' | 'false'; status?: 'true' | 'false'; from?: string; to?: string; q?: string }): string {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(filters)) if (v) p.set(k, v);
  const qs = p.toString();
  return qs ? `/users?${qs}` : '/users';
}
