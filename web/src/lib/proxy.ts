/** Which backend calls the browser may make through /api/proxy, and with which HTTP method. Everything else is refused. */
const ID = '[0-9a-fA-F]{24}';
const ALLOWED: { method: string; path: RegExp }[] = [
  { method: 'GET', path: /^student\/allAdmin$/ },
  { method: 'GET', path: /^student\/export-students$/ },
  { method: 'GET', path: new RegExp(`^student/${ID}$`) },
  { method: 'DELETE', path: new RegExp(`^student/${ID}$`) },
  { method: 'GET', path: new RegExp(`^student/unsubscribe/${ID}$`) },
  { method: 'GET', path: /^subscription\/offlinepayments$/ },
  { method: 'GET', path: new RegExp(`^subscription/${ID}$`) },
  { method: 'POST', path: /^subscription\/add-offline-payment$/ },
  { method: 'GET', path: /^package\/allAdmin$/ },
];

export function isAllowed(method: string, path: string): boolean {
  return ALLOWED.some(a => a.method === method && a.path.test(path));
}
