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
    expect(endsWhen(null, now)).toBe('');
  });
});
