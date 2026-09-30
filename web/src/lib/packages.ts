import type { PackageRow } from './types';
import { minLength, positiveNumber } from './validate';

export const DURATIONS = [
  { days: 30, label: '1 month' },
  { days: 90, label: '3 months' },
  { days: 180, label: '6 months' },
  { days: 365, label: '1 year' },
  { days: 730, label: '2 years' },
  { days: 1095, label: '3 years' },
  { days: 1460, label: '4 years' },
  { days: 1825, label: '5 years' },
] as const;

export const AGE_PRESETS = [{ from: 1, to: 11, label: '1–11 years' }] as const;

/**
 * A plan's length in words. Plans are stored in days, and a subscription lasts exactly that many days from the day it is assigned,
 * so "1 year" is 365 days and "2 years" is 730 (leap days are not added).
 */
export function durationLabel(days: number): string {
  const preset = DURATIONS.find(d => d.days === days);
  if (preset) return preset.label;
  if (days > 0 && days % 365 === 0) return `${days / 365} years`;
  if (days > 0 && days % 30 === 0) return `${days / 30} months`;
  return `${days} day${days === 1 ? '' : 's'}`;
}

type Plan = { price: number; validity: number };

/** One-line pricing summary for the list: "₹1,499" or "From ₹1,499", plus "2 plans · 3 months, 1 year". */
export function planSummary(plans: Plan[] | undefined, money: (n: number) => string): { headline: string; detail: string } | null {
  if (!plans?.length) return null;
  const cheapest = Math.min(...plans.map(p => p.price));
  const byLength = [...plans].sort((a, b) => a.validity - b.validity);
  return {
    headline: `${plans.length > 1 ? 'From ' : ''}${money(cheapest)}`,
    detail: `${plans.length} ${plans.length === 1 ? 'plan' : 'plans'} · ${byLength.map(p => durationLabel(p.validity)).join(', ')}`,
  };
}

export interface PlanDraft { price: string; days: string }
export interface PackageDraft { name: string; ageFrom: string; ageTo: string; description: string; active: boolean; plans: PlanDraft[] }

/** New packages start with the standard 1–11 age group selected; it can be changed. */
export const emptyDraft = (): PackageDraft => ({ name: '', ageFrom: '1', ageTo: '11', description: '', active: true, plans: [{ price: '', days: '90' }] });

export function draftFrom(p: PackageRow, opts: { copy?: boolean } = {}): PackageDraft {
  return {
    name: opts.copy ? `Copy of ${p.packageName}` : p.packageName,
    ageFrom: String(p.ageFrom),
    ageTo: String(p.ageTo),
    description: p.description ?? '',
    active: opts.copy ? false : p.isActive,
    plans: (p.packageCosts ?? []).map(c => ({ price: String(c.price), days: String(c.validity) })),
  };
}

export function validateDraft(d: PackageDraft): Record<string, string> {
  const errors: Record<string, string> = {};
  const name = minLength(d.name, 3, 'package name');
  if (name) errors.name = name;
  const from = Number(d.ageFrom);
  const to = Number(d.ageTo);
  if (!(from >= 1) || !(to >= 1)) errors.age = 'Choose an age group or enter both ages.';
  else if (to < from) errors.age = '“To” age must not be below “From” age.';
  if (!d.plans.length) errors.plans = 'Add at least one plan.';
  d.plans.forEach((p, i) => {
    const price = positiveNumber(p.price, 'a price');
    if (price) errors[`price${i}`] = 'Enter the price for this plan.';
    if (positiveNumber(p.days, 'days')) errors[`days${i}`] = 'Enter how many days the plan lasts.';
  });
  return errors;
}

/**
 * Body for POST/PUT /package. Plans carry only price and validity: the old "sold from / until" dates are never read by the
 * backend, so they are no longer collected.
 */
export function toPayload(d: PackageDraft) {
  return {
    packageName: d.name.trim(),
    ageFrom: Number(d.ageFrom),
    ageTo: Number(d.ageTo),
    description: d.description.trim(),
    isActive: d.active,
    packageCosts: d.plans.map(p => ({ price: Number(p.price), validity: Number(p.days) })),
  };
}

/**
 * The backend replaces ALL plans on every update, and deletes them when none are sent. A status change therefore has to
 * resend the existing plans unchanged.
 */
export function statusPayload(p: PackageRow, isActive: boolean) {
  return toPayload({ ...draftFrom(p), active: isActive });
}
