import { Request, Response, NextFunction } from 'express';
import { AIRecommendationService } from '../services/AIRecommendationService';
import container from '../config/container';
import { TYPES } from '../config/types';

export class RecommendationController {
  private recommendationService: AIRecommendationService;

  constructor() {
    this.recommendationService = container.get<AIRecommendationService>(TYPES.AIRecommendationService);
  }

  generateRecommendations = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { companyId } = req.body;
      if (!companyId) {
        res.status(400).json({ error: 'Company ID is required' });
        return;
      }

      const recommendations = await this.recommendationService.generateRecommendations(companyId);
      res.json(recommendations);
    } catch (error: any) {
      next(error);
    }
  };

  getRecommendations = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = req.query.companyId ? parseInt(req.query.companyId as string) : undefined;
      const priority = req.query.priority as string | undefined;

      const recommendations = await this.recommendationService.getRecommendations(companyId, priority as any);
      res.json(recommendations);
    } catch (error: any) {
      next(error);
    }
  };
}
