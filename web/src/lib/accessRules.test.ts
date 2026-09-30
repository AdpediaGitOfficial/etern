import { describe, expect, it } from 'vitest';
import { accessInfo, accessStatus, daysLeft, freeMaterialIds, freeVersionSettings, hasActivePlan, nextPlanWindow, withAccess } from '../../../subscription/accessRules';

const now = new Date('2026-09-30T10:00:00Z');
const inDays = (n: number) => new Date(now.getTime() + n * 86400000);

describe('plan status from dates', () => {
  it('a running plan is subscribed, and expiring in the last 7 days', () => {
    expect(accessStatus({ subscribed: true, subscriptionEndDate: inDays(100) }, now)).toBe('subscribed');
    expect(accessStatus({ subscribed: true, subscriptionEndDate: inDays(7) }, now)).toBe('expiring');
    expect(accessStatus({ subscribed: true, subscriptionEndDate: inDays(0.2) }, now)).toBe('expiring');
  });
  it('a stale flag after the end date means lapsed, not subscribed', () => {
    const s = { subscribed: true, subscriptionEndDate: inDays(-1) };
    expect(hasActivePlan(s, now)).toBe(false);
    expect(accessStatus(s, now)).toBe('lapsed');
    expect(accessInfo(s, now)).toMatchObject({ subscribed: false, isFreeVersion: true, accessStatus: 'lapsed' });
  });
  it('an admin-ended plan is lapsed and a student with no plan is free', () => {
    expect(accessStatus({ subscribed: false, subscriptionEndDate: inDays(-2) }, now)).toBe('lapsed');
    expect(accessStatus({ subscribed: false }, now)).toBe('free');
    expect(accessStatus({}, now)).toBe('free');
  });
  it('a future date without the flag is not active', () => {
    expect(hasActivePlan({ subscribed: false, subscriptionEndDate: inDays(30) }, now)).toBe(false);
  });
  it('counts days left and days since ending', () => {
    expect(daysLeft({ subscriptionEndDate: inDays(5) }, now)).toBe(5);
    expect(daysLeft({ subscriptionEndDate: inDays(-12) }, now)).toBe(-12);
    expect(daysLeft({}, now)).toBeNull();
  });
  it('withAccess replaces the stored flag', () => {
    const out = withAccess({ subscribed: true, subscriptionEndDate: inDays(-3), fullName: 'A' }, now);
    expect(out.subscribed).toBe(false);
    expect(out.fullName).toBe('A');
  });
});

describe('renewing', () => {
  it('buying while a plan runs adds the days after the current end', () => {
    const w = nextPlanWindow({ subscribed: true, subscriptionStartDate: inDays(-355), subscriptionEndDate: inDays(10) }, 365, now);
    expect(w.extended).toBe(true);
    expect(w.purchaseStart.getTime()).toBe(inDays(10).getTime());
    expect(Math.round((w.purchaseEnd.getTime() - now.getTime()) / 86400000)).toBe(375);
    expect(w.studentStart.getTime()).toBe(inDays(-355).getTime());
  });
  it('buying a different package does not stack on the old one', () => {
    const running = { subscribed: true, packageId: 'explorer', subscriptionStartDate: inDays(-100), subscriptionEndDate: inDays(265) };
    const other = nextPlanWindow(running, 30, now, 'premium');
    expect(other.extended).toBe(false);
    expect(other.purchaseStart.getTime()).toBe(now.getTime());
    expect(Math.round((other.purchaseEnd.getTime() - now.getTime()) / 86400000)).toBe(30);
    const same = nextPlanWindow(running, 30, now, 'explorer');
    expect(same.extended).toBe(true);
    expect(Math.round((same.purchaseEnd.getTime() - now.getTime()) / 86400000)).toBe(295);
  });
  it('buying after a plan ended starts today', () => {
    const w = nextPlanWindow({ subscribed: true, subscriptionEndDate: inDays(-3) }, 30, now);
    expect(w.extended).toBe(false);
    expect(w.purchaseStart.getTime()).toBe(now.getTime());
    expect(Math.round((w.purchaseEnd.getTime() - now.getTime()) / 86400000)).toBe(30);
  });
  it('a first purchase starts today', () => {
    const w = nextPlanWindow({}, 90, now);
    expect(w.extended).toBe(false);
    expect(w.studentStart.getTime()).toBe(now.getTime());
  });
});

describe('free version', () => {
  it('is off unless switched on, with one video per sub category by default', () => {
    expect(freeVersionSettings({})).toEqual({ enabled: false, perSubCategory: 1 });
    expect(freeVersionSettings({ FREE_VERSION: 'on', FREE_VIDEOS_PER_SUBCATEGORY: '2' })).toEqual({ enabled: true, perSubCategory: 2 });
    expect(freeVersionSettings({ FREE_VIDEOS_PER_SUBCATEGORY: 'x' }).perSubCategory).toBe(1);
    expect(freeVersionSettings({ FREE_VIDEOS_PER_SUBCATEGORY: '0' }).perSubCategory).toBe(0);
  });
  it('keeps the first video of each sub category by show order', () => {
    const m = [
      { _id: 'a3', subCategoryId: 'A', sorting: 3 }, { _id: 'a1', subCategoryId: 'A', sorting: 1 }, { _id: 'a2', subCategoryId: 'A', sorting: 2 },
      { _id: 'b2', subCategoryId: 'B', sorting: 2 }, { _id: 'b1', subCategoryId: 'B', sorting: 1 },
    ];
    expect([...freeMaterialIds(m, 1)].sort()).toEqual(['a1', 'b1']);
    expect([...freeMaterialIds(m, 2)].sort()).toEqual(['a1', 'a2', 'b1', 'b2']);
    expect(freeMaterialIds(m, 0).size).toBe(0);
  });
  it('breaks ties in the order given', () => {
    const m = [{ _id: 'x', subCategoryId: 'A', sorting: 1 }, { _id: 'y', subCategoryId: 'A', sorting: 1 }];
    expect([...freeMaterialIds(m, 1)]).toEqual(['x']);
  });
});

describe('daysLeft rounding', () => {
  it('counts a part day as a day left and only whole days as gone', () => {
    const end = (h: number) => ({ subscriptionEndDate: new Date(now.getTime() + h * 3600000) });
    expect(daysLeft(end(4.3 * 24), now)).toBe(5);    // shown as "5 days left"
    expect(daysLeft(end(-12.3 * 24), now)).toBe(-12); // shown as "12 days since it ended"
    expect(daysLeft(end(5 * 24), now)).toBe(5);
  });
});
