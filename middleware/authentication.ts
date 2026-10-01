import { Request, Response, NextFunction } from 'express';
import asyncHandler from 'express-async-handler';
import { verifyToken } from '../authentication/authentication';
import { getPasswordChangedAt, hasActiveUserToken } from '../user/repos/registerUserRepo';
import configKeys from '../configKeys';
import AppError from '../common/appError';
import { HttpStatus } from '../common/httpStatus';
import { responseMessages } from '../config/localization';
import { JwtPayload } from 'jsonwebtoken';
import { Types } from 'mongoose';
import logger from '../config/logger';

/**
 * Student routes, used by the mobile app.
 *
 * A valid signature is not enough: the token must still be one of the student's
 * live sessions. Signing out blanks the stored token, so without this check it
 * kept working and "sign out" changed nothing a thief would notice.
 *
 * That costs one indexed read per request, on the app's hottest path. It is the
 * only way to make a stateless token revocable, and STUDENT_SESSION_CHECK=off
 * turns it back into a signature-only check if it ever needs to come out quickly.
 */
export const authenticateUser = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.headers.authorization || !req.headers.authorization.startsWith('Bearer')) {
      throw new AppError(responseMessages.jwt_token_required, HttpStatus.UNAUTHORIZED);
    }
    const token = req.headers.authorization.split(' ')[1];

    let user: JwtPayload | string;
    try {
      user = verifyToken(token);
    } catch (error) {
      logger.error(error);
      throw new AppError(responseMessages.unauthorized_user, HttpStatus.UNAUTHORIZED);
    }
    if (!user || typeof user === 'string' || user?.role !== 'user') {
      throw new AppError(responseMessages.invalid_token, HttpStatus.UNAUTHORIZED);
    }

    const userId = user.userId as string;
    if (!Types.ObjectId.isValid(userId)) {
      throw new AppError(responseMessages.invalid_token, HttpStatus.UNAUTHORIZED);
    }

    if (configKeys.STUDENT_SESSION_CHECK !== 'off') {
      if (!(await hasActiveUserToken(userId, token))) {
        throw new AppError(responseMessages.unauthorized_user, HttpStatus.UNAUTHORIZED);
      }
    }

    res.locals.userId = userId;
    // Outside the try above on purpose: an error thrown further down the stack is
    // that route's error, and must not be reported as an authentication failure.
    next();
  },
);

/**
 * A JWT's `iat` is whole seconds rounded down, so a token issued at 10:00:00.900
 * and one issued at 10:00:00.100 are indistinguishable. Something has to give:
 *
 *   - with this tolerance, a token issued in the second before the change
 *     survives it;
 *   - without it, the admin who just changed their password is signed out by
 *     their own change, because the token they are holding was minted in the
 *     same second.
 *
 * The tolerance is the right side to err on. The point of ending other sessions
 * is to cut off one created minutes, hours or days ago with the old password; a
 * token less than a second old is the person doing the changing.
 */
const IAT_TOLERANCE_MS = 1000;

/**
 * Admin routes. Besides checking the signature and the role, this refuses tokens
 * issued before the account's password last changed, which is what makes changing
 * a password end the sessions on other devices.
 *
 * It costs one indexed read per admin request. That is affordable here because
 * only the admin panel uses these routes; authenticateUser deliberately does not
 * do it, since every mobile-app request goes through it and students have no
 * password-change flow.
 */
export const authenticateAdmin = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.headers.authorization || !req.headers.authorization.startsWith('Bearer')) {
      throw new AppError(responseMessages.jwt_token_required, HttpStatus.UNAUTHORIZED);
    }
    const token = req.headers.authorization.split(' ')[1];

    let user: JwtPayload | string;
    try {
      user = verifyToken(token);
    } catch (error) {
      logger.error(error);
      throw new AppError(responseMessages.unauthorized_user, HttpStatus.UNAUTHORIZED);
    }
    if (!user || typeof user === 'string' || user?.role !== 'admin') {
      throw new AppError(responseMessages.invalid_token, HttpStatus.UNAUTHORIZED);
    }

    const userId = user.userId as string;
    // A signed token could still carry a userId Mongo cannot cast; querying with it
    // throws a CastError, which would surface as a 500 instead of a refusal.
    if (!Types.ObjectId.isValid(userId)) {
      throw new AppError(responseMessages.invalid_token, HttpStatus.UNAUTHORIZED);
    }

    const changedAt = await getPasswordChangedAt(userId);
    if (changedAt && typeof user.iat === 'number') {
      if (user.iat * 1000 < changedAt.getTime() - IAT_TOLERANCE_MS) {
        throw new AppError(responseMessages.unauthorized_user, HttpStatus.UNAUTHORIZED);
      }
    }

    res.locals.userId = userId;
    // Outside the try above on purpose: an error thrown further down the stack is
    // that route's error, and must not be reported as an authentication failure.
    next();
  },
);
