import { Request, Response, NextFunction } from 'express';
import { JWTUtil } from '../utils/jwt.util.ts';

/**
 * Extend Express Request interface to include user property
 *
 * This declaration adds the optional `user` property to the Express Request
 * interface, allowing TypeScript to recognize req.user in route handlers.
 * The user property contains the decoded JWT payload (userId and email).
 */
declare global {
  namespace Express {
    interface User {
      userId: string;
      email: string;
    }
    interface Request {
      user?: User | undefined;
    }
  }
}

/**
 * authenticate - JWT authentication middleware
 *
 * This middleware validates JWT tokens from HTTP-only cookies and injects
 * the decoded user data into the request object. It protects routes that
 * require authentication.
 *
 * Process:
 * 1. Extract accessToken from HTTP-only cookie
 * 2. If missing, return 401 (unauthorized)
 * 3. Verify token signature and expiration using JWTUtil
 * 4. If invalid, return 401 (unauthorized)
 * 5. If valid, inject user data into req.user
 * 6. Call next() to proceed to route handler
 *
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const token = req.cookies.accessToken;

    if (!token) {
      res.status(401).json({
        message: 'Authentication required',
        status: 'failed'
      });
      return;
    }

    const payload = JWTUtil.verifyToken(token);
    req.user = payload;
    next();
  } catch (error) {
    res.status(401).json({
      message: 'Invalid or expired token',
      status: 'failed'
    });
    return;
  }
};

/**
 * optionalAuth - Optional JWT authentication middleware
 *
 * This middleware attempts to validate JWT tokens but doesn't require them.
 * If a valid token is present, it injects user data into req.user.
 * If no token or invalid token, it proceeds without authentication.
 *
 * Use this for routes that work for both authenticated and unauthenticated users,
 * but provide enhanced functionality for authenticated users.
 *
 * Process:
 * 1. Extract accessToken from HTTP-only cookie
 * 2. If present, verify token using JWTUtil
 * 3. If valid, inject user data into req.user
 * 4. Always call next() (proceeds regardless of auth status)
 *
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export const optionalAuth = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const token = req.cookies.accessToken;

    if (token) {
      const payload = JWTUtil.verifyToken(token);
      req.user = payload;
    }
    next();
  } catch (error) {
    next();
  }
};
