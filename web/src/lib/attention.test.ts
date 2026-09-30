import { describe, expect, it } from 'vitest';
import { attentionItems } from './attention';
import type { VideoRow } from './types';

const ok = <T,>(data: T) => ({ ok: true as const, data });
const down = { ok: false as const, status: 500 };
const video = (name: string, pct: number, image = '/i.png'): VideoRow => ({ subCategoryName: name, categoryName: 'C', subCategoryImageUrl: image, totalCourseMaterials: 1, totalDuration: '01:00', studentsCompletedPercentage: pct });

describe('attentionItems', () => {
  it('is empty when nothing needs action', () => {
    expect(attentionItems(ok(0), ok(0), ok([video('A', 80)]))).toEqual([]);
  });

  it('orders by urgency and uses correct singular/plural wording', () => {
    const items = attentionItems(ok(1), ok(3), ok([video('Weak', 10, ''), video('Fine', 90)]));
    expect(items.map(i => i.key)).toEqual(['expired', 'expiring', 'low', 'image']);
    expect(items[0].title).toBe('3 subscriptions have expired');
    expect(items[1].title).toBe('1 subscription expires within 7 days');
    expect(items[2].hint).toContain('Weak (10%)');
    expect(items[3].title).toBe('1 sub category has no image');
  });

  it('uses 40% as the boundary for low completion', () => {
    expect(attentionItems(ok(0), ok(0), ok([video('Edge', 40)])).map(i => i.key)).toEqual([]);
    expect(attentionItems(ok(0), ok(0), ok([video('Under', 39)])).map(i => i.key)).toEqual(['low']);
  });

  it('skips a check whose data failed to load instead of guessing', () => {
    expect(attentionItems(down, ok(2), down).map(i => i.key)).toEqual(['expired']);
  });
});
