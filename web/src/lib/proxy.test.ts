import { describe, expect, it } from 'vitest';
import { isAllowed } from './proxy';

const id = 'a'.repeat(24);

describe('proxy allowlist', () => {
  it.each([
    ['GET', 'student/allAdmin'], ['GET', `student/${id}`], ['DELETE', `student/${id}`], ['GET', `student/unsubscribe/${id}`],
    ['GET', 'student/export-students'], ['GET', 'subscription/offlinepayments'], ['GET', `subscription/${id}`],
    ['POST', 'subscription/add-offline-payment'],
    ['GET', 'package/allAdmin'], ['POST', 'package'], ['PUT', `package/${id}`], ['DELETE', `package/${id}`], ['GET', `package/${id}`],
    ['GET', 'category/all'], ['POST', 'category'], ['PUT', `category/${id}`], ['DELETE', `category/${id}`], ['GET', `category/${id}`],
    ['GET', 'subcategory/all'], ['POST', 'subcategory'], ['PUT', `subcategory/${id}`],
    ['GET', `subcategory/by-categoryAdmin/${id}/kid`], ['GET', `subcategory/by-categoryAdmin/${id}/parent`],
    ['GET', 'coursematerial/all'], ['POST', 'coursematerial'], ['PUT', `coursematerial/${id}`], ['DELETE', `coursematerial/${id}`],
    // Deliberately opened for Settings → Administrators. It is admin-authenticated on the
    // backend, and it is the only way to add a second admin without database access.
    ['POST', 'user/register-admin'],
  ])('allows %s %s', (method, path) => {
    expect(isAllowed(method, path)).toBe(true);
  });

  it.each([
    // Still refused: listing users, signing in again, and everything else under user/.
    ['GET', 'user/all'], ['POST', 'user/login'], ['PUT', `user/profile-update/${id}`], ['POST', 'user/delete-account'],
    ['GET', 'subscription/revenueDetails'],
    ['GET', 'package/all'], // the mobile-app endpoint, not the admin one
    ['GET', 'student/fixedOtp/' + id], // the fixed-OTP backdoor is deliberately unreachable
    ['POST', `student/${id}`], ['PUT', 'student/allAdmin'], ['DELETE', 'student/allAdmin'],
    ['GET', 'coursematerial/track-view'], ['POST', 'coursematerial/track-view'], ['POST', 'coursematerial/add-watch-history'],
    ['GET', `subcategory/by-categoryAdmin/${id}/other`],
  ])('refuses %s %s', (method, path) => {
    expect(isAllowed(method, path)).toBe(false);
  });

  it.each([
    'student/../user/all', 'student/%2e%2e/user/all', `student/${id}/../../user/all`, `student/${id}/extra`, `student/${id}\n`,
    'student/allAdmin/', '/student/allAdmin', 'student/allAdmin?x=1', `student/${'g'.repeat(24)}`, `student/${'a'.repeat(23)}`, '',
  ])('refuses traversal and malformed path %j', path => {
    expect(isAllowed('GET', path)).toBe(false);
    expect(isAllowed('DELETE', path)).toBe(false);
  });
});
