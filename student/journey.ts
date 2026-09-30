import { AccessStatus, EXPIRING_DAYS } from '../subscription/accessRules';

/** Pure builder for the student timeline shown to admins. No database access, so it is easy to test. */

export type JourneyKind = 'joined' | 'learn' | 'paid' | 'ended' | 'warn' | 'now';

export interface JourneyEvent {
  at: string;
  kind: JourneyKind;
  title: string;
  detail: string;
}

export interface JourneyPurchase {
  boughtAt: Date | string;
  start: Date | string;
  end: Date | string;
  packageName: string;
  amount: number;
  mode: string;
}

export interface JourneyInput {
  joinedAt?: Date | string | null;
  firstViewAt?: Date | string | null;
  lastViewAt?: Date | string | null;
  viewCount: number;
  purchases: JourneyPurchase[];
  status: AccessStatus;
  daysLeft: number | null;
  now?: Date;
}

const t = (d: Date | string | null | undefined): number => (d ? new Date(d).getTime() : Number.NaN);
const iso = (d: Date | string): string => new Date(d).toISOString();
const inr = (n: number): string => `₹${Math.round(n).toLocaleString('en-IN')}`;
const title = (s: string): string => (s ? s[0].toUpperCase() + s.slice(1) : s);
const lengthOf = (start: Date | string, end: Date | string): string => {
  const days = Math.round((t(end) - t(start)) / 86400000);
  if (days >= 365 && days % 365 === 0) return `${days / 365} year${days === 365 ? '' : 's'}`;
  if (days >= 30 && days % 30 === 0) return `${days / 30} month${days === 30 ? '' : 's'}`;
  return `${days} days`;
};

export function buildTimeline(input: JourneyInput): JourneyEvent[] {
  const now = input.now ?? new Date();
  const events: JourneyEvent[] = [];
  if (input.joinedAt) events.push({ at: iso(input.joinedAt), kind: 'joined', title: 'Joined', detail: 'Signed up and added the student profile.' });
  if (input.firstViewAt) events.push({ at: iso(input.firstViewAt), kind: 'learn', title: 'Watched the first video', detail: 'First learning activity.' });

  const purchases = [...input.purchases].sort((a, b) => t(a.boughtAt) - t(b.boughtAt));
  purchases.forEach((p, i) => {
    events.push({
      at: iso(p.boughtAt), kind: 'paid', title: `${i === 0 ? 'Subscribed to' : 'Renewed'} ${p.packageName}, ${lengthOf(p.start, p.end)}`,
      detail: `${inr(p.amount)} paid ${p.mode.toLowerCase() === 'offline' ? 'offline' : `by ${title(p.mode)}`}. Runs to ${new Date(p.end).toISOString().slice(0, 10)}.`,
    });
  });
  const last = purchases.reduce<JourneyPurchase | null>((m, p) => (!m || t(p.end) > t(m.end) ? p : m), null);
  if (last && t(last.end) <= now.getTime()) {
    events.push({ at: iso(last.end), kind: 'ended', title: 'Plan ended', detail: 'Moved to the free version. Progress and history are kept.' });
  }

  if (input.lastViewAt && input.viewCount > 1) {
    events.push({ at: iso(input.lastViewAt), kind: 'learn', title: 'Last watched a video', detail: `${input.viewCount} videos viewed in total.` });
  }
  events.sort((a, b) => t(a.at) - t(b.at));

  if (input.status === 'expiring' && input.daysLeft !== null && input.daysLeft <= EXPIRING_DAYS) {
    events.push({ at: iso(now), kind: 'warn', title: `${input.daysLeft} day${input.daysLeft === 1 ? '' : 's'} left`, detail: 'The plan is about to end.' });
  } else {
    const label: Record<AccessStatus, string> = { subscribed: 'Subscribed', expiring: 'Subscribed', lapsed: 'Free version (plan ended)', free: 'Free version' };
    events.push({ at: iso(now), kind: 'now', title: label[input.status], detail: `${input.viewCount} video${input.viewCount === 1 ? '' : 's'} viewed so far.` });
  }
  return events;
}
