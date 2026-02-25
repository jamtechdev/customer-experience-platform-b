import { Request, Response, NextFunction } from 'express';
import { JourneyAnalysisService } from '../services/JourneyAnalysisService';
import container from '../config/container';
import { TYPES } from '../config/types';

export class JourneyController {
  private journeyService: JourneyAnalysisService;

  constructor() {
    this.journeyService = container.get<JourneyAnalysisService>(TYPES.JourneyAnalysisService);
  }

  getStages = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const stages = await this.journeyService.getStages();
      res.json(stages);
    } catch (error: any) {
      next(error);
    }
  };

  analyzeJourney = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = parseInt(req.query.companyId as string);
      if (!companyId) {
        res.status(400).json({ error: 'Company ID is required' });
        return;
      }

      const analysis = await this.journeyService.analyzeJourney(companyId);
      res.json(analysis);
    } catch (error: any) {
      next(error);
    }
  };

  getJourneyTrends = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = parseInt(req.query.companyId as string);
      if (!companyId) {
        res.status(400).json({ error: 'Company ID is required' });
        return;
      }

      const trends = await this.journeyService.getJourneyTrends(companyId);
      res.json(trends);
    } catch (error: any) {
      next(error);
    }
  };
}
