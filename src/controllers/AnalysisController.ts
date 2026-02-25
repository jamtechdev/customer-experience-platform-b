import { Request, Response, NextFunction } from 'express';
import { SentimentAnalysisService } from '../services/SentimentAnalysisService';
import { NPSService } from '../services/NPSService';
import { RootCauseService } from '../services/RootCauseService';
import { CompetitorAnalysisService } from '../services/CompetitorAnalysisService';
import container from '../config/container';
import { TYPES } from '../config/types';
import { AppError } from '../middleware/errorHandler';
import {
  successHandler,
  errorHandler,
  serverErrorHandler,
} from '../utils/responseHandler';

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
        errorHandler(res, 400, 'Feedback ID is required');
        return;
      }

      const analysis = await this.sentimentService.analyzeFeedback(feedbackId);
      successHandler(res, analysis, 200, 'Sentiment analysis completed successfully');
    } catch (error: any) {
      if (error instanceof AppError) {
        errorHandler(res, error.statusCode, error.message);
        return;
      }
      serverErrorHandler(res, error);
    }
  };

  getSentimentStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = req.query.companyId ? parseInt(req.query.companyId as string) : undefined;
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

      const stats = await this.sentimentService.getSentimentStats(companyId, startDate, endDate);
      successHandler(res, stats, 200, 'Sentiment statistics retrieved successfully');
    } catch (error: any) {
      if (error instanceof AppError) {
        errorHandler(res, error.statusCode, error.message);
        return;
      }
      serverErrorHandler(res, error);
    }
  };

  analyzeNPS = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { companyId, startDate, endDate } = req.body;
      if (!companyId) {
        errorHandler(res, 400, 'Company ID is required');
        return;
      }

      const nps = await this.npsService.calculateNPS(
        companyId,
        startDate ? new Date(startDate) : undefined,
        endDate ? new Date(endDate) : undefined
      );
      successHandler(res, nps, 200, 'NPS analysis completed successfully');
    } catch (error: any) {
      if (error instanceof AppError) {
        errorHandler(res, error.statusCode, error.message);
        return;
      }
      serverErrorHandler(res, error);
    }
  };

  getNPSTrends = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = parseInt(req.query.companyId as string);
      const period = (req.query.period as 'day' | 'week' | 'month') || 'month';

      if (!companyId) {
        errorHandler(res, 400, 'Company ID is required');
        return;
      }

      const trends = await this.npsService.getNPSTrends(companyId, period);
      successHandler(res, trends, 200, 'NPS trends retrieved successfully');
    } catch (error: any) {
      if (error instanceof AppError) {
        errorHandler(res, error.statusCode, error.message);
        return;
      }
      serverErrorHandler(res, error);
    }
  };

  analyzeRootCauses = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { companyId, limit } = req.body;
      if (!companyId) {
        errorHandler(res, 400, 'Company ID is required');
        return;
      }

      const rootCauses = await this.rootCauseService.analyzeRootCauses(companyId, limit || 50);
      successHandler(res, rootCauses, 200, 'Root cause analysis completed successfully');
    } catch (error: any) {
      if (error instanceof AppError) {
        errorHandler(res, error.statusCode, error.message);
        return;
      }
      serverErrorHandler(res, error);
    }
  };

  getRootCauses = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = req.query.companyId ? parseInt(req.query.companyId as string) : undefined;
      const rootCauses = await this.rootCauseService.getRootCauses(companyId);
      successHandler(res, rootCauses, 200, 'Root causes retrieved successfully');
    } catch (error: any) {
      if (error instanceof AppError) {
        errorHandler(res, error.statusCode, error.message);
        return;
      }
      serverErrorHandler(res, error);
    }
  };

  getCompetitorAnalysis = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = parseInt(req.query.companyId as string);
      if (!companyId) {
        errorHandler(res, 400, 'Company ID is required');
        return;
      }

      const analysis = await this.competitorService.compareWithCompetitors(companyId);
      successHandler(res, analysis, 200, 'Competitor analysis retrieved successfully');
    } catch (error: any) {
      if (error instanceof AppError) {
        errorHandler(res, error.statusCode, error.message);
        return;
      }
      serverErrorHandler(res, error);
    }
  };
}
