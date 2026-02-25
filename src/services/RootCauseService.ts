import { injectable, inject } from 'inversify';
import CustomerFeedback from '../models/CustomerFeedback';
import RootCause from '../models/RootCause';
import SentimentAnalysis from '../models/SentimentAnalysis';
import { OfflineAnalysisService } from './OfflineAnalysisService';
import { AlertPriority } from '../config/constants';
import { TYPES } from '../config/types';

@injectable()
export class RootCauseService {
  constructor(
    @inject(TYPES.OfflineAnalysisService) private offlineAnalysisService: OfflineAnalysisService
  ) {}

  async analyzeRootCauses(companyId: number, limit: number = 50): Promise<RootCause[]> {
    // Get negative feedback
    const negativeFeedback = await CustomerFeedback.findAll({
      where: { companyId },
      include: [
        {
          model: SentimentAnalysis,
          where: { sentiment: 'negative' },
          required: true,
        },
      ],
      limit,
      order: [['date', 'DESC']],
    });

    if (negativeFeedback.length === 0) {
      return [];
    }

    const feedbackTexts = negativeFeedback.map((f) => f.content);

    // Analyze using offline root cause analysis
    const analysis = await this.offlineAnalysisService.analyzeRootCauses(feedbackTexts);

    // Create root cause records
    const rootCauses: RootCause[] = [];

    for (const cause of analysis.rootCauses) {
      const feedbackIds = negativeFeedback
        .filter((f) => f.content.toLowerCase().includes(cause.title.toLowerCase()))
        .map((f) => f.id);

      if (feedbackIds.length > 0) {
        const rootCause = await RootCause.create({
          title: cause.title,
          description: cause.description,
          category: cause.category,
          feedbackIds,
          priority: cause.priority as AlertPriority,
        });
        rootCauses.push(rootCause);
      }
    }

    return rootCauses;
  }

  async getRootCauses(companyId?: number): Promise<RootCause[]> {
    const where: any = {};
    if (companyId) {
      // Filter by company through feedback
      const feedback = await CustomerFeedback.findAll({
        where: { companyId },
        attributes: ['id'],
      });
      const feedbackIds = feedback.map((f) => f.id);
      where.feedbackIds = {
        [require('sequelize').Op.overlap]: feedbackIds,
      };
    }

    return await RootCause.findAll({
      where,
      order: [['priority', 'DESC'], ['createdAt', 'DESC']],
    });
  }

  async getRootCauseById(id: number): Promise<RootCause | null> {
    return await RootCause.findByPk(id);
  }
}
