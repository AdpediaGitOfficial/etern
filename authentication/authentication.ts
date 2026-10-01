import jwt, { JwtPayload } from 'jsonwebtoken';
import configKeys from '../configKeys';

/**
 * Durations jsonwebtoken understands: a number of seconds, or a string such as
 * "12h", "30d" or "90 days". Anything else makes jwt.sign throw at the moment
 * someone tries to sign in, so a bad value is caught at start-up instead.
 */
const DURATION = /^\d+(\.\d+)?\s*(ms|s|m|h|d|w|y|milliseconds?|seconds?|minutes?|hours?|days?|weeks?|years?)?$/i;

function duration(value: string, name: string): string {
  const v = String(value).trim();
  if (!DURATION.test(v)) {
    throw new Error(`${name} is not a valid token duration: ${JSON.stringify(value)} (try "12h" or "30d")`);
  }
  return v;
}

/**
 * Admin and student tokens expire on different clocks. See configKeys for why:
 * the admin panel can send someone back to sign-in at any time, while the mobile
 * app has no refresh flow and has to redo the OTP login when a token runs out.
 */
export function tokenExpiry(role: string): string {
  return role === 'admin'
    ? duration(configKeys.ADMIN_TOKEN_EXPIRY, 'ADMIN_TOKEN_EXPIRY')
    : duration(configKeys.USER_TOKEN_EXPIRY, 'USER_TOKEN_EXPIRY');
}

/** Fails the boot rather than every login, if either duration is malformed. */
export function validateTokenConfig(): void {
  tokenExpiry('admin');
  tokenExpiry('user');
}

export function generateToken(payload: { role: string; userId: string }): string {
  return jwt.sign(payload, configKeys.JWT_SECRET, {
    expiresIn: tokenExpiry(payload.role) as jwt.SignOptions['expiresIn'],
  });
}

export function verifyToken(token: string): JwtPayload | string {
  return jwt.verify(token, configKeys.JWT_SECRET);
}
