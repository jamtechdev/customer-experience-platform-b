import { Request, Response, NextFunction } from 'express';
import logger from '../config/logger';
import { serverErrorHandler, errorHandler as responseErrorHandler } from '../utils/responseHandler';

export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (err instanceof AppError) {
    logger.error(`AppError: ${err.message}`, { statusCode: err.statusCode, stack: err.stack });
    responseErrorHandler(res, err.statusCode, err.message);
    return;
  }

  logger.error(`Unhandled Error: ${err.message}`, { stack: err.stack });
  serverErrorHandler(res, err);
};
