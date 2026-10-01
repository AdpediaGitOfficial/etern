import { describe, expect, it } from 'vitest';
import { endsWhen, isRunning, statusOf } from './access';

const now = new Date('2026-09-30T10:00:00Z');
const inDays = (n: number) => new Date(now.getTime() + n * 86400000).toISOString();

describe('statusOf', () => {
  it('trusts the backend when it sends a status', () => {
    expect(statusOf({ accessStatus: 'lapsed', subscribed: true, subscriptionEndDate: inDays(30) }, now)).toBe('lapsed');
  });
  it('works it out from the dates for older responses, ignoring a stale flag', () => {
    expect(statusOf({ subscribed: true, subscriptionEndDate: inDays(30) }, now)).toBe('subscribed');
    expect(statusOf({ subscribed: true, subscriptionEndDate: inDays(3) }, now)).toBe('expiring');
    expect(statusOf({ subscribed: true, subscriptionEndDate: inDays(-2) }, now)).toBe('lapsed');
    expect(statusOf({ subscribed: false }, now)).toBe('free');
  });
  it('running means subscribed or expiring', () => {
    expect(isRunning('expiring')).toBe(true);
    expect(isRunning('lapsed')).toBe(false);
  });
});

describe('endsWhen', () => {
  it('words the distance to the end date', () => {
    expect(endsWhen(inDays(5), now)).toBe('in 5 days');
    expect(endsWhen(inDays(1), now)).toBe('in 1 day');
    expect(endsWhen(inDays(0), now)).toBe('today');
    expect(endsWhen(inDays(-12), now)).toBe('12 days ago');
    // part of a day: "5 days left" beside "in 5 days", and 12 full days gone reads the same both ways
    expect(endsWhen(new Date(now.getTime() + 4.3 * 86400000).toISOString(), now)).toBe('in 5 days');
    expect(endsWhen(new Date(now.getTime() - 12.3 * 86400000).toISOString(), now)).toBe('12 days ago');
    expect(endsWhen(null, now)).toBe('');
  });
});

import { conversion } from './access';

describe('conversion', () => {
  const stats = (over = {}) => ({ registeredThisMonth: 10, freeUsersThisMonth: 6, newStudentsSubscribed: 4, ...over });
  it('compares the students who joined in the period with themselves', () => {
    expect(conversion(stats())).toEqual({ registered: 10, withPlan: 4, stillFree: 6, percent: 40 });
  });
  it('never passes 100%, even when renewals outnumber new students', () => {
    // 50 renewals, 2 new students, 1 of whom bought: the old sum would have read 2500%.
    const c = conversion(stats({ registeredThisMonth: 2, newStudentsSubscribed: 1, freeUsersThisMonth: 1 }))!;
    expect(c.percent).toBe(50);
    expect(c.withPlan + c.stillFree).toBe(c.registered);
  });
  it('falls back for an older backend that omits the field', () => {
    expect(conversion({ registeredThisMonth: 10, freeUsersThisMonth: 6 })).toEqual({ registered: 10, withPlan: 4, stillFree: 6, percent: 40 });
  });
  it('no registrations means no rate', () => {
    expect(conversion(stats({ registeredThisMonth: 0, freeUsersThisMonth: 0, newStudentsSubscribed: 0 }))!.percent).toBeNull();
    expect(conversion(null)).toBeNull();
  });
});
