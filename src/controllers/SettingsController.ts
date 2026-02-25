import { Request, Response, NextFunction } from 'express';
import { injectable } from 'inversify';
import { SettingsService } from '../services/SettingsService';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import {
  successHandler,
  errorHandler,
  unauthorizedHandler,
  serverErrorHandler,
} from '../utils/responseHandler';

@injectable()
export class SettingsController {
  constructor(private settingsService: SettingsService) {}

  getSettings = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        unauthorizedHandler(res, 'Authentication required');
        return;
      }

      const settings = await this.settingsService.getUserSettings(req.user.id);
      successHandler(res, settings, 200, 'Settings retrieved successfully');
    } catch (error: any) {
      if (error instanceof AppError) {
        errorHandler(res, error.statusCode, error.message);
        return;
      }
      serverErrorHandler(res, error);
    }
  };

  updateSettings = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        unauthorizedHandler(res, 'Authentication required');
        return;
      }

      const settings = await this.settingsService.updateUserSettings(req.user.id, req.body);
      successHandler(res, settings, 200, 'Settings updated successfully');
    } catch (error: any) {
      if (error instanceof AppError) {
        errorHandler(res, error.statusCode, error.message);
        return;
      }
      serverErrorHandler(res, error);
    }
  };

  deleteSettings = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        unauthorizedHandler(res, 'Authentication required');
        return;
      }

      await this.settingsService.resetUserSettings(req.user.id);
      successHandler(res, null, 200, 'Settings reset to defaults');
    } catch (error: any) {
      if (error instanceof AppError) {
        errorHandler(res, error.statusCode, error.message);
        return;
      }
      serverErrorHandler(res, error);
    }
  };
}
