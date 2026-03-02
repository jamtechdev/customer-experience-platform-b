import { injectable, inject } from 'inversify';
import JourneyStage from '../models/JourneyStage';
import JourneyAnalysis from '../models/JourneyAnalysis';
import CustomerFeedback from '../models/CustomerFeedback';
import SentimentAnalysis from '../models/SentimentAnalysis';
import Touchpoint from '../models/Touchpoint';
import { TYPES } from '../config/types';
import { OfflineAnalysisService } from './OfflineAnalysisService';

export interface TouchpointSatisfaction {
  touchpoint: Touchpoint;
  satisfactionScore: number;
  dissatisfactionScore: number;
  feedbackCount: number;
  positiveCount: number;
  negativeCount: number;
  neutralCount: number;
  isPainPoint: boolean;
}

export interface JourneyStageAnalysis {
  stage: JourneyStage;
  satisfactionScore: number;
  dissatisfactionScore: number;
  feedbackCount: number;
  painPoints: string[];
  satisfactionPoints: string[];
}

@injectable()
export class JourneyAnalysisService {
  constructor(
    @inject(TYPES.OfflineAnalysisService) private offlineAnalysisService: OfflineAnalysisService
  ) {}
  async createStage(data: {
    name: string;
    description: string;
    order: number;
  }): Promise<JourneyStage> {
    return await JourneyStage.create(data);
  }

  async getStages(): Promise<JourneyStage[]> {
    return await JourneyStage.findAll({
      order: [['order', 'ASC']],
    });
  }

  /**
   * Map feedback records to journey stages
   */
  async mapFeedbackToJourney(companyId: number, feedbackIds: number[]): Promise<void> {
    const stages = await this.getStages();
    const feedback = await CustomerFeedback.findAll({
      where: {
        id: feedbackIds,
        companyId,
      },
    });

    for (const f of feedback) {
      const mappedStage = await this.mapFeedbackToStage(f, stages);
      if (mappedStage) {
        // Update feedback with stage mapping if needed
        // This could be stored in a separate mapping table or as a field on feedback
        // For now, we'll just ensure the journey analysis is updated
        await this.analyzeJourney(companyId);
      }
    }
  }

  /**
   * Map feedback to journey stages using keyword matching
   */
  private async mapFeedbackToStage(feedback: CustomerFeedback, stages: JourneyStage[]): Promise<JourneyStage | null> {
    const content = feedback.content.toLowerCase();
    
    // Journey stage keywords
    const stageKeywords: Record<string, string[]> = {
      awareness: ['discover', 'find', 'learn', 'heard', 'advertisement', 'ad', 'marketing', 'aware'],
      consideration: ['compare', 'research', 'looking', 'considering', 'evaluate', 'option', 'choice'],
      purchase: ['buy', 'purchase', 'order', 'checkout', 'payment', 'paid', 'transaction', 'bought'],
      delivery: ['delivery', 'shipping', 'arrived', 'received', 'package', 'deliver', 'ship'],
      usage: ['use', 'using', 'experience', 'product', 'service', 'app', 'software', 'platform'],
      support: ['support', 'help', 'assistance', 'service', 'customer service', 'contact', 'issue', 'problem'],
      retention: ['return', 'again', 'repeat', 'loyal', 'recommend', 'refer', 'come back'],
    };

    // Try to match feedback to stage
    for (const stage of stages) {
      const stageName = stage.name.toLowerCase();
      const keywords = stageKeywords[stageName] || [];
      
      // Check if any keyword matches
      for (const keyword of keywords) {
        if (content.includes(keyword)) {
          return stage;
        }
      }
      
      // Also check stage name itself
      if (content.includes(stageName)) {
        return stage;
      }
    }

    return null;
  }

