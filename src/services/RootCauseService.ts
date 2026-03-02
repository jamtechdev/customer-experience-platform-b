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
    try {
      const where: any = {};
      if (companyId) {
        // Filter by company through feedback
        const feedback = await CustomerFeedback.findAll({
          where: { companyId },
          attributes: ['id'],
        });
        const feedbackIds = feedback.map((f) => f.id);
        
        if (feedbackIds.length > 0) {
          // Use contains operator for array fields
          const { Op } = require('sequelize');
          where.feedbackIds = {
            [Op.contains]: [feedbackIds[0]], // Check if array contains at least one feedback ID
          };
        } else {
          // No feedback for this company, return empty array
          return [];
        }
      }

      const rootCauses = await RootCause.findAll({
        where,
        order: [['priority', 'DESC'], ['createdAt', 'DESC']],
        limit: 100, // Limit to prevent too many results
      });

      // If companyId was provided, filter results to only include root causes with matching feedback
      if (companyId) {
        const feedback = await CustomerFeedback.findAll({
          where: { companyId },
          attributes: ['id'],
        });
        const feedbackIds = feedback.map((f) => f.id);
        
        return rootCauses.filter((rc) => {
          if (!rc.feedbackIds || !Array.isArray(rc.feedbackIds)) return false;
          return rc.feedbackIds.some((id: number) => feedbackIds.includes(id));
        });
      }

      return rootCauses;
    } catch (error: any) {
      console.error('Error getting root causes:', error);
      // Return empty array on error instead of throwing
      return [];
    }
  }

  async getRootCauseById(id: number): Promise<RootCause | null> {
    return await RootCause.findByPk(id);
  }

  async analyzeComplaints(companyId: number, complaintTexts: string[]): Promise<RootCause[]> {
    if (complaintTexts.length === 0) {
      return [];
    }

    // Analyze using offline root cause analysis
    const analysis = await this.offlineAnalysisService.analyzeRootCauses(complaintTexts);

    // Get feedback IDs for these complaints
    const feedback = await CustomerFeedback.findAll({
      where: {
        companyId,
        content: {
          [require('sequelize').Op.in]: complaintTexts,
        },
      },
    });

    const rootCauses: RootCause[] = [];

    for (const cause of analysis.rootCauses) {
      const feedbackIds = feedback
        .filter((f) => f.content.toLowerCase().includes(cause.title.toLowerCase()))
        .map((f) => f.id);

      if (feedbackIds.length > 0) {
        // Check if root cause already exists
        const existing = await RootCause.findOne({
          where: {
            title: cause.title,
            category: cause.category,
          },
        });

        if (!existing) {
          const rootCause = await RootCause.create({
            title: cause.title,
            description: cause.description,
            category: cause.category,
            feedbackIds,
            priority: cause.priority as AlertPriority,
          });
          rootCauses.push(rootCause);
        } else {
          // Update existing root cause with new feedback IDs
          const updatedIds = [...new Set([...existing.feedbackIds, ...feedbackIds])];
          await existing.update({ feedbackIds: updatedIds });
          rootCauses.push(existing);
        }
      }
    }

    return rootCauses;
  }
}
