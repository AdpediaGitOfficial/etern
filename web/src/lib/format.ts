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
