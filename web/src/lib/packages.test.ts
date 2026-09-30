import { describe, expect, it } from 'vitest';
import { draftFrom, durationLabel, emptyDraft, planSummary, statusPayload, toPayload, validateDraft } from './packages';
import type { PackageRow } from './types';

const inr = (n: number) => `₹${n}`;
const pkg = (over: Partial<PackageRow> = {}): PackageRow => ({
  _id: 'a'.repeat(24), packageName: 'Explorer', ageFrom: 6, ageTo: 8, description: 'Core maths', isActive: true,
  packageCosts: [{ _id: 'c1', price: 1499, validity: 90, from: '2026-01-01T00:00:00.000Z', to: '2026-12-31T00:00:00.000Z' }, { price: 3999, validity: 365, from: '', to: '' }], ...over,
});

describe('durationLabel', () => {
  it('uses words for common lengths and falls back sensibly', () => {
    expect([30, 90, 180, 365].map(durationLabel)).toEqual(['1 month', '3 months', '6 months', '1 year']);
    expect([730, 60, 45, 1].map(durationLabel)).toEqual(['2 years', '2 months', '45 days', '1 day']);
  });
});

describe('planSummary', () => {
  it('shows the cheapest price and the plan lengths in order', () => {
    expect(planSummary(pkg().packageCosts, inr)).toEqual({ headline: 'From ₹1499', detail: '2 plans · 3 months, 1 year' });
    expect(planSummary([{ price: 2000, validity: 30 }], inr)).toEqual({ headline: '₹2000', detail: '1 plan · 1 month' });
  });
  it('is null when there are no plans', () => {
    expect(planSummary([], inr)).toBeNull();
    expect(planSummary(undefined, inr)).toBeNull();
  });
});

describe('validateDraft', () => {
  it('accepts a complete package', () => {
    const d = { ...emptyDraft(), name: 'Champion', ageFrom: '9', ageTo: '12', plans: [{ price: '5999', days: '365' }] };
    expect(validateDraft(d)).toEqual({});
  });
  it('flags each missing piece', () => {
    const e = validateDraft(emptyDraft());
    expect(Object.keys(e).sort()).toEqual(['age', 'name', 'price0']);
  });
  it('rejects a reversed age range and non-positive prices or days', () => {
    const e = validateDraft({ ...emptyDraft(), name: 'Okay', ageFrom: '9', ageTo: '5', plans: [{ price: '0', days: '0' }, { price: '10', days: '30' }] });
    expect(e.age).toMatch(/not be below/);
    expect(e.price0).toBeTruthy();
    expect(e.days0).toBeTruthy();
    expect(e.price1).toBeUndefined();
  });
  it('requires at least one plan', () => {
    expect(validateDraft({ ...emptyDraft(), name: 'Okay', ageFrom: '1', ageTo: '2', plans: [] }).plans).toBeTruthy();
  });
});

describe('toPayload', () => {
  it('sends numbers, trims text, and NEVER sends sale dates', () => {
    const body = toPayload({ name: '  Champion  ', ageFrom: '9', ageTo: '12', description: ' hi ', active: false, plans: [{ price: '5999', days: '365' }] });
    expect(body).toEqual({ packageName: 'Champion', ageFrom: 9, ageTo: 12, description: 'hi', isActive: false, packageCosts: [{ price: 5999, validity: 365 }] });
    expect(JSON.stringify(body)).not.toMatch(/"(from|to)"/);
  });
});

describe('statusPayload', () => {
  it('flips only the status and resends every plan, because the backend deletes plans that are not sent', () => {
    const body = statusPayload(pkg(), false);
    expect(body.isActive).toBe(false);
    expect(body.packageCosts).toEqual([{ price: 1499, validity: 90 }, { price: 3999, validity: 365 }]);
    expect(body.packageName).toBe('Explorer');
  });
  it('a package with no plans still sends an (empty) list, never omits it', () => {
    expect(statusPayload(pkg({ packageCosts: undefined }), true).packageCosts).toEqual([]);
  });
});

describe('draftFrom', () => {
  it('copies as an inactive "Copy of …" without an id', () => {
    const d = draftFrom(pkg(), { copy: true });
    expect(d.name).toBe('Copy of Explorer');
    expect(d.active).toBe(false);
    expect(d.plans).toEqual([{ price: '1499', days: '90' }, { price: '3999', days: '365' }]);
  });
  it('ignores legacy from/to dates, including missing ones', () => {
    expect(draftFrom(pkg()).plans.every(p => Object.keys(p).sort().join() === 'days,price')).toBe(true);
  });
});