  async analyzeJourney(companyId: number): Promise<JourneyStageAnalysis[]> {
    const stages = await this.getStages();
    const results: JourneyStageAnalysis[] = [];

    // Get all feedback for the company
    const feedback = await CustomerFeedback.findAll({
      where: { companyId },
      include: [{ model: SentimentAnalysis }],
    });

    for (const stage of stages) {
      // Map feedback to this stage
      const stageFeedback: CustomerFeedback[] = [];
      for (const f of feedback) {
        const mappedStage = await this.mapFeedbackToStage(f, stages);
        if (mappedStage && mappedStage.id === stage.id) {
          stageFeedback.push(f);
        }
      }

      // Calculate satisfaction and dissatisfaction
      let totalPositiveScore = 0;
      let totalNegativeScore = 0;
      let positiveCount = 0;
      let negativeCount = 0;
      let neutralCount = 0;
      const painPoints: string[] = [];
      const satisfactionPoints: string[] = [];

      for (const f of stageFeedback) {
        const analysis = (f as any).SentimentAnalysis;
        if (analysis) {
          if (analysis.sentiment === 'positive') {
            totalPositiveScore += analysis.score;
            positiveCount++;
            if (analysis.score > 0.5) {
              satisfactionPoints.push(f.content.substring(0, 100));
            }
          } else if (analysis.sentiment === 'negative') {
            totalNegativeScore += Math.abs(analysis.score);
            negativeCount++;
            if (analysis.score < -0.5) {
              painPoints.push(f.content.substring(0, 100));
            }
          } else {
            neutralCount++;
          }
        }
      }

      const satisfactionScore = positiveCount > 0 
        ? Math.round((totalPositiveScore / positiveCount) * 100) / 100 
        : 0;
      const dissatisfactionScore = negativeCount > 0 
        ? Math.round((totalNegativeScore / negativeCount) * 100) / 100 
        : 0;

      // Store or update journey analysis
      await JourneyAnalysis.create({
        stageId: stage.id,
        satisfactionScore: ((satisfactionScore + 1) / 2) * 10, // Convert to 0-10 scale
        feedbackCount: stageFeedback.length,
        date: new Date(),
      });

      results.push({
        stage,
        satisfactionScore: Math.round(satisfactionScore * 100) / 100,
        dissatisfactionScore: Math.round(dissatisfactionScore * 100) / 100,
        feedbackCount: stageFeedback.length,
        painPoints: painPoints.slice(0, 5),
        satisfactionPoints: satisfactionPoints.slice(0, 5),
      });
    }

    return results;
  }

  async analyzeTouchpoints(companyId: number): Promise<TouchpointSatisfaction[]> {
    const touchpoints = await Touchpoint.findAll({
      order: [['order', 'ASC']],
    });

    const results: TouchpointSatisfaction[] = [];

    for (const touchpoint of touchpoints) {
      const feedback = await CustomerFeedback.findAll({
        where: { companyId, touchpointId: touchpoint.id },
        include: [{ model: SentimentAnalysis }],
      });

      let totalPositiveScore = 0;
      let totalNegativeScore = 0;
      let positiveCount = 0;
      let negativeCount = 0;
      let neutralCount = 0;

      for (const f of feedback) {
        const analysis = (f as any).SentimentAnalysis;
        if (analysis) {
          if (analysis.sentiment === 'positive') {
            totalPositiveScore += analysis.score;
            positiveCount++;
          } else if (analysis.sentiment === 'negative') {
            totalNegativeScore += Math.abs(analysis.score);
            negativeCount++;
          } else {
            neutralCount++;
          }
        }
      }

      const satisfactionScore = positiveCount > 0 
        ? Math.round((totalPositiveScore / positiveCount) * 100) / 100 
        : 0;
      const dissatisfactionScore = negativeCount > 0 
        ? Math.round((totalNegativeScore / negativeCount) * 100) / 100 
        : 0;

      // Identify pain points (high dissatisfaction + high frequency)
      const isPainPoint = dissatisfactionScore > 0.6 && negativeCount >= 3;

      results.push({
        touchpoint,
        satisfactionScore,
        dissatisfactionScore,
        feedbackCount: feedback.length,
        positiveCount,
        negativeCount,
        neutralCount,
        isPainPoint,
      });
    }

    return results;
  }

  async getJourneyTrends(companyId: number): Promise<Array<{
    stage: JourneyStage;
    trends: Array<{
      date: string;
      satisfactionScore: number;
    }>;
  }>> {
    const stages = await this.getStages();
    const results = [];

    for (const stage of stages) {
      const analyses = await JourneyAnalysis.findAll({
        where: { stageId: stage.id },
        order: [['date', 'ASC']],
      });

      results.push({
        stage,
        trends: analyses.map((a) => ({
          date: a.date.toISOString().split('T')[0],
          satisfactionScore: a.satisfactionScore,
        })),
      });
    }

    return results;
  }
}
