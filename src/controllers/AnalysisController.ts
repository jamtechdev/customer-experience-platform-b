import { Request, Response, NextFunction } from 'express';
import { SentimentAnalysisService } from '../services/SentimentAnalysisService';
import { NPSService } from '../services/NPSService';
import { RootCauseService } from '../services/RootCauseService';
import { CompetitorAnalysisService } from '../services/CompetitorAnalysisService';
import container from '../config/container';
import { TYPES } from '../config/types';

export class AnalysisController {
  private sentimentService: SentimentAnalysisService;
  private npsService: NPSService;
  private rootCauseService: RootCauseService;
  private competitorService: CompetitorAnalysisService;

  constructor() {
    this.sentimentService = container.get<SentimentAnalysisService>(TYPES.SentimentAnalysisService);
    this.npsService = container.get<NPSService>(TYPES.NPSService);
    this.rootCauseService = container.get<RootCauseService>(TYPES.RootCauseService);
    this.competitorService = container.get<CompetitorAnalysisService>(TYPES.CompetitorAnalysisService);
  }

  analyzeSentiment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { feedbackId } = req.body;
      if (!feedbackId) {
        res.status(400).json({ error: 'Feedback ID is required' });
        return;
      }

      const analysis = await this.sentimentService.analyzeFeedback(feedbackId);
      res.json(analysis);
    } catch (error: any) {
      next(error);
    }
  };

  getSentimentStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = req.query.companyId ? parseInt(req.query.companyId as string) : undefined;
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

      const stats = await this.sentimentService.getSentimentStats(companyId, startDate, endDate);
      res.json(stats);
    } catch (error: any) {
      next(error);
    }
  };

  analyzeNPS = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { companyId, startDate, endDate } = req.body;
      if (!companyId) {
        res.status(400).json({ error: 'Company ID is required' });
        return;
      }

      const nps = await this.npsService.calculateNPS(
        companyId,
        startDate ? new Date(startDate) : undefined,
        endDate ? new Date(endDate) : undefined
      );
      res.json(nps);
    } catch (error: any) {
      next(error);
    }
  };

  getNPSTrends = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = parseInt(req.query.companyId as string);
      const period = (req.query.period as 'day' | 'week' | 'month') || 'month';

      if (!companyId) {
        res.status(400).json({ error: 'Company ID is required' });
        return;
      }

      const trends = await this.npsService.getNPSTrends(companyId, period);
      res.json(trends);
    } catch (error: any) {
      next(error);
    }
  };

  analyzeRootCauses = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { companyId, limit } = req.body;
      if (!companyId) {
        res.status(400).json({ error: 'Company ID is required' });
        return;
      }

      const rootCauses = await this.rootCauseService.analyzeRootCauses(companyId, limit || 50);
      res.json(rootCauses);
    } catch (error: any) {
      next(error);
    }
  };

  getRootCauses = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = req.query.companyId ? parseInt(req.query.companyId as string) : undefined;
      const rootCauses = await this.rootCauseService.getRootCauses(companyId);
      res.json(rootCauses);
    } catch (error: any) {
      next(error);
    }
  };

  getCompetitorAnalysis = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = parseInt(req.query.companyId as string);
      if (!companyId) {
        res.status(400).json({ error: 'Company ID is required' });
        return;
      }

      const analysis = await this.competitorService.compareWithCompetitors(companyId);
      res.json(analysis);
    } catch (error: any) {
      next(error);
    }
  };
}
