import 'dotenv/config';
import path from 'path';

const configKeys = {
  DATABASE_URL: process.env.DATABASE as string,
  PORT: process.env.PORT as unknown as number,
  JWT_SECRET: process.env.JWT_SECRET as string,
  TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID as string,
  TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN as string,
  TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER as string,
  BASE_DIR_PATH: path.join(__dirname),
  BREVO_API_KEY: process.env.BREVO_API_KEY as string,

  /**
   * How long a signed token stays valid, as a jsonwebtoken duration ("12h", "30d").
   *
   * Admin tokens are short: the admin panel keeps its own session cookie (8 hours
   * by default, SESSION_HOURS) and sends the admin back to sign-in on a 401, so a
   * short life costs nothing and limits the damage of a leaked token.
   *
   * Student tokens are long because there is no refresh flow: when one expires the
   * mobile app has to put the student through the OTP login again. A year is a
   * large improvement on never expiring while staying clear of active users.
   * Lower it once the app is confirmed to re-authenticate on a 401.
   */
  ADMIN_TOKEN_EXPIRY: process.env.ADMIN_TOKEN_EXPIRY || '12h',
  USER_TOKEN_EXPIRY: process.env.USER_TOKEN_EXPIRY || '365d',

  /**
   * Whether a student's token must still be one of their live sessions.
   *
   * On by default: without it, signing out does nothing — the record is marked
   * inactive but the token keeps working, which is the bug this exists to fix.
   *
   * Set to "off" to fall back to checking the signature alone. The one reason to
   * is fallout on the day it ships: a student whose stored session does not match
   * the token their app is holding has to sign in once more.
   */
  STUDENT_SESSION_CHECK: (process.env.STUDENT_SESSION_CHECK || 'on').toLowerCase(),
};

export default configKeys;
