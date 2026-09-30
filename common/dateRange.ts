/**
 * Date ranges for the admin dashboard. Pure functions with no database access.
 * Ranges arrive as whole days (YYYY-MM-DD) and are read as UTC, from the start of the first day to the end of the last.
 */

export interface DateRange {
  from: Date;
  to: Date;
}

export const MAX_RANGE_DAYS = 366;
const DAY_MS = 24 * 60 * 60 * 1000;
const DAY = /^\d{4}-\d{2}-\d{2}$/;

export const dayKey = (d: Date): string => d.toISOString().slice(0, 10);

function parseDay(v: unknown): Date | null {
  if (typeof v !== 'string' || !DAY.test(v)) return null;
  const d = new Date(`${v}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) || dayKey(d) !== v ? null : d;
}

export type RangeResult = { range: DateRange | null; error?: undefined } | { range?: undefined; error: string };

/** No `from` and `to` means "use the default period". Both are needed together. */
export function parseDateRange(from?: unknown, to?: unknown): RangeResult {
  if (from === undefined && to === undefined) return { range: null };
  if (from === undefined || to === undefined) return { error: 'Send both from and to, or neither.' };
  const start = parseDay(from);
  const end = parseDay(to);
  if (!start || !end) return { error: 'from and to must be real dates written as YYYY-MM-DD.' };
  if (start.getTime() > end.getTime()) return { error: 'from must not be after to.' };
  const days = Math.round((end.getTime() - start.getTime()) / DAY_MS) + 1;
  if (days > MAX_RANGE_DAYS) return { error: `The range can be at most ${MAX_RANGE_DAYS} days.` };
  return { range: { from: start, to: new Date(end.getTime() + DAY_MS - 1) } };
}

export const rangeDays = (r: DateRange): number => Math.round((r.to.getTime() - r.from.getTime() + 1) / DAY_MS);

/** The period of the same length that ends just before this one starts. */
export function previousRange(r: DateRange): DateRange {
  const ms = r.to.getTime() - r.from.getTime() + 1;
  return { from: new Date(r.from.getTime() - ms), to: new Date(r.from.getTime() - 1) };
}

/** The current calendar month (server local time), the dashboard's original default. */
export function currentMonth(now: Date = new Date()): DateRange {
  return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999) };
}

/** The calendar month before the current one. */
export function lastMonth(now: Date = new Date()): DateRange {
  return { from: new Date(now.getFullYear(), now.getMonth() - 1, 1), to: new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999) };
}

/** The last `n` days including today (UTC days). */
export function lastDays(n: number, now: Date = new Date()): DateRange {
  const today = new Date(`${dayKey(now)}T00:00:00.000Z`);
  return { from: new Date(today.getTime() - (n - 1) * DAY_MS), to: new Date(today.getTime() + DAY_MS - 1) };
}

/** Every day in the range, as YYYY-MM-DD, oldest first. */
export function dayKeys(r: DateRange): string[] {
  const out: string[] = [];
  for (let t = new Date(`${dayKey(r.from)}T00:00:00.000Z`).getTime(); t <= r.to.getTime(); t += DAY_MS) out.push(dayKey(new Date(t)));
  return out;
}

/** "1st", "2nd", "23rd", "11th": the label the dashboard chart has always used. */
export function ordinalDay(key: string): string {
  const day = Number(key.slice(8, 10));
  const suffix = day === 1 || day === 21 || day === 31 ? 'st' : day === 2 || day === 22 ? 'nd' : day === 3 || day === 23 ? 'rd' : 'th';
  return `${day}${suffix}`;
}

/** Growth against the previous period, in percent. 100 when there was nothing before and there is something now. */
export function growthPercent(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return parseFloat((((current - previous) / previous) * 100).toFixed(2));
}
