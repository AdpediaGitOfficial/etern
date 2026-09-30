import type { Pill } from '@/components/ui';

/** How a student's plan is shown everywhere in the admin panel. The backend sends `accessStatus`; the fallback keeps older responses working. */
export type AccessStatus = 'subscribed' | 'expiring' | 'lapsed' | 'free';

export const EXPIRING_DAYS = 7;

export const STATUS_LABEL: Record<AccessStatus, string> = { subscribed: 'Subscribed', expiring: 'Expiring soon', lapsed: 'Free (plan ended)', free: 'Free' };
export const STATUS_TONE: Record<AccessStatus, Parameters<typeof Pill>[0]['tone']> = { subscribed: 'good', expiring: 'warn', lapsed: 'lock', free: 'off' };

interface Planish { accessStatus?: AccessStatus; subscribed?: boolean; subscriptionEndDate?: string | null }

export function statusOf(s: Planish, now: Date = new Date()): AccessStatus {
  if (s.accessStatus) return s.accessStatus;
  const end = s.subscriptionEndDate ? new Date(s.subscriptionEndDate).getTime() : null;
  if (s.subscribed && end !== null && end > now.getTime()) return (end - now.getTime()) / 86400000 <= EXPIRING_DAYS ? 'expiring' : 'subscribed';
  return end !== null ? 'lapsed' : 'free';
}

/** "in 5 days", "today", "12 days ago" for a plan end date. */
export function endsWhen(end: string | null | undefined, now: Date = new Date()): string {
  if (!end) return '';
  const days = Math.round((new Date(end).getTime() - now.getTime()) / 86400000);
  if (days === 0) return 'today';
  if (days > 0) return `in ${days} day${days === 1 ? '' : 's'}`;
  return `${-days} day${days === -1 ? '' : 's'} ago`;
}

/** A plan is running for the two "paying" states. */
export const isRunning = (s: AccessStatus): boolean => s === 'subscribed' || s === 'expiring';

/** Groups of students in the admin list. '' means everyone. */
export type Segment = '' | 'active' | 'expiring' | 'lapsed' | 'never' | 'free';
export const SEGMENTS: Segment[] = ['active', 'expiring', 'lapsed', 'never', 'free'];
