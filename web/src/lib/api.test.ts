import { describe, expect, it } from 'vitest';
import { listOf, totalOf } from './api';

describe('list helpers', () => {
  it('reads both the paged and the bare-array response shapes', () => {
    expect(listOf({ data: [1, 2], totalCount: 9 })).toEqual([1, 2]);
    expect(listOf([3])).toEqual([3]);
    expect(listOf(null)).toEqual([]);
    expect(listOf({ data: 'nope' })).toEqual([]);
    expect(totalOf({ data: [1], totalCount: 9 })).toBe(9);
    expect(totalOf([1, 2, 3])).toBe(3);
    expect(totalOf(undefined)).toBe(0);
  });
});
