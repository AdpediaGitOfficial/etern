import { afterEach, describe, expect, it, vi } from 'vitest';
import { cookieSecure, sessionCookieName, sessionMaxAgeSeconds, validateEnv } from './config';

afterEach(() => vi.unstubAllEnvs());

describe('config', () => {
  it('uses the __Host- cookie prefix only when cookies are Secure', () => {
    vi.stubEnv('COOKIE_SECURE', 'true');
    expect(cookieSecure()).toBe(true);
    expect(sessionCookieName()).toBe('__Host-etern_session');
    vi.stubEnv('COOKIE_SECURE', 'false');
    expect(sessionCookieName()).toBe('etern_session');
  });

  it('defaults to Secure in production', () => {
    vi.stubEnv('COOKIE_SECURE', '');
    vi.stubEnv('NODE_ENV', 'production');
    expect(cookieSecure()).toBe(true);
  });

  it('session length defaults to 8 hours and ignores nonsense', () => {
    vi.stubEnv('SESSION_HOURS', '');
    expect(sessionMaxAgeSeconds()).toBe(8 * 3600);
    vi.stubEnv('SESSION_HOURS', '-5');
    expect(sessionMaxAgeSeconds()).toBe(8 * 3600);
    vi.stubEnv('SESSION_HOURS', '2');
    expect(sessionMaxAgeSeconds()).toBe(7200);
  });

  it('validateEnv fails fast on a missing or unsafe BACKEND_URL', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('BACKEND_URL', '');
    expect(() => validateEnv()).toThrow(/not set/);
    vi.stubEnv('BACKEND_URL', 'not a url');
    expect(() => validateEnv()).toThrow(/valid URL/);
    vi.stubEnv('BACKEND_URL', 'ftp://api.example.com');
    expect(() => validateEnv()).toThrow(/http/);
    vi.stubEnv('BACKEND_URL', 'http://api.example.com');
    expect(() => validateEnv()).toThrow(/https/);
    vi.stubEnv('BACKEND_URL', 'https://api.example.com');
    expect(() => validateEnv()).not.toThrow();
    vi.stubEnv('BACKEND_URL', 'http://localhost:4400');
    expect(() => validateEnv()).not.toThrow(); // local testing over http is allowed
  });
});
