import { describe, expect, it } from 'vitest';
import { accountFromLogin, encodeAccount, initials, parseAccount, UNKNOWN_ACCOUNT } from './account';

describe('accountFromLogin', () => {
  it('takes the name and email the backend returns with the token', () => {
    expect(accountFromLogin({ fullName: 'Priya Nair', email: 'priya@etern.com', password: 'x' }))
      .toEqual({ name: 'Priya Nair', email: 'priya@etern.com' });
  });

  it('accepts either spelling of the name field', () => {
    expect(accountFromLogin({ name: 'Ravi', email: 'r@e.com' })?.name).toBe('Ravi');
  });

  it('is undefined when there is nothing worth showing', () => {
    for (const bad of [null, undefined, 'string', 42, {}, { fullName: '   ' }]) {
      expect(accountFromLogin(bad)).toBeUndefined();
    }
  });

  it('caps absurd values so the cookie cannot be stuffed', () => {
    const long = accountFromLogin({ fullName: 'a'.repeat(5000), email: 'b'.repeat(5000) });
    expect(long!.name.length).toBe(120);
    expect(long!.email.length).toBe(120);
  });
});

describe('parseAccount', () => {
  it('round-trips, including names the cookie syntax would otherwise break', () => {
    for (const a of [
      { name: 'Priya Nair', email: 'priya@etern.com' },
      { name: 'Smith; Jones, A=B', email: 'a@b.com' },
      { name: 'ಪ್ರಿಯಾ 中文 🎓', email: 'u@e.com' },
    ]) {
      expect(parseAccount(encodeAccount(a))).toEqual(a);
    }
  });

  it('returns undefined rather than throwing on anything malformed', () => {
    for (const bad of [undefined, '', 'not-base64!!', Buffer.from('{').toString('base64url'),
                       Buffer.from('null').toString('base64url'), Buffer.from('"hi"').toString('base64url'),
                       Buffer.from('[1,2]').toString('base64url'), 'a'.repeat(2000)]) {
      expect(parseAccount(bad)).toBeUndefined();
    }
  });

  it('ignores extra fields, so a tampered cookie cannot smuggle anything in', () => {
    const raw = Buffer.from(JSON.stringify({ name: 'X', email: 'x@e.com', role: 'superadmin', token: 'abc' }), 'utf8').toString('base64url');
    expect(parseAccount(raw)).toEqual({ name: 'X', email: 'x@e.com' });
  });
});

describe('initials', () => {
  it('uses up to two words of the name', () => {
    expect(initials({ name: 'Priya Nair', email: '' })).toBe('PN');
    expect(initials({ name: 'Priya Rani Nair', email: '' })).toBe('PR');
    expect(initials({ name: 'Admin', email: '' })).toBe('A');
  });

  it('falls back to the email, then to a dot', () => {
    expect(initials({ name: '', email: 'ravi.kumar@etern.com' })).toBe('RK');
    expect(initials(undefined)).toBe('·');
    expect(initials({ name: '', email: '' })).toBe('·');
  });

  it('gives the generic account something to show', () => {
    expect(initials(UNKNOWN_ACCOUNT)).toBe('SI');
  });
});
