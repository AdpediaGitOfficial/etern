const inrFmt = new Intl.NumberFormat('en-IN');

export const num = (n: number | null | undefined): string => inrFmt.format(n || 0);
export const inr = (n: number | null | undefined): string => '₹' + inrFmt.format(n || 0);

/** Growth arrives as null when last month's revenue was zero (Infinity/NaN serialise to null). */
export function normaliseGrowth(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export function durationSeconds(d: string): number {
  const parts = String(d || '').split(':').map(Number);
  if (!parts.length || parts.some(Number.isNaN)) return 0;
  return parts.reduce((acc, p) => acc * 60 + p, 0);
}

export const completionClass = (p: number): 'good' | 'mid' | 'low' => (p >= 60 ? 'good' : p >= 40 ? 'mid' : 'low');

/** Fixed locale and UTC so server and browser render the same text. */
export function fmtDate(iso?: string | null, style: 'numeric' | 'medium' = 'numeric'): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  if (style === 'medium') return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getUTCDate())}-${p(d.getUTCMonth() + 1)}-${d.getUTCFullYear()}`;
}

export function isExpired(iso?: string | null): boolean {
  return Boolean(iso) && new Date(iso as string) < new Date();
}

export function ageFrom(dob?: string): number | null {
  if (!dob) return null;
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return age;
}
