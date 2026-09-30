import { describe, expect, it } from 'vitest';
import { buildTimeline } from '../../../student/journey';

const now = new Date('2026-09-30T10:00:00Z');
const d = (s: string) => new Date(s + 'T09:00:00Z');
const purchase = (start: string, end: string, extra = {}) => ({ boughtAt: d(start), start: d(start), end: d(end), packageName: 'Explorer', amount: 2999, mode: 'Razorpay', ...extra });

describe('buildTimeline', () => {
  it('a lapsed student shows the plan ending and the move to the free version', () => {
    const ev = buildTimeline({ joinedAt: d('2026-02-20'), firstViewAt: d('2026-02-21'), lastViewAt: d('2026-09-28'), viewCount: 58,
      purchases: [purchase('2026-03-18', '2026-09-14')], status: 'lapsed', daysLeft: -16, now });
    expect(ev.map(e => e.kind)).toEqual(['joined', 'learn', 'paid', 'ended', 'learn', 'now']);
    expect(ev[2].title).toBe('Subscribed to Explorer, 6 months');
    expect(ev[3].detail).toMatch(/free version/i);
    expect(ev.at(-1)?.title).toBe('Free version (plan ended)');
  });
  it('a renewal is worded as one, and only the last plan end counts as the end', () => {
    const ev = buildTimeline({ joinedAt: d('2025-01-01'), viewCount: 0,
      purchases: [purchase('2025-02-01', '2026-02-01', { mode: 'offline' }), purchase('2026-02-01', '2027-02-01')], status: 'subscribed', daysLeft: 124, now });
    expect(ev.filter(e => e.kind === 'paid').map(e => e.title)).toEqual(['Subscribed to Explorer, 1 year', 'Renewed Explorer, 1 year']);
    expect(ev.some(e => e.kind === 'ended')).toBe(false);
    expect(ev[1].detail).toMatch(/paid offline/);
  });
  it('a plan about to end warns with the days left', () => {
    const ev = buildTimeline({ joinedAt: d('2026-03-01'), viewCount: 5, purchases: [purchase('2026-04-05', '2026-10-05')], status: 'expiring', daysLeft: 5, now });
    expect(ev.at(-1)).toMatchObject({ kind: 'warn', title: '5 days left' });
  });
  it('a student who never paid is on the free version', () => {
    const ev = buildTimeline({ joinedAt: d('2026-09-21'), firstViewAt: d('2026-09-22'), viewCount: 1, purchases: [], status: 'free', daysLeft: null, now });
    expect(ev.map(e => e.kind)).toEqual(['joined', 'learn', 'now']);
    expect(ev.at(-1)?.title).toBe('Free version');
  });
});
