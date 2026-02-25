import { injectable, inject } from 'inversify';
import AIRecommendation from '../models/AIRecommendation';
import RootCause from '../models/RootCause';
import { OfflineAnalysisService } from './OfflineAnalysisService';
import { AlertPriority } from '../config/constants';
import SentimentAnalysis from '../models/SentimentAnalysis';
import CustomerFeedback from '../models/CustomerFeedback';
import { TYPES } from '../config/types';

@injectable()
export class AIRecommendationService {
  constructor(
    @inject(TYPES.OfflineAnalysisService) private offlineAnalysisService: OfflineAnalysisService
  ) {}

  async generateRecommendations(companyId: number): Promise<AIRecommendation[]> {
    // Gather context
    const rootCauses = await RootCause.findAll({
      where: {},
      limit: 10,
      order: [['priority', 'DESC']],
    });

    const negativeFeedback = await CustomerFeedback.findAll({
      where: { companyId },
      include: [
        {
          model: SentimentAnalysis,
          where: { sentiment: 'negative' },
          required: true,
        },
      ],
      limit: 20,
    });

    // Build context string
    let context = 'Customer Experience Analysis:\n\n';
    context += `Root Causes Identified: ${rootCauses.length}\n`;
    context += rootCauses.map((rc) => `- ${rc.title}: ${rc.description}`).join('\n');
    context += `\n\nNegative Feedback Samples: ${negativeFeedback.length}\n`;
    context += negativeFeedback.slice(0, 5).map((f) => `- ${f.content.substring(0, 100)}...`).join('\n');

    // Generate recommendations using offline analysis
    const result = await this.offlineAnalysisService.generateRecommendations(context);

    // Create recommendation records
    const recommendations: AIRecommendation[] = [];

    for (const rec of result.recommendations) {
      // Try to link to a relevant root cause
      let rootCauseId: number | undefined;
      const matchingRootCause = rootCauses.find(
        (rc) => rc.category === rec.category || rc.title.toLowerCase().includes(rec.title.toLowerCase())
      );
      if (matchingRootCause) {
        rootCauseId = matchingRootCause.id;
      }

      const recommendation = await AIRecommendation.create({
        title: rec.title,
        description: rec.description,
        priority: rec.priority as AlertPriority,
        category: rec.category,
        rootCauseId,
        impact: rec.impact,
        effort: rec.effort,
      });

      recommendations.push(recommendation);
    }

    return recommendations;
  }

  async getRecommendations(companyId?: number, priority?: AlertPriority): Promise<AIRecommendation[]> {
    const where: any = {};
    if (priority) {
      where.priority = priority;
    }

    const recommendations = await AIRecommendation.findAll({
      where,
      include: [{ model: RootCause }],
      order: [['priority', 'DESC'], ['createdAt', 'DESC']],
    });

    // Filter by company if needed (through root causes)
    if (companyId) {
      // This would require additional filtering logic
      return recommendations;
    }

    return recommendations;
  }

  async getRecommendationById(id: number): Promise<AIRecommendation | null> {
    return await AIRecommendation.findByPk(id, {
      include: [{ model: RootCause }],
    });
  }
}
