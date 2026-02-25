import { injectable } from 'inversify';
import Touchpoint from '../models/Touchpoint';
import CustomerFeedback from '../models/CustomerFeedback';
import SentimentAnalysis from '../models/SentimentAnalysis';

@injectable()
export class TouchpointService {
  async createTouchpoint(data: {
    name: string;
    description: string;
    category: string;
    order: number;
  }): Promise<Touchpoint> {
    return await Touchpoint.create(data);
  }

  async getTouchpoints(): Promise<Touchpoint[]> {
    return await Touchpoint.findAll({
      order: [['order', 'ASC']],
    });
  }

  async getTouchpointById(id: number): Promise<Touchpoint | null> {
    return await Touchpoint.findByPk(id);
  }

  async updateTouchpoint(id: number, data: Partial<Touchpoint>): Promise<Touchpoint> {
    const touchpoint = await Touchpoint.findByPk(id);
    if (!touchpoint) {
      throw new Error('Touchpoint not found');
    }

    await touchpoint.update(data);
    return touchpoint;
  }

  async deleteTouchpoint(id: number): Promise<void> {
    const touchpoint = await Touchpoint.findByPk(id);
    if (!touchpoint) {
      throw new Error('Touchpoint not found');
    }

    await touchpoint.destroy();
  }

  async getTouchpointPerformance(touchpointId: number): Promise<{
    touchpoint: Touchpoint;
    feedbackCount: number;
    averageSentiment: number;
    positiveCount: number;
    negativeCount: number;
    neutralCount: number;
  }> {
    const touchpoint = await Touchpoint.findByPk(touchpointId);
    if (!touchpoint) {
      throw new Error('Touchpoint not found');
    }

    const feedback = await CustomerFeedback.findAll({
      where: { touchpointId },
      include: [{ model: SentimentAnalysis }],
    });

    let totalSentiment = 0;
    let sentimentCount = 0;
    let positiveCount = 0;
    let negativeCount = 0;
    let neutralCount = 0;

    for (const f of feedback) {
      const analysis = (f as any).SentimentAnalysis;
      if (analysis) {
        totalSentiment += analysis.score;
        sentimentCount++;
        if (analysis.sentiment === 'positive') positiveCount++;
        else if (analysis.sentiment === 'negative') negativeCount++;
        else neutralCount++;
      }
    }

    return {
      touchpoint,
      feedbackCount: feedback.length,
      averageSentiment: sentimentCount > 0 ? totalSentiment / sentimentCount : 0,
      positiveCount,
      negativeCount,
      neutralCount,
    };
  }
}
