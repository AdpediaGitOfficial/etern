import { describe, expect, it } from 'vitest';
import { isIsoDay, isoDay, monthRange, usersLink } from './dates';

describe('dates', () => {
  it('monthRange runs from the 1st to today', () => {
    expect(monthRange(new Date(2026, 8, 30))).toEqual({ from: '2026-09-01', to: '2026-09-30' });
    expect(monthRange(new Date(2026, 0, 5))).toEqual({ from: '2026-01-01', to: '2026-01-05' });
  });
  it('isoDay pads and uses local time', () => {
    expect(isoDay(new Date(2026, 2, 4))).toBe('2026-03-04');
  });
  it('isIsoDay accepts only real yyyy-mm-dd values', () => {
    expect(isIsoDay('2026-09-30')).toBe(true);
    for (const bad of ['2026-9-3', '30-09-2026', '2026-13-40', '', undefined, 5, '2026-09-30<script>']) expect(isIsoDay(bad)).toBe(false);
  });
  it('usersLink builds a filtered link and skips empty filters', () => {
    expect(usersLink({})).toBe('/users');
    expect(usersLink({ subscription: 'true', from: '2026-09-01', to: '2026-09-30' })).toBe('/users?subscription=true&from=2026-09-01&to=2026-09-30');
    expect(usersLink({ q: 'a b&c' })).toBe('/users?q=a+b%26c');
  });
});

import { PRESETS, presetRange, previousPeriod, validRange } from './dates';

describe('period presets', () => {
  const now = new Date(2026, 8, 30, 15);
  it('each preset ends today', () => {
    expect(presetRange('month', now)).toEqual({ from: '2026-09-01', to: '2026-09-30' });
    expect(presetRange('7d', now)).toEqual({ from: '2026-09-24', to: '2026-09-30' });
    expect(presetRange('30d', now)).toEqual({ from: '2026-09-01', to: '2026-09-30' });
    expect(presetRange('90d', now)).toEqual({ from: '2026-07-03', to: '2026-09-30' });
    expect(presetRange('ytd', now)).toEqual({ from: '2026-01-01', to: '2026-09-30' });
    expect(PRESETS.map(p => p.key)).toEqual(['month', '7d', '30d', '90d', 'ytd']);
  });
  it('the previous period has the same length and ends the day before', () => {
    expect(previousPeriod({ from: '2026-09-24', to: '2026-09-30' })).toEqual({ from: '2026-09-17', to: '2026-09-23' });
    expect(previousPeriod({ from: '2026-09-01', to: '2026-09-30' })).toEqual({ from: '2026-08-02', to: '2026-08-31' });
    expect(previousPeriod({ from: '2026-03-01', to: '2026-03-03' })).toEqual({ from: '2026-02-26', to: '2026-02-28' });
  });
  it('validRange needs two real days in order, at most 366 apart', () => {
    expect(validRange('2026-09-01', '2026-09-30')).toBe(true);
    expect(validRange('2026-09-30', '2026-09-01')).toBe(false);
    expect(validRange('2024-01-01', '2026-01-01')).toBe(false);
    expect(validRange(null, '2026-09-01')).toBe(false);
    expect(validRange('2026-09-01', '2026-09-01<x>')).toBe(false);
  });
  it('usersLink carries the plan-bought range', () => {
    expect(usersLink({ subscribedFrom: '2026-09-01', subscribedTo: '2026-09-30' })).toBe('/users?subscribedFrom=2026-09-01&subscribedTo=2026-09-30');
    expect(usersLink({ segment: 'free', from: '2026-09-01', to: '2026-09-30' })).toBe('/users?segment=free&from=2026-09-01&to=2026-09-30');
  });
});
