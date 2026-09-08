import { Request, Response, NextFunction } from 'express';

/**
 * 404 Not Found Middleware
 */
export const notFound = (req: Request, res: Response, next: NextFunction) => {
  // If requesting an API route that does not exist
  if (req.originalUrl.startsWith('/api')) {
    const error = new Error(`Resource Not Found - ${req.originalUrl}`);
    res.status(404);
    next(error);
  } else {
    next();
  }
};

/**
 * Global Error Handling Middleware
 */
export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  const message = err.message || 'Internal Server Error';

  console.error(`💥 [API Error ${statusCode}]:`, message);

  res.status(statusCode).json({
    success: false,
    error: message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};

export default {
  notFound,
  errorHandler,
};
