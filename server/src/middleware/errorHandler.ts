import { Request, Response, NextFunction } from 'express';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error('Unhandled server error:', err);

  const statusCode = err.status || err.statusCode || 500;
  const message = err.message || 'An unexpected internal server error occurred.';

  res.status(statusCode).json({
    error: err.code || 'SERVER_ERROR',
    message,
    ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {}),
  });
}
