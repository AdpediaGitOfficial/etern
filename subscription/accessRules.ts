/**
 * Who can open what, worked out from dates. Pure functions with no database access, so the same rules
 * serve the student app, the admin panel and the tests.
 *
 * - A plan is running when the student is flagged subscribed AND the end date is in the future. The flag alone
 *   is never trusted, because nothing switches it off when the date passes.
 * - Free version: the first FREE_VIDEOS_PER_SUBCATEGORY videos of every sub category stay open. The rest lock.
 * - Renewing while a plan runs adds the new days after the current end date.
 */

export const EXPIRING_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;

export type AccessStatus = 'subscribed' | 'expiring' | 'lapsed' | 'free';

export interface PlanFields {
  packageId?: string | null;
  subscribed?: boolean | null;
  subscriptionStartDate?: Date | string | null;
  subscriptionEndDate?: Date | string | null;
}

const time = (d?: Date | string | null): number | null => {
  if (!d) return null;
  const t = new Date(d).getTime();
  return Number.isNaN(t) ? null : t;
};

/** True while the student's plan is running. */
export function hasActivePlan(s: PlanFields, now: Date = new Date()): boolean {
  const end = time(s.subscriptionEndDate);
  return s.subscribed === true && end !== null && end > now.getTime();
}

/**
 * Days left on a running plan, or a negative number of days since it ended. Null when there never was a plan.
 * Rounded one way for both: part of a day still counts as a day left, and only whole days count as gone,
 * so "5 days left" and "12 days ago" never disagree with the date shown beside them.
 */
export function daysLeft(s: PlanFields, now: Date = new Date()): number | null {
  const end = time(s.subscriptionEndDate);
  if (end === null) return null;
  return Math.ceil((end - now.getTime()) / DAY_MS);
}

export function accessStatus(s: PlanFields, now: Date = new Date()): AccessStatus {
  if (hasActivePlan(s, now)) return (daysLeft(s, now) ?? 0) <= EXPIRING_DAYS ? 'expiring' : 'subscribed';
  return time(s.subscriptionEndDate) !== null ? 'lapsed' : 'free';
}

export interface AccessInfo {
  /** Worked out from the dates. Replaces the stored flag in every outgoing response. */
  subscribed: boolean;
  accessStatus: AccessStatus;
  isFreeVersion: boolean;
  daysLeft: number | null;
}

export function accessInfo(s: PlanFields, now: Date = new Date()): AccessInfo {
  const active = hasActivePlan(s, now);
  return { subscribed: active, accessStatus: accessStatus(s, now), isFreeVersion: !active, daysLeft: daysLeft(s, now) };
}

/** Adds the derived access fields to a student. The stored flag is overridden so a stale "subscribed: true" never reaches a client. */
export function withAccess<T extends PlanFields>(student: T, now: Date = new Date()): T & AccessInfo {
  return { ...student, ...accessInfo(student, now) };
}

const addDays = (from: Date, days: number): Date => {
  const d = new Date(from.getTime());
  d.setDate(d.getDate() + days);
  return d;
};

export interface PlanWindow {
  /** Where this purchase starts. The current end date when a plan is still running, otherwise now. */
  purchaseStart: Date;
  purchaseEnd: Date;
  /** What the student record shows: the original start when extending, otherwise now. */
  studentStart: Date;
  extended: boolean;
}

/**
 * Dates for a purchase of `validityDays`. A running plan is extended, so no paid day is lost, but only when the
 * purchase is for the same package. Buying a different package starts from today, as it always did: stacking would
 * give the new (possibly dearer) package for the days already paid on the old one.
 */
export function nextPlanWindow(s: PlanFields, validityDays: number, now: Date = new Date(), packageId?: string): PlanWindow {
  const active = hasActivePlan(s, now) && (packageId === undefined || String(s.packageId ?? '') === String(packageId));
  const purchaseStart = active ? new Date(s.subscriptionEndDate as Date | string) : new Date(now.getTime());
  const original = time(s.subscriptionStartDate);
  return {
    purchaseStart,
    purchaseEnd: addDays(purchaseStart, validityDays),
    studentStart: active && original !== null ? new Date(original) : new Date(now.getTime()),
    extended: active,
  };
}

/** Free-version settings, read from the environment so it can be switched on when the app shows locks. */
export function freeVersionSettings(env: Record<string, string | undefined> = process.env): { enabled: boolean; perSubCategory: number } {
  const n = Number.parseInt(env.FREE_VIDEOS_PER_SUBCATEGORY ?? '', 10);
  return { enabled: env.FREE_VERSION === 'on', perSubCategory: Number.isFinite(n) && n >= 0 ? n : 1 };
}

/** Ids of the videos that stay open on the free version: the first `limit` of each sub category by show order. */
export function freeMaterialIds(materials: { _id?: unknown; subCategoryId: unknown; sorting?: number }[], limit: number): Set<string> {
  const bySub = new Map<string, { id: string; sorting: number; pos: number }[]>();
  materials.forEach((m, pos) => {
    const key = String(m.subCategoryId);
    const list = bySub.get(key) ?? [];
    list.push({ id: String(m._id), sorting: m.sorting ?? 0, pos });
    bySub.set(key, list);
  });
  const free = new Set<string>();
  bySub.forEach(list => {
    list.sort((a, b) => a.sorting - b.sorting || a.pos - b.pos).slice(0, limit).forEach(x => free.add(x.id));
  });
  return free;
}
