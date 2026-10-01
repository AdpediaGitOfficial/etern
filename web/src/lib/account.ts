/**
 * The signed-in administrator's name and email, for display only.
 *
 * The session token in the session cookie is the only thing that authorises
 * anything; this cookie just saves a round trip for the name in the sidebar.
 * Never trust it for access decisions — a reader can edit their own cookies, and
 * nothing here is signed. The backend already returns the profile alongside the
 * token at login, so this costs no extra request.
 */
export interface Account {
  name: string;
  email: string;
}

const MAX = 120;

const clean = (v: unknown): string => (typeof v === 'string' ? v.trim().slice(0, MAX) : '');

/** Reads whatever the backend sent at login. Returns undefined when there is no usable name or email. */
export function accountFromLogin(result: unknown): Account | undefined {
  if (!result || typeof result !== 'object') return undefined;
  const r = result as Record<string, unknown>;
  const account = { name: clean(r.fullName) || clean(r.name), email: clean(r.email) };
  return account.name || account.email ? account : undefined;
}

/** base64url of the JSON, so the value is safe in a cookie whatever is in the name. */
export function encodeAccount(a: Account): string {
  return Buffer.from(JSON.stringify(a), 'utf8').toString('base64url');
}

/** Defensive on purpose: this value comes back from the browser and may be anything. */
export function parseAccount(raw: string | undefined): Account | undefined {
  if (!raw || raw.length > 1024) return undefined;
  try {
    const parsed: unknown = JSON.parse(Buffer.from(raw, 'base64url').toString('utf8'));
    if (!parsed || typeof parsed !== 'object') return undefined;
    const p = parsed as Record<string, unknown>;
    const account = { name: clean(p.name), email: clean(p.email) };
    return account.name || account.email ? account : undefined;
  } catch {
    return undefined;
  }
}

/** "Priya Nair" -> "PN", "admin@etern.com" -> "A". Falls back to a dot rather than an empty circle. */
export function initials(a: Account | undefined): string {
  const source = a?.name || a?.email || '';
  const parts = source.split(/[\s.@_-]+/).filter(Boolean);
  const letters = parts.slice(0, 2).map(p => p[0]).join('');
  return letters ? letters.toUpperCase() : '·';
}

/** What to show when the cookie is missing or unreadable — an older session, or a cleared cookie. */
export const UNKNOWN_ACCOUNT: Account = { name: 'Signed in', email: '' };
