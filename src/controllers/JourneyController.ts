import { Request, Response, NextFunction } from 'express';
import { JourneyAnalysisService } from '../services/JourneyAnalysisService';
import container from '../config/container';
import { TYPES } from '../config/types';
import { AppError } from '../middleware/errorHandler';
import {
  successHandler,
  errorHandler,
  serverErrorHandler,
} from '../utils/responseHandler';

export class JourneyController {
  private journeyService: JourneyAnalysisService;

  constructor() {
    this.journeyService = container.get<JourneyAnalysisService>(TYPES.JourneyAnalysisService);
  }

  getStages = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const stages = await this.journeyService.getStages();
      successHandler(res, stages, 200, 'Journey stages retrieved successfully');
    } catch (error: any) {
      if (error instanceof AppError) {
        errorHandler(res, error.statusCode, error.message);
        return;
      }
      serverErrorHandler(res, error);
    }
  };

  analyzeJourney = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = parseInt(req.query.companyId as string);
      if (!companyId) {
        errorHandler(res, 400, 'Company ID is required');
        return;
      }

      const analysis = await this.journeyService.analyzeJourney(companyId);
      successHandler(res, analysis, 200, 'Journey analysis completed successfully');
    } catch (error: any) {
      if (error instanceof AppError) {
        errorHandler(res, error.statusCode, error.message);
        return;
      }
      serverErrorHandler(res, error);
    }
  };

  getJourneyTrends = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = parseInt(req.query.companyId as string);
      if (!companyId) {
        errorHandler(res, 400, 'Company ID is required');
        return;
      }

      const trends = await this.journeyService.getJourneyTrends(companyId);
      successHandler(res, trends, 200, 'Journey trends retrieved successfully');
    } catch (error: any) {
      if (error instanceof AppError) {
        errorHandler(res, error.statusCode, error.message);
        return;
      }
      serverErrorHandler(res, error);
    }
  };
}
