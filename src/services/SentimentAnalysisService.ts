import { injectable, inject } from 'inversify';
import CustomerFeedback from '../models/CustomerFeedback';
import SentimentAnalysis from '../models/SentimentAnalysis';
import { OfflineAnalysisService } from './OfflineAnalysisService';
import { SentimentType } from '../config/constants';
import { TYPES } from '../config/types';

@injectable()
export class SentimentAnalysisService {
  constructor(
    @inject(TYPES.OfflineAnalysisService) private offlineAnalysisService: OfflineAnalysisService
  ) {}

  async analyzeFeedback(feedbackId: number): Promise<SentimentAnalysis> {
    const feedback = await CustomerFeedback.findByPk(feedbackId);
    if (!feedback) {
      throw new Error('Feedback not found');
    }

    // Check if analysis already exists
    let analysis = await SentimentAnalysis.findOne({ where: { feedbackId } });
    if (analysis) {
      return analysis;
    }

    // Analyze using offline sentiment analysis
    const result = await this.offlineAnalysisService.analyzeSentiment(feedback.content);

    // Create analysis record
    analysis = await SentimentAnalysis.create({
      feedbackId,
      sentiment: result.sentiment as SentimentType,
      score: result.score,
      keyPhrases: result.keyPhrases,
      emotions: result.emotions,
    });

    return analysis;
  }

  async analyzeBulk(feedbackIds: number[]): Promise<SentimentAnalysis[]> {
    const results: SentimentAnalysis[] = [];

    for (const feedbackId of feedbackIds) {
      try {
        const analysis = await this.analyzeFeedback(feedbackId);
        results.push(analysis);
      } catch (error) {
        console.error(`Failed to analyze feedback ${feedbackId}:`, error);
      }
    }

    return results;
  }

  async getSentimentStats(companyId?: number, startDate?: Date, endDate?: Date): Promise<{
    positive: number;
    negative: number;
    neutral: number;
    averageScore: number;
    total: number;
  }> {
    const where: any = {};
    if (companyId) {
      where.companyId = companyId;
    }

    const feedback = await CustomerFeedback.findAll({
      where,
      include: [{ model: SentimentAnalysis, required: true }],
    });

    if (startDate || endDate) {
      // Filter by date range
      const filtered = feedback.filter((f) => {
        const date = new Date(f.date);
        if (startDate && date < startDate) return false;
        if (endDate && date > endDate) return false;
        return true;
      });
      return this.calculateStats(filtered);
    }

    return this.calculateStats(feedback);
  }

  private calculateStats(feedback: CustomerFeedback[]): {
    positive: number;
    negative: number;
    neutral: number;
    averageScore: number;
    total: number;
  } {
    let positive = 0;
    let negative = 0;
    let neutral = 0;
    let totalScore = 0;
    const total = feedback.length;

    for (const f of feedback) {
      const analysis = (f as any).SentimentAnalysis;
      if (analysis) {
        if (analysis.sentiment === 'positive') positive++;
        else if (analysis.sentiment === 'negative') negative++;
        else neutral++;
        totalScore += analysis.score;
      }
    }

    return {
      positive,
      negative,
      neutral,
      averageScore: total > 0 ? totalScore / total : 0,
      total,
    };
  }
}
