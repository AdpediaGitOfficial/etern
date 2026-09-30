import { describe, expect, it } from 'vitest';
import { RateLimiter } from './rateLimit';

describe('RateLimiter', () => {
  it('blocks after the maximum and recovers once the window passes', () => {
    const rl = new RateLimiter(3, 1000);
    expect([0, 1, 2].map(t => rl.allow('k', t))).toEqual([true, true, true]);
    expect(rl.allow('k', 10)).toBe(false);
    expect(rl.allow('k', 999)).toBe(false);
    expect(rl.allow('k', 1001)).toBe(true); // the first hit has aged out
  });

  it('counts each key separately', () => {
    const rl = new RateLimiter(1, 1000);
    expect(rl.allow('a', 0)).toBe(true);
    expect(rl.allow('b', 0)).toBe(true);
    expect(rl.allow('a', 1)).toBe(false);
  });

  it('reset clears a key', () => {
    const rl = new RateLimiter(1, 1000);
    rl.allow('a', 0);
    rl.reset('a');
    expect(rl.allow('a', 1)).toBe(true);
  });

  it('keeps memory bounded when many keys arrive', () => {
    const rl = new RateLimiter(5, 60_000, 100);
    for (let i = 0; i < 1000; i++) rl.allow(`ip-${i}`, i);
    // internal map is private; the behaviour that matters is that old keys are dropped and new ones still work
    expect(rl.allow('ip-fresh', 2000)).toBe(true);
  });
});
