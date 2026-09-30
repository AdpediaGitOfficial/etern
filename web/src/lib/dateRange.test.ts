import { describe, expect, it } from 'vitest';
import { currentMonth, dayKeys, growthPercent, lastDays, lastMonth, ordinalDay, parseDateRange, previousRange, rangeDays } from '../../../common/dateRange';

describe('parseDateRange', () => {
  it('uses the default when nothing is sent', () => expect(parseDateRange()).toEqual({ range: null }));
  it('reads whole days as UTC, first day start to last day end', () => {
    const r = parseDateRange('2026-09-01', '2026-09-30').range!;
    expect(r.from.toISOString()).toBe('2026-09-01T00:00:00.000Z');
    expect(r.to.toISOString()).toBe('2026-09-30T23:59:59.999Z');
    expect(rangeDays(r)).toBe(30);
  });
  it('rejects half a range, junk, impossible dates, reversed and huge ranges', () => {
    expect(parseDateRange('2026-09-01').error).toMatch(/both/);
    expect(parseDateRange('x', '2026-09-01').error).toMatch(/YYYY-MM-DD/);
    expect(parseDateRange('2026-02-30', '2026-03-01').error).toMatch(/real dates/);
    expect(parseDateRange('2026-09-10', '2026-09-01').error).toMatch(/after/);
    expect(parseDateRange('2024-01-01', '2026-01-01').error).toMatch(/366/);
    expect(parseDateRange(['2026-09-01'], '2026-09-02').error).toBeDefined();
  });
  it('allows a single day and a full year', () => {
    expect(rangeDays(parseDateRange('2026-09-01', '2026-09-01').range!)).toBe(1);
    expect(parseDateRange('2025-09-30', '2026-09-30').range).toBeTruthy();
  });
});

describe('previousRange', () => {
  it('is the same length and ends just before', () => {
    const r = parseDateRange('2026-09-01', '2026-09-30').range!;
    const p = previousRange(r);
    expect(rangeDays(p)).toBe(30);
    expect(p.to.getTime()).toBe(r.from.getTime() - 1);
    expect(p.from.toISOString()).toBe('2026-08-02T00:00:00.000Z');
  });
});

describe('default periods and day lists', () => {
  const now = new Date(2026, 8, 30, 10);
  it('current and last month', () => {
    expect(currentMonth(now).from.getMonth()).toBe(8);
    expect(currentMonth(now).to.getDate()).toBe(30);
    expect(lastMonth(now).from.getMonth()).toBe(7);
    expect(lastMonth(now).to.getDate()).toBe(31);
  });
  it('last 10 days includes today and lists each day once', () => {
    const r = lastDays(10, new Date('2026-09-30T10:00:00Z'));
    const keys = dayKeys(r);
    expect(keys).toHaveLength(10);
    expect(keys[0]).toBe('2026-09-21');
    expect(keys.at(-1)).toBe('2026-09-30');
  });
  it('spans month ends', () => {
    expect(dayKeys(parseDateRange('2026-02-27', '2026-03-02').range!)).toEqual(['2026-02-27', '2026-02-28', '2026-03-01', '2026-03-02']);
  });
});

describe('labels and growth', () => {
  it('ordinal days', () => {
    expect(['2026-09-01', '2026-09-02', '2026-09-03', '2026-09-04', '2026-09-11', '2026-09-12', '2026-09-13', '2026-09-21', '2026-09-22', '2026-09-23', '2026-10-31'].map(ordinalDay))
      .toEqual(['1st', '2nd', '3rd', '4th', '11th', '12th', '13th', '21st', '22nd', '23rd', '31st']);
  });
  it('growth against the previous period', () => {
    expect(growthPercent(150, 100)).toBe(50);
    expect(growthPercent(50, 100)).toBe(-50);
    expect(growthPercent(10, 0)).toBe(100);
    expect(growthPercent(0, 0)).toBe(0);
  });
});
