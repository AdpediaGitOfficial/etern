/**
 * Small in-memory sliding-window limiter, used on sign-in.
 * It is per server instance. Behind several containers, add AWS WAF rate rules on the load balancer as well.
 */
export class RateLimiter {
  private hits = new Map<string, number[]>();

  constructor(private readonly max: number, private readonly windowMs: number, private readonly maxKeys = 5000) {}

  /** Records an attempt. Returns false when the key is over its limit. */
  allow(key: string, now = Date.now()): boolean {
    const recent = (this.hits.get(key) ?? []).filter(t => now - t < this.windowMs);
    if (recent.length >= this.max) {
      this.hits.set(key, recent);
      return false;
    }
    recent.push(now);
    this.hits.set(key, recent);
    if (this.hits.size > this.maxKeys) this.prune(now);
    return true;
  }

  /** Clears a key, e.g. after a successful sign-in. */
  reset(key: string): void {
    this.hits.delete(key);
  }

  private prune(now: number): void {
    for (const [k, v] of this.hits) {
      if (v.every(t => now - t >= this.windowMs)) this.hits.delete(k);
    }
    // Still too big (many active keys): drop the oldest entries so memory stays bounded.
    while (this.hits.size > this.maxKeys) {
      const first = this.hits.keys().next().value;
      if (first === undefined) break;
      this.hits.delete(first);
    }
  }
}
