/** Which backend calls the browser may make through /api/proxy, and with which HTTP method. Everything else is refused. */
const ID = '[0-9a-fA-F]{24}';
const TYPE = '(?:kid|parent)';

type Rule = { method: string; path: RegExp };

const rule = (method: string, pattern: string): Rule => ({ method, path: new RegExp(`^${pattern}$`) });

/** list, read, create, update and delete for one catalogue collection */
const crud = (name: string, list = 'all'): Rule[] => [
  rule('GET', `${name}/${list}`),
  rule('GET', `${name}/${ID}`),
  rule('POST', name),
  rule('PUT', `${name}/${ID}`),
  rule('DELETE', `${name}/${ID}`),
];

const ALLOWED: Rule[] = [
  // users
  rule('GET', 'student/allAdmin'),
  rule('GET', 'student/export-students'),
  rule('GET', `student/${ID}`),
  rule('DELETE', `student/${ID}`),
  rule('GET', `student/unsubscribe/${ID}`),
  // payments
  rule('GET', 'subscription/offlinepayments'),
  rule('GET', `subscription/${ID}`),
  rule('POST', 'subscription/add-offline-payment'),
  // catalogue
  ...crud('package', 'allAdmin'),
  ...crud('category'),
  ...crud('subcategory'),
  ...crud('coursematerial'),
  rule('GET', `subcategory/by-categoryAdmin/${ID}/${TYPE}`),
];

export function isAllowed(method: string, path: string): boolean {
  return ALLOWED.some(a => a.method === method && a.path.test(path));
}

export const HAS_BODY = new Set(['POST', 'PUT']);
