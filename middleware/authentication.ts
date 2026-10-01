import { Request, Response, NextFunction } from 'express';
import asyncHandler from 'express-async-handler';
import { verifyToken } from '../authentication/authentication';
import { getPasswordChangedAt } from '../user/repos/registerUserRepo';
import AppError from '../common/appError';
import { HttpStatus } from '../common/httpStatus';
import { responseMessages } from '../config/localization';
import { JwtPayload } from 'jsonwebtoken';
import { Types } from 'mongoose';
import logger from '../config/logger';

export function authenticateUser(req: Request, res: Response, next: NextFunction): void {
  // Check for JWT token
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    const token = req.headers.authorization.split(' ')[1];
    try {
      const user: JwtPayload | string = verifyToken(token);
      if (!user || typeof user === 'string' || user?.role !== 'user') {
        throw new AppError(responseMessages.invalid_token, HttpStatus.UNAUTHORIZED);
      }
      // Store user data in res.locals for use in other middleware and routes
      res.locals.userId = user.userId as string;
      next();
      return;
    } catch (error) {
      logger.error(error);
      throw new AppError(responseMessages.unauthorized_user, HttpStatus.UNAUTHORIZED);
    }
  }
  // If no JWT token is provided
  throw new AppError(responseMessages.jwt_token_required, HttpStatus.UNAUTHORIZED);
}

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
