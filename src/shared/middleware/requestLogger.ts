import { Request, Response, NextFunction } from 'express';

/**
 * requestLogger - HTTP request logging middleware
 *
 * This middleware logs all HTTP requests with their method, path,
 * status code, and response duration. It's useful for monitoring
 * application performance and debugging.
 *
 * Process:
 * 1. Record start time before request processing
 * 2. Listen for 'finish' event on response (response sent)
 * 3. Calculate duration (current time - start time)
 * 4. Log request details to console
 *
 * Output format: METHOD PATH - STATUS_CODE - DURATIONms
 * Example: POST /authentication/login - 200 - 45ms
 *
 * Note: In production, consider using a proper logging service
 * like Winston or Pino for structured logging.
 *
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
  });

  next();
};
