import { describe, expect, it } from 'vitest';
import { ago, nudgeFor } from './journeyView';
import type { Journey } from './types';

const now = new Date('2026-09-30T10:00:00Z');
const daysAgo = (n: number) => new Date(now.getTime() - n * 86400000).toISOString();
const base = (over: Partial<Journey['access']>, m: Partial<Journey['metrics']> = {}): Journey => ({
  student: { _id: '1', fullName: 'A', gender: '', avatar: '', isActive: true, createdAt: daysAgo(100), parent: { name: '', mobileNumber: null, email: '' } },
  access: { subscribed: false, accessStatus: 'free', isFreeVersion: true, daysLeft: null, packageId: '', packageName: '', subscriptionStartDate: null, subscriptionEndDate: null,
    freeVersion: { enabled: true, perSubCategory: 1 }, totalVideos: 118, openVideos: 14, ...over },
  metrics: { videosViewed: 0, videosViewedAllTime: 0, completionPercent: 0, activeDaysLast30: 0, firstActivityAt: null, lastActivityAt: null, ...m },
  learning: { categories: [], recent: [] }, subscriptions: [], timeline: [],
});

describe('ago', () => {
  it('words recent activity', () => {
    expect(ago(daysAgo(0), now)).toBe('Today');
    expect(ago(daysAgo(1), now)).toBe('Yesterday');
    expect(ago(daysAgo(5), now)).toBe('5 days ago');
    expect(ago(null, now)).toBe('No activity yet');
  });
});

describe('nudgeFor', () => {
  it('asks to renew when the plan is about to end', () => {
    const n = nudgeFor(base({ accessStatus: 'expiring', daysLeft: 5, subscribed: true, isFreeVersion: false, openVideos: 118 }, { activeDaysLast30: 13 }), now);
    expect(n).toMatchObject({ tone: 'warn', title: 'Plan ends in 5 days', cta: 'Renew plan' });
  });
  it('spots a lapsed student who is still active', () => {
    const n = nudgeFor(base({ accessStatus: 'lapsed', subscriptionEndDate: daysAgo(12) }, { lastActivityAt: daysAgo(2) }), now);
    expect(n?.tone).toBe('bad');
    expect(n?.text).toMatch(/still engaged/);
    expect(n?.text).toMatch(/104 videos are locked/);
  });
  it('does not call a quiet lapsed student engaged', () => {
    expect(nudgeFor(base({ accessStatus: 'lapsed', subscriptionEndDate: daysAgo(60) }, { lastActivityAt: daysAgo(40) }), now)?.text).toMatch(/No recent activity/);
  });
  it('notices a free student who finished every free video', () => {
    expect(nudgeFor(base({}, { videosViewed: 14 }), now)?.title).toBe('Finished every free video');
    expect(nudgeFor(base({}, { videosViewed: 3 }), now)).toBeNull();
  });
  it('says nothing for a healthy subscriber', () => {
    expect(nudgeFor(base({ accessStatus: 'subscribed', subscribed: true, daysLeft: 200 }), now)).toBeNull();
  });
});
