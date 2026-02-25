import { Request, Response, NextFunction } from 'express';
import { AIRecommendationService } from '../services/AIRecommendationService';
import container from '../config/container';
import { TYPES } from '../config/types';
import { AppError } from '../middleware/errorHandler';
import {
  successHandler,
  errorHandler,
  serverErrorHandler,
} from '../utils/responseHandler';

export class RecommendationController {
  private recommendationService: AIRecommendationService;

  constructor() {
    this.recommendationService = container.get<AIRecommendationService>(TYPES.AIRecommendationService);
  }

  generateRecommendations = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { companyId } = req.body;
      if (!companyId) {
        errorHandler(res, 400, 'Company ID is required');
        return;
      }

      const recommendations = await this.recommendationService.generateRecommendations(companyId);
      successHandler(res, recommendations, 200, 'Recommendations generated successfully');
    } catch (error: any) {
      if (error instanceof AppError) {
        errorHandler(res, error.statusCode, error.message);
        return;
      }
      serverErrorHandler(res, error);
    }
  };

  getRecommendations = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = req.query.companyId ? parseInt(req.query.companyId as string) : undefined;
      const priority = req.query.priority as string | undefined;

      const recommendations = await this.recommendationService.getRecommendations(companyId, priority as any);
      successHandler(res, recommendations, 200, 'Recommendations retrieved successfully');
    } catch (error: any) {
      if (error instanceof AppError) {
        errorHandler(res, error.statusCode, error.message);
        return;
      }
      serverErrorHandler(res, error);
    }
  };
}
