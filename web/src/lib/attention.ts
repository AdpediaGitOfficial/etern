import type { Result } from './backend';
import type { VideoRow } from './types';

export interface AttentionItem { key: string; tone: 'bad' | 'warn'; title: string; hint: string; href: string; action: string }

const plural = (n: number, one: string, many: string) => `${n.toLocaleString('en-IN')} ${n === 1 ? one : many}`;
const LOW = 40; // matches the "low" band of the completion bars

/** Things an admin should act on today, worked out from data the dashboard already loads. */
export function attentionItems(expiring: Result<number>, expired: Result<number>, videos: Result<VideoRow[]>): AttentionItem[] {
  const items: AttentionItem[] = [];
  if (expired.ok && expired.data > 0) {
    items.push({ key: 'expired', tone: 'bad', title: `${plural(expired.data, 'subscription has', 'subscriptions have')} expired`, hint: 'Students lose access. Follow up on renewals.', href: '/users/expired', action: 'Review' });
  }
  if (expiring.ok && expiring.data > 0) {
    items.push({ key: 'expiring', tone: 'warn', title: `${plural(expiring.data, 'subscription expires', 'subscriptions expire')} within 7 days`, hint: 'Send a renewal reminder before access ends.', href: '/users/upcoming', action: 'Review' });
  }
  if (videos.ok) {
    const rows = videos.data ?? [];
    const low = rows.filter(v => (Number(v.studentsCompletedPercentage) || 0) < LOW);
    if (low.length) {
      const worst = low.reduce((a, b) => ((Number(a.studentsCompletedPercentage) || 0) <= (Number(b.studentsCompletedPercentage) || 0) ? a : b));
      items.push({ key: 'low', tone: 'warn', title: `${plural(low.length, 'sub category is', 'sub categories are')} under ${LOW}% completion`, hint: `Lowest: ${worst.subCategoryName} (${Number(worst.studentsCompletedPercentage) || 0}%). Check the content.`, href: '/course-materials', action: 'View' });
    }
    const noImage = rows.filter(v => !v.subCategoryImageUrl);
    if (noImage.length) {
      items.push({ key: 'image', tone: 'warn', title: `${plural(noImage.length, 'sub category has', 'sub categories have')} no image`, hint: 'Images help students find the right course.', href: '/sub-categories', action: 'Fix' });
    }
  }
  return items;
}

