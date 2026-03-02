import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import {
  successHandler,
  errorHandler,
  unauthorizedHandler,
  serverErrorHandler,
} from '../utils/responseHandler';

export class ReportController {
  getReports = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        unauthorizedHandler(res, 'Authentication required');
        return;
      }

      // Return empty array for now - reports feature can be implemented later
      // This prevents 500 errors when the frontend calls this endpoint
      successHandler(res, [], 200, 'Reports retrieved successfully');
    } catch (error: any) {
      if (error instanceof AppError) {
        errorHandler(res, error.statusCode, error.message);
        return;
      }
      serverErrorHandler(res, error);
    }
  };

  getReportById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        unauthorizedHandler(res, 'Authentication required');
        return;
      }

      errorHandler(res, 404, 'Report not found');
    } catch (error: any) {
      if (error instanceof AppError) {
        errorHandler(res, error.statusCode, error.message);
        return;
      }
      serverErrorHandler(res, error);
    }
  };

  createReport = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        unauthorizedHandler(res, 'Authentication required');
        return;
      }

      errorHandler(res, 501, 'Report creation not yet implemented');
    } catch (error: any) {
      if (error instanceof AppError) {
        errorHandler(res, error.statusCode, error.message);
        return;
      }
      serverErrorHandler(res, error);
    }
  };
}
