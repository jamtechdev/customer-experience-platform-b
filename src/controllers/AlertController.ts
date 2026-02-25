import { Request, Response, NextFunction } from 'express';
import { AlertService } from '../services/AlertService';
import { AuthRequest } from '../middleware/auth';
import container from '../config/container';
import { TYPES } from '../config/types';

export class AlertController {
  private alertService: AlertService;

  constructor() {
    this.alertService = container.get<AlertService>(TYPES.AlertService);
  }

  getAlerts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const acknowledged = req.query.acknowledged === 'true' ? true : req.query.acknowledged === 'false' ? false : undefined;
      const alerts = await this.alertService.getAlerts(acknowledged);
      res.json(alerts);
    } catch (error: any) {
      next(error);
    }
  };

  acknowledgeAlert = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const alertId = parseInt(req.params.id);
      const alert = await this.alertService.acknowledgeAlert(alertId, req.user.id);
      res.json(alert);
    } catch (error: any) {
      next(error);
    }
  };

  checkAlerts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = parseInt(req.body.companyId);
      if (!companyId) {
        res.status(400).json({ error: 'Company ID is required' });
        return;
      }

      const newAlerts = await this.alertService.checkForAlerts(companyId);
      res.json(newAlerts);
    } catch (error: any) {
      next(error);
    }
  };
}
