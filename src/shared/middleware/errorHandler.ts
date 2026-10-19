import { Request, Response, NextFunction } from 'express';

/**
 * errorHandler - Global error handling middleware
 *
 * This middleware catches all errors that occur in the application and
 * returns a consistent error response to the client. It should be registered
 * as the last middleware in the application to catch all unhandled errors.
 *
 * Process:
 * 1. Log the error to console (for debugging)
 * 2. Return 500 status code (internal server error)
 * 3. Return error message in JSON format
 *
 * Note: In production, you may want to:
 * - Use a proper logging service (Winston, Pino)
 * - Sanitize error messages (don't expose stack traces)
 * - Send error reports to monitoring service (Sentry, Datadog)
 *
 * @param err - Error object
 * @param _req - Express request object (unused)
 * @param res - Express response object
 * @param _next - Express next function (unused)
 */
export const errorHandler = (err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Error:', err);

  res.status(500).json({
    error: {
      message: err.message || 'Internal Server Error',
      status: 500
    }
  });
};
