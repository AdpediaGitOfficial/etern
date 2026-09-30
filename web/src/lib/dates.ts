const pad = (n: number) => String(n).padStart(2, '0');

/** yyyy-mm-dd in the browser's local time. */
export const isoDay = (d: Date): string => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** From the 1st of this month to today, the window behind the dashboard's "this month" figures. */
export function monthRange(now = new Date()): { from: string; to: string } {
  return { from: isoDay(new Date(now.getFullYear(), now.getMonth(), 1)), to: isoDay(now) };
}

export const isIsoDay = (v: unknown): v is string => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v));

export type Preset = 'month' | '7d' | '30d' | '90d' | 'ytd';
export const PRESETS: { key: Preset; label: string; phrase: string; previous: string }[] = [
  { key: 'month', label: 'This month', phrase: 'this month', previous: 'the previous period' },
  { key: '7d', label: '7 days', phrase: 'in the last 7 days', previous: 'the 7 days before' },
  { key: '30d', label: '30 days', phrase: 'in the last 30 days', previous: 'the 30 days before' },
  { key: '90d', label: '90 days', phrase: 'in the last 90 days', previous: 'the 90 days before' },
  { key: 'ytd', label: 'Year to date', phrase: 'this year', previous: 'the previous period' },
];
export const isPreset = (v: unknown): v is Preset => PRESETS.some(p => p.key === v);

const addDays = (d: Date, n: number): Date => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

/** The days a preset covers, ending today. */
export function presetRange(preset: Preset, now = new Date()): { from: string; to: string } {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (preset === 'month') return monthRange(now);
  if (preset === 'ytd') return { from: isoDay(new Date(now.getFullYear(), 0, 1)), to: isoDay(today) };
  const days = preset === '7d' ? 7 : preset === '30d' ? 30 : 90;
  return { from: isoDay(addDays(today, -(days - 1))), to: isoDay(today) };
}

const dayNumber = (iso: string): number => Math.round(Date.parse(`${iso}T00:00:00Z`) / 86400000);
const fromDayNumber = (n: number): string => new Date(n * 86400000).toISOString().slice(0, 10);

/** The period of the same length that ends the day before `range` starts. */
export function previousPeriod(range: { from: string; to: string }): { from: string; to: string } {
  const len = dayNumber(range.to) - dayNumber(range.from) + 1;
  return { from: fromDayNumber(dayNumber(range.from) - len), to: fromDayNumber(dayNumber(range.from) - 1) };
}

/** True for two real days, in order, at most 366 days apart. The backend enforces the same limit. */
export function validRange(from: unknown, to: unknown): boolean {
  return isIsoDay(from) && isIsoDay(to) && from <= to && dayNumber(to) - dayNumber(from) + 1 <= 366;
}

export interface UsersFilters { subscription?: 'true' | 'false'; segment?: string; status?: 'true' | 'false'; from?: string; to?: string; q?: string; subscribedFrom?: string; subscribedTo?: string }

/** Link into the Users list with filters applied. Empty values are left out. */
export function usersLink(filters: UsersFilters): string {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(filters)) if (v) p.set(k, v);
  const qs = p.toString();
  return qs ? `/users?${qs}` : '/users';
}
