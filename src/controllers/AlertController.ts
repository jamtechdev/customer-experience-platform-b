import { Request, Response, NextFunction } from 'express';
import { AlertService } from '../services/AlertService';
import { AuthRequest } from '../middleware/auth';
import container from '../config/container';
import { TYPES } from '../config/types';
import { AppError } from '../middleware/errorHandler';
import {
  successHandler,
  errorHandler,
  unauthorizedHandler,
  serverErrorHandler,
} from '../utils/responseHandler';

export class AlertController {
  private alertService: AlertService;

  constructor() {
    this.alertService = container.get<AlertService>(TYPES.AlertService);
  }

  getAlerts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const acknowledged = req.query.acknowledged === 'true' ? true : req.query.acknowledged === 'false' ? false : undefined;
      const alerts = await this.alertService.getAlerts(acknowledged);
      successHandler(res, alerts, 200, 'Alerts retrieved successfully');
    } catch (error: any) {
      if (error instanceof AppError) {
        errorHandler(res, error.statusCode, error.message);
        return;
      }
      serverErrorHandler(res, error);
    }
  };

  acknowledgeAlert = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        unauthorizedHandler(res, 'Authentication required');
        return;
      }

      const alertId = parseInt(req.params.id);
      const alert = await this.alertService.acknowledgeAlert(alertId, req.user.id);
      successHandler(res, alert, 200, 'Alert acknowledged successfully');
    } catch (error: any) {
      if (error instanceof AppError) {
        errorHandler(res, error.statusCode, error.message);
        return;
      }
      serverErrorHandler(res, error);
    }
  };

  checkAlerts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = parseInt(req.body.companyId);
      if (!companyId) {
        errorHandler(res, 400, 'Company ID is required');
        return;
      }

      const newAlerts = await this.alertService.checkForAlerts(companyId);
      successHandler(res, newAlerts, 200, 'Alerts checked successfully');
    } catch (error: any) {
      if (error instanceof AppError) {
        errorHandler(res, error.statusCode, error.message);
        return;
      }
      serverErrorHandler(res, error);
    }
  };
}
