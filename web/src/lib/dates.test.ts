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
