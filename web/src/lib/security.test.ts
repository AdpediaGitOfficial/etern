import { describe, expect, it } from 'vitest';
import { clientIp, isSameSiteRequest } from './security';

const req = (headers: Record<string, string>, method = 'GET') => new Request('https://admin.example.com/api/x', { method, headers });

describe('isSameSiteRequest', () => {
  it('trusts Fetch Metadata: same-origin and typed URLs pass', () => {
    expect(isSameSiteRequest(req({ 'sec-fetch-site': 'same-origin' }))).toBe(true);
    expect(isSameSiteRequest(req({ 'sec-fetch-site': 'none' }))).toBe(true);
  });

  it('rejects cross-site and same-site (sibling subdomain) requests', () => {
    expect(isSameSiteRequest(req({ 'sec-fetch-site': 'cross-site' }))).toBe(false);
    expect(isSameSiteRequest(req({ 'sec-fetch-site': 'same-site' }))).toBe(false);
  });

  it('Fetch Metadata wins over a spoofable Origin', () => {
    expect(isSameSiteRequest(req({ 'sec-fetch-site': 'cross-site', origin: 'https://admin.example.com', host: 'admin.example.com' }))).toBe(false);
  });

  it('falls back to Origin, then Referer, against the host header', () => {
    expect(isSameSiteRequest(req({ origin: 'https://admin.example.com', host: 'admin.example.com' }, 'POST'))).toBe(true);
    expect(isSameSiteRequest(req({ origin: 'https://evil.example', host: 'admin.example.com' }, 'POST'))).toBe(false);
    expect(isSameSiteRequest(req({ referer: 'https://admin.example.com/users', host: 'admin.example.com' }, 'POST'))).toBe(true);
    expect(isSameSiteRequest(req({ origin: 'not a url', host: 'admin.example.com' }, 'POST'))).toBe(false);
  });

  it('prefers x-forwarded-host behind a proxy', () => {
    expect(isSameSiteRequest(req({ origin: 'https://admin.example.com', host: 'internal:3000', 'x-forwarded-host': 'admin.example.com' }, 'POST'))).toBe(true);
  });

  it('with no signals at all, allows only safe methods', () => {
    expect(isSameSiteRequest(req({}, 'GET'))).toBe(true);
    expect(isSameSiteRequest(req({}, 'POST'))).toBe(false);
    expect(isSameSiteRequest(req({}, 'DELETE'))).toBe(false);
  });
});

describe('clientIp', () => {
  it('uses the rightmost X-Forwarded-For entry (added by our load balancer), not a client-forged one', () => {
    expect(clientIp(req({ 'x-forwarded-for': '6.6.6.6, 203.0.113.9' }))).toBe('203.0.113.9');
    expect(clientIp(req({ 'x-forwarded-for': '203.0.113.9' }))).toBe('203.0.113.9');
  });
  it('falls back to x-real-ip, then unknown', () => {
    expect(clientIp(req({ 'x-real-ip': '198.51.100.4' }))).toBe('198.51.100.4');
    expect(clientIp(req({}))).toBe('unknown');
  });
});
