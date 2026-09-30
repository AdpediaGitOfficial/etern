import { describe, expect, it } from 'vitest';
import { ageFrom, completionClass, durationSeconds, fmtDate, inr, isExpired, normaliseGrowth, num } from './format';

describe('format helpers', () => {
  it('groups digits the Indian way', () => {
    expect(inr(184500)).toBe('₹1,84,500');
    expect(num(1248)).toBe('1,248');
    expect(num(undefined)).toBe('0');
  });

  it('treats a null/NaN/Infinity growth as "no comparison" instead of 0%', () => {
    expect(normaliseGrowth(null)).toBeNull();
    expect(normaliseGrowth(undefined)).toBeNull();
    expect(normaliseGrowth('abc')).toBeNull();
    expect(normaliseGrowth(Infinity)).toBeNull();
    expect(normaliseGrowth(0)).toBe(0);
    expect(normaliseGrowth('12.4')).toBe(12.4);
  });

  it('formats dates in UTC so server and browser agree', () => {
    expect(fmtDate('2026-09-30T23:30:00.000Z')).toBe('30-09-2026');
    expect(fmtDate('2026-09-30T23:30:00.000Z', 'medium')).toBe('30 Sept 2026');
    expect(fmtDate(null)).toBe('—');
    expect(fmtDate('garbage')).toBe('—');
  });

  it('isExpired / ageFrom / durationSeconds / completionClass', () => {
    expect(isExpired('2000-01-01')).toBe(true);
    expect(isExpired('2999-01-01')).toBe(false);
    expect(isExpired(null)).toBe(false);
    expect(ageFrom(undefined)).toBeNull();
    expect(ageFrom('not a date')).toBeNull();
    expect(durationSeconds('01:02:03')).toBe(3723);
    expect(durationSeconds('45:10')).toBe(2710);
    expect(durationSeconds('n/a')).toBe(0);
    expect([59, 60, 40, 39].map(completionClass)).toEqual(['mid', 'good', 'mid', 'low']);
  });
});
