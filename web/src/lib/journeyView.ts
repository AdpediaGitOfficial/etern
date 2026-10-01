import { endsWhen, isRunning } from './access';
import type { Journey } from './types';

export interface Nudge { tone: 'warn' | 'bad' | 'brand'; title: string; text: string; cta?: string }

const DAY = 86400000;
const daysSince = (iso: string | null, now: Date): number | null => (iso ? Math.floor((now.getTime() - new Date(iso).getTime()) / DAY) : null);

/** "Today", "Yesterday", "5 days ago". Empty when there was no activity. */
export function ago(iso: string | null | undefined, now: Date = new Date()): string {
  const d = daysSince(iso ?? null, now);
  if (d === null) return 'No activity yet';
  if (d <= 0) return 'Today';
  if (d === 1) return 'Yesterday';
  return `${d} days ago`;
}

/** The one thing an admin should notice about this student, or null when nothing needs doing. */
export function nudgeFor(j: Journey, now: Date = new Date()): Nudge | null {
  const { access, metrics } = j;
  const last = daysSince(metrics.lastActivityAt, now);
  const locked = Math.max(0, access.totalVideos - access.openVideos);
  if (access.accessStatus === 'expiring') {
    const n = access.daysLeft ?? 0;
    return { tone: 'warn', title: `Plan ends in ${n} day${n === 1 ? '' : 's'}`, cta: 'Renew plan',
      text: `${metrics.activeDaysLast30} active days in the last 30. Renewing adds the new days after the current end date, so no paid day is lost.` };
  }
  if (access.accessStatus === 'lapsed') {
    const engaged = last !== null && last <= 14;
    return { tone: 'bad', title: `Plan ended ${endsWhen(access.subscriptionEndDate)}`, cta: 'Add payment',
      text: `${engaged ? `Watched a video ${ago(metrics.lastActivityAt, now).toLowerCase()}, so the family is still engaged.` : 'No recent activity.'}${locked ? ` ${locked} videos are locked.` : ''} Progress is kept.` };
  }
  if (access.accessStatus === 'free' && access.openVideos > 0 && metrics.videosViewed >= access.openVideos) {
    return { tone: 'brand', title: 'Finished every free video', cta: 'Add payment', text: 'A good time to ask the family about a plan.' };
  }
  return null;
}

export const timelineWhen = (iso: string, kind: string, now: Date = new Date()): string => (kind === 'now' ? 'Today' : ago(iso, now) === 'Today' ? 'Today' : new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }));

export { isRunning };
