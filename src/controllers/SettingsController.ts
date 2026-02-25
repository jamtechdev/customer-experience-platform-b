import { Request, Response, NextFunction } from 'express';
import { injectable } from 'inversify';
import { SettingsService } from '../services/SettingsService';
import { AuthRequest } from '../middleware/auth';

@injectable()
export class SettingsController {
  constructor(private settingsService: SettingsService) {}

  getSettings = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const settings = await this.settingsService.getUserSettings(req.user.id);
      res.json({ success: true, data: settings });
    } catch (error: any) {
      next(error);
    }
  };

  updateSettings = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const settings = await this.settingsService.updateUserSettings(req.user.id, req.body);
      res.json({ success: true, data: settings });
    } catch (error: any) {
      next(error);
    }
  };

  deleteSettings = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      await this.settingsService.resetUserSettings(req.user.id);
      res.json({ success: true, message: 'Settings reset to defaults' });
    } catch (error: any) {
      next(error);
    }
  };
}
