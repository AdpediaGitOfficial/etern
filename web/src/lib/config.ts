
export function backendUrl(): string {
  const url = process.env.BACKEND_URL;
  if (!url) throw new Error('BACKEND_URL is not set (see .env.example)');
  return url.replace(/\/+$/, '');
}

export function assetBaseUrl(): string {
  return (process.env.ASSET_BASE_URL || process.env.BACKEND_URL || '').replace(/\/+$/, '');
}

export function sessionMaxAgeSeconds(): number {
  const h = Number(process.env.SESSION_HOURS);
  return (Number.isFinite(h) && h > 0 ? h : 8) * 3600;
}

/** Secure cookies are the default in production; set COOKIE_SECURE=false only for plain-http testing. */
export function cookieSecure(): boolean {
  return process.env.COOKIE_SECURE ? process.env.COOKIE_SECURE === 'true' : process.env.NODE_ENV === 'production';
}

/** The `__Host-` prefix makes browsers refuse the cookie unless it is Secure, path=/ and has no Domain. */
export function sessionCookieName(): string {
  return cookieSecure() ? '__Host-etern_session' : 'etern_session';
}

/** Display-only companion to the session cookie: the signed-in admin's name and email. */
export function accountCookieName(): string {
  return cookieSecure() ? '__Host-etern_account' : 'etern_account';
}

/** Fail fast on a bad deployment instead of failing on the first request. */
export function validateEnv(): void {
  const raw = process.env.BACKEND_URL;
  if (!raw) throw new Error('BACKEND_URL is not set (see .env.example)');
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error('BACKEND_URL is not a valid URL');
  }
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('BACKEND_URL must be http(s)');
  if (process.env.NODE_ENV === 'production' && url.protocol !== 'https:' && !/^(localhost|127\.0\.0\.1)$/.test(url.hostname)) {
    throw new Error('BACKEND_URL must use https in production');
  }
}
