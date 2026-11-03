import { RequestHandler } from 'express';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export const createCookieCsrfMiddleware = (allowedOrigins: string[]): RequestHandler => {
  const allowedOriginSet = new Set(allowedOrigins);

  return (req, res, next): void => {
    if (SAFE_METHODS.has(req.method)) {
      next();
      return;
    }

    const origin = req.get('origin');
    const hasAuthCookie = Boolean(req.cookies?.accessToken || req.cookies?.refreshToken);
    if (!origin && !hasAuthCookie) {
      next();
      return;
    }

    if (!origin || !allowedOriginSet.has(origin)) {
      res.status(403).json({
        message: 'Request origin is not allowed',
        status: 'failed',
      });
      return;
    }

    next();
  };
};
