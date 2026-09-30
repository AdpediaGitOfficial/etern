export const SESSION_COOKIE = 'etern_session';

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
